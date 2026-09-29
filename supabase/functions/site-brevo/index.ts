// site-brevo — passerelle sécurisée entre le site ornellafitcoaching.com et Brevo.
// La clé Brevo reste côté serveur (secret Supabase), jamais dans le site.
//
// Opérations (paramètre ?op=) :
//   contacts  POST  { email, attributes, listIds }            → crée / met à jour un contact
//   email     POST  { to, subject, htmlContent | templateId, params, sender?, replyTo? } → e-mail transactionnel
//   in-list   GET   ?email=…&list=…                           → { inList: boolean }
//   panier    POST  { email, prenom, link, page }             → enregistre un panier + renvoie l'URL Stripe pré-remplie
//   stop      GET   ?t=<jeton>                                → arrête les relances d'un panier (lien dans les e-mails)
//
// Secrets : BREVO_API_KEY (obligatoire). PANIER_LIST_ID (optionnel, sinon la liste « Paniers abandonnés » est trouvée / créée).

import { createClient } from "npm:@supabase/supabase-js@2";

const BREVO = "https://api.brevo.com/v3";
const SENDER_EMAIL = "contact@ornellafitcoaching.com";
const SENDER_NAMES = ["Ornella Fit Coaching", "Ornella — Ornella Fit Coaching", "Ornella"];
const REPLY_TO_OK = ["ornellaracano@icloud.com", "contact@ornellafitcoaching.com", "ornellafit.coaching@gmail.com"];
const ALLOWED_ORIGINS = [
  "https://www.ornellafitcoaching.com",
  "https://ornellafitcoaching.com",
  "https://ornellafitcoaching-svg.github.io",
];
// Domaines autorisés dans les liens / images des e-mails (empêche tout usage en relais de phishing)
const ALLOWED_HOSTS = [
  "ornellafitcoaching.com", "wa.me", "youtube.com", "youtu.be", "instagram.com", "buy.stripe.com",
  "calendly.com", "fonts.googleapis.com", "fonts.gstatic.com", "pinterest.com", "share.google",
  "ornellafitcoaching-svg.github.io", "ornellafitcoaching.etsy.com", "docs.google.com", "forms.gle",
  "w3.org", "tiktok.com", "facebook.com", "google.com", "g.page",
];

// Liens de paiement Stripe acceptés pour les paniers : produit + montant affiché
const PAYMENT_LINKS: Record<string, { produit: string; montant: number }> = {
  "https://buy.stripe.com/00w00jas9aS7bMx0Dz8Vi0z": { produit: "Planner Ventre & Fessiers", montant: 12.75 },
  "https://buy.stripe.com/fZu00jbwdbWbeYJ2LH8Vi0y": { produit: "Fit dans ta Vie", montant: 49 },
  "https://buy.stripe.com/6oUfZh7fX1hxdUF9a58Vi0w": { produit: "Fit dans ta Vie", montant: 49 },
  "https://buy.stripe.com/7sY5kD6bT2lBeYJbid8Vi0v": { produit: "Fit dans ta Vie", montant: 29 },
  "https://buy.stripe.com/9B6aEX0Rz1hx6sd9a58Vi0x": { produit: "Consultation personnalisée 45 min", montant: 49 },
  "https://buy.stripe.com/aFa00jfMt9O32bX3PL8Vi0u": { produit: "Iron Girl (offre bundle)", montant: 39 },
  "https://buy.stripe.com/9B6aEX7fX9O317Teup8Vi0r": { produit: "Pack Maman", montant: 27 },
  "https://buy.stripe.com/00w8wP7fXgcr8Al3PL8Vi0q": { produit: "Iron Girl", montant: 49 },
  "https://buy.stripe.com/bJefZh1VD5xNaIt9a58Vi0p": { produit: "Diagnostic Distanciel", montant: 10 },
  "https://buy.stripe.com/bJeeVdgQx6BRg2N4TP8Vi0o": { produit: "Guide Recettes Sculptantes", montant: 7 },
  "https://buy.stripe.com/8x2eVdcAhgcr4k5bid8Vi0m": { produit: "Ageless Girl", montant: 12 },
  "https://buy.stripe.com/fZu7sL43L0dt3g12LH8Vi0e": { produit: "Ageless Girl", montant: 17 },
  "https://buy.stripe.com/eVq4gzfMtd0f17T2LH8Vi0l": { produit: "Ventre Plat", montant: 8 },
  "https://buy.stripe.com/9B69AT7fXbWb9Epfyt8Vi09": { produit: "Ventre Plat", montant: 12 },
  "https://buy.stripe.com/8x28wP0Rz7FV17Tae98Vi0k": { produit: "Booty Sculpt", montant: 12 },
  "https://buy.stripe.com/00w00j6bTbWb8Al0Dz8Vi06": { produit: "Booty Sculpt", montant: 19 },
  "https://buy.stripe.com/bJe14n57P6BRaItbid8Vi0j": { produit: "Morpho Summer V", montant: 12 },
  "https://buy.stripe.com/aFaaEX7fXe4j6sd9a58Vi0i": { produit: "Morpho Summer O", montant: 12 },
  "https://buy.stripe.com/4gMdR92ZH9O3dUFbid8Vi0h": { produit: "Morpho Summer X", montant: 12 },
  "https://buy.stripe.com/bJe14nfMt4tJ4k5dql8Vi0g": { produit: "Morpho Summer H", montant: 12 },
  "https://buy.stripe.com/4gMdR9fMt0dt5o92LH8Vi0f": { produit: "Morpho Summer A", montant: 12 },
  "https://buy.stripe.com/00wfZhcAhaS76sdfyt8Vi0d": { produit: "Ventre Plat Après Bébé", montant: 17 },
  "https://buy.stripe.com/14A7sLbwd3pF03P1HD8Vi0c": { produit: "Summer Body Challenge", montant: 19 },
  "https://buy.stripe.com/7sY14n57P2lB5o98618Vi0a": { produit: "Bundle Booty Sculpt + Ventre Plat", montant: 25 },
  "https://buy.stripe.com/9B6fZhgQxd0f7whfyt8Vi08": { produit: "Coaching à distance 3 mois", montant: 99 },
  "https://buy.stripe.com/eVq6oH6bT0dteYJ2LH8Vi07": { produit: "Programme distanciel + nutrition 8 semaines", montant: 119 },
  "https://buy.stripe.com/9B67sL7fXgcr03P5XT8Vi04": { produit: "Coaching en ligne mensuel", montant: 119 },
  "https://buy.stripe.com/8x26oHas9f8n5o9cmh8Vi03": { produit: "Programme sur-mesure 8 semaines", montant: 79 },
};

// Modèles Brevo que le site a le droit d'envoyer (quiz, guides, confirmations…)
const TEMPLATES_OK = [10, 12, 13, 14, 15, 79, 93, 131, 147, 160];

// Limites anti-abus
const LIMIT_IP_10MIN = 25;        // toutes opérations confondues, par IP
const LIMIT_EMAIL_PER_DAY = 6;    // e-mails envoyés à une même adresse par 24 h
const LIMIT_EMAILS_GLOBAL_DAY = 600;

const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
let panierListId: number | null = Number(Deno.env.get("PANIER_LIST_ID")) || null;
let attributesReady = false;

const EMAIL_RE = /^[^\s@<>"',;]{1,64}@[^\s@<>"',;]{1,190}\.[a-z]{2,24}$/i;

function cors(origin: string | null) {
  const allow = origin && (ALLOWED_ORIGINS.includes(origin) || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1"))
    ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, api-key, accept, authorization, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
}

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s + "|ofc-salt-2026"));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

async function logEvent(ip_hash: string, op: string, email: string | null, page: string | null, ok: boolean) {
  await supa.from("site_events").insert({ ip_hash, op, email: email?.toLowerCase() ?? null, page: page?.slice(0, 200) ?? null, ok });
}

async function countSince(filter: Record<string, string>, minutes: number) {
  let q = supa.from("site_events").select("id", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - minutes * 60_000).toISOString());
  for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
  const { count } = await q;
  return count ?? 0;
}

function hostAllowed(host: string) {
  host = host.toLowerCase();
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
}

function linksAreSafe(html: string) {
  const urls = html.match(/https?:\/\/[^\s"'<>)\\]+/gi) ?? [];
  for (const u of urls) {
    try {
      if (!hostAllowed(new URL(u).hostname)) return u;
    } catch { return u; }
  }
  if (/<script|<iframe|<form|javascript:/i.test(html)) return "contenu interdit";
  return null;
}

function cleanAttributes(a: unknown) {
  const out: Record<string, string | number | boolean> = {};
  if (!a || typeof a !== "object") return out;
  let n = 0;
  for (const [k, v] of Object.entries(a as Record<string, unknown>)) {
    if (n >= 25) break;
    if (!/^[A-Z0-9_]{1,40}$/.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 500);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
    else continue;
    n++;
  }
  return out;
}

function cleanListIds(l: unknown) {
  if (!Array.isArray(l)) return [];
  return l.map(Number).filter((x) => Number.isInteger(x) && x > 0 && x < 1000).slice(0, 5);
}

async function brevo(path: string, init: RequestInit = {}) {
  return await fetch(BREVO + path, {
    ...init,
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json", accept: "application/json", ...(init.headers ?? {}) },
  });
}

async function upsertContact(email: string, attributes: Record<string, unknown>, listIds: number[], unlinkListIds: number[] = []) {
  const body: Record<string, unknown> = { email, updateEnabled: true };
  if (Object.keys(attributes).length) body.attributes = attributes;
  if (listIds.length) body.listIds = listIds;
  if (unlinkListIds.length) body.unlinkListIds = unlinkListIds;
  return await brevo("/contacts", { method: "POST", body: JSON.stringify(body) });
}

async function ensurePanierSetup() {
  if (!attributesReady) {
    for (const name of ["PANIER_PRODUIT", "PANIER_DATE", "PANIER_STATUT", "PANIER_MONTANT"]) {
      // 400 si l'attribut existe déjà : sans importance
      await brevo(`/contacts/attributes/normal/${name}`, { method: "POST", body: JSON.stringify({ type: "text" }) }).catch(() => {});
    }
    attributesReady = true;
  }
  if (!panierListId) {
    const r = await brevo("/contacts/lists?limit=50&offset=0");
    const data = r.ok ? await r.json() : { lists: [] };
    const found = (data.lists ?? []).find((l: { name: string }) => l.name === "Paniers abandonnés");
    if (found) panierListId = found.id;
    else {
      const c = await brevo("/contacts/lists", { method: "POST", body: JSON.stringify({ name: "Paniers abandonnés", folderId: 1 }) });
      if (c.ok) panierListId = (await c.json()).id;
    }
  }
  return panierListId;
}

const STOP_PAGE = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C'est noté</title></head>
<body style="margin:0;font-family:Arial,sans-serif;background:#FAF7F4;color:#2C1F1A;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
<div style="max-width:420px;background:#fff;border-radius:18px;padding:36px 28px;text-align:center;">
<p style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px;">C'est noté 🤍</p>
<p style="font-size:15px;line-height:1.7;color:#6F5B52;margin:0 0 24px;">Tu ne recevras plus de rappel pour cette commande.</p>
<a href="https://www.ornellafitcoaching.com" style="display:inline-block;background:#C96358;color:#fff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:50px;">Retour au site</a></div></body></html>`;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });

  const url = new URL(req.url);
  const op = url.searchParams.get("op") ?? "";

  // ---------- stop (lien « ne plus recevoir de rappel ») ----------
  if (op === "stop" && req.method === "GET") {
    const t = url.searchParams.get("t") ?? "";
    if (/^[0-9a-f-]{36}$/i.test(t)) {
      const { data } = await supa.from("paniers").select("email").eq("stop_token", t).limit(1);
      if (data && data.length) {
        await supa.from("paniers").update({ statut: "stop" }).ilike("email", data[0].email).eq("statut", "ouvert");
      }
    }

    return new Response(STOP_PAGE, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (!BREVO_KEY) return json({ error: "configuration manquante" }, 503, origin);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "inconnue";
  const ipHash = await sha(ip);

  if (origin && !ALLOWED_ORIGINS.includes(origin) && !origin.startsWith("http://localhost") && !origin.startsWith("http://127.0.0.1")) {
    return json({ error: "origine refusée" }, 403, origin);
  }
  if ((await countSince({ ip_hash: ipHash }, 10)) >= LIMIT_IP_10MIN) {
    await logEvent(ipHash, op, null, null, false);
    return json({ error: "trop de requêtes" }, 429, origin);
  }

  try {
    // ---------- in-list (roue de la chance) ----------
    if (op === "in-list" && req.method === "GET") {
      const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
      const list = Number(url.searchParams.get("list"));
      if (!EMAIL_RE.test(email) || !Number.isInteger(list)) return json({ error: "paramètres invalides" }, 400, origin);
      await logEvent(ipHash, op, email, null, true);
      const r = await brevo(`/contacts/${encodeURIComponent(email)}`);
      if (!r.ok) return json({ inList: false }, 200, origin);
      const c = await r.json();
      return json({ inList: Array.isArray(c.listIds) && c.listIds.includes(list) }, 200, origin);
    }

    if (req.method !== "POST") return json({ error: "méthode" }, 405, origin);
    const body = await req.json().catch(() => ({}));
    const page = String(body.page ?? req.headers.get("referer") ?? "").slice(0, 200);

    // ---------- contacts ----------
    if (op === "contacts") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return json({ error: "email invalide" }, 400, origin);
      const r = await upsertContact(email, cleanAttributes(body.attributes), cleanListIds(body.listIds));
      await logEvent(ipHash, op, email, page, r.ok);
      const txt = await r.text();
      return new Response(txt || "{}", { status: r.status, headers: { ...cors(origin), "Content-Type": "application/json" } });
    }

    // ---------- email ----------
    if (op === "email") {
      const to = Array.isArray(body.to) ? body.to : [];
      if (to.length !== 1) return json({ error: "un seul destinataire" }, 400, origin);
      const email = String(to[0]?.email ?? "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return json({ error: "email invalide" }, 400, origin);
      if ((await countSince({ email, op: "email" }, 24 * 60)) >= LIMIT_EMAIL_PER_DAY) return json({ error: "limite atteinte" }, 429, origin);
      if ((await countSince({ op: "email" }, 24 * 60)) >= LIMIT_EMAILS_GLOBAL_DAY) return json({ error: "limite globale" }, 429, origin);

      const senderName = SENDER_NAMES.includes(body.sender?.name) ? body.sender.name : SENDER_NAMES[0];
      const payload: Record<string, unknown> = {
        sender: { name: senderName, email: SENDER_EMAIL },
        to: [{ email, name: String(to[0]?.name ?? "").slice(0, 80) || undefined }],
      };
      const replyTo = String(body.replyTo?.email ?? "").toLowerCase();
      if (REPLY_TO_OK.includes(replyTo)) payload.replyTo = { email: replyTo, name: "Ornella Fit Coaching" };

      if (body.templateId != null) {
        const t = Number(body.templateId);
        if (!TEMPLATES_OK.includes(t)) return json({ error: "template invalide" }, 400, origin);
        payload.templateId = t;
        if (body.params && typeof body.params === "object") {
          const p: Record<string, string | number> = {};
          for (const [k, v] of Object.entries(body.params).slice(0, 30)) {
            if (typeof v === "string") p[k] = v.slice(0, 1000);
            else if (typeof v === "number") p[k] = v;
          }
          payload.params = p;
        }
        if (typeof body.subject === "string") payload.subject = body.subject.slice(0, 200);
      } else {
        const subject = String(body.subject ?? "").slice(0, 200);
        const html = String(body.htmlContent ?? "");
        if (!subject || !html || html.length > 250_000) return json({ error: "contenu invalide" }, 400, origin);
        const bad = linksAreSafe(html);
        if (bad) {
          await logEvent(ipHash, "email-refuse", email, page, false);
          return json({ error: "lien non autorisé", detail: bad.slice(0, 120) }, 400, origin);
        }
        payload.subject = subject;
        payload.htmlContent = html;
      }
      const r = await brevo("/smtp/email", { method: "POST", body: JSON.stringify(payload) });
      await logEvent(ipHash, "email", email, page, r.ok);
      const txt = await r.text();
      return new Response(txt || "{}", { status: r.status, headers: { ...cors(origin), "Content-Type": "application/json" } });
    }

    // ---------- panier ----------
    if (op === "panier") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const prenom = String(body.prenom ?? "").trim().slice(0, 60);
      const link = String(body.link ?? "").split("?")[0];
      const info = PAYMENT_LINKS[link];
      if (!EMAIL_RE.test(email)) return json({ error: "email invalide" }, 400, origin);
      if (!info) return json({ url: link }, 200, origin); // lien inconnu : on laisse passer sans rien enregistrer
      const redirect = `${link}?prefilled_email=${encodeURIComponent(email)}`;
      await logEvent(ipHash, op, email, page, true);

      // même panier dans les 30 dernières minutes : on ne recrée rien
      const { data: recent } = await supa.from("paniers").select("id")
        .ilike("email", email).eq("payment_link", link).eq("statut", "ouvert")
        .gte("created_at", new Date(Date.now() - 30 * 60_000).toISOString()).limit(1);
      if (recent && recent.length) return json({ url: redirect }, 200, origin);

      // un nouveau panier remplace les anciens paniers ouverts de la même personne (une seule série de relances)
      await supa.from("paniers").update({ statut: "expire" }).ilike("email", email).eq("statut", "ouvert");
      await supa.from("paniers").insert({
        email, prenom: prenom || null, produit: info.produit, montant: info.montant, payment_link: link, page,
        test: body.test === true,
      });

      // Brevo en arrière-plan (fiche contact visible par Ornella) : la cliente part tout de suite sur Stripe
      const work = (async () => {
        const listId = await ensurePanierSetup();
        const attrs: Record<string, string> = {
          PANIER_PRODUIT: info.produit,
          PANIER_MONTANT: String(info.montant).replace(".", ","),
          PANIER_DATE: new Date().toISOString().slice(0, 10),
          PANIER_STATUT: "ouvert",
        };
        if (prenom) attrs.PRENOM = prenom;
        await upsertContact(email, attrs, listId ? [listId] : []);
      })().catch((e) => console.error("brevo panier", e));
      // @ts-ignore EdgeRuntime existe sur Supabase
      if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work); else await work;

      return json({ url: redirect }, 200, origin);
    }

    return json({ error: "opération inconnue" }, 400, origin);
  } catch (e) {
    console.error(e);
    return json({ error: "erreur serveur" }, 500, origin);
  }
});
