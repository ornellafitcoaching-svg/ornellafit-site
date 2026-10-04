// relances-paniers — appelée toutes les 15 min par pg_cron.
// Envoie les relances de panier via les modèles Brevo :
//   R1 (modèle 193) à +1 h · R2 (194) à +24 h · R3 (195) à +72 h avec un code Stripe -15 % unique valable 48 h.
// S'arrête dès que le panier est payé (webhook Stripe), stoppé (lien dans l'e-mail) ou remplacé par un nouveau panier.
// Sécurité : n'accepte que les appels portant l'en-tête x-cron-secret = secret CRON_SECRET.
//
// Secrets : BREVO_API_KEY, STRIPE_SECRET_KEY (clé restreinte : écriture « Promotion codes »). Le secret du cron est dans private.config.

import { createClient } from "npm:@supabase/supabase-js@2";

const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const COUPON = "RELANCE_PANIER_15";
const TEMPLATES = { 1: 193, 2: 194, 3: 195 } as const;
const STOP_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1/site-brevo?op=stop&t=`;

const H = 3600_000;
// délai minimal depuis la création du panier, et délai max au-delà duquel on n'envoie plus cette relance
const STEPS: { n: 1 | 2 | 3; after: number; before: number }[] = [
  { n: 1, after: 1 * H, before: 20 * H },
  { n: 2, after: 24 * H, before: 60 * H },
  { n: 3, after: 72 * H, before: 110 * H },
];

// Visuel produit affiché dans les e-mails (images hébergées sur le site, dossier images/email/)
const IMG = "https://www.ornellafitcoaching.com/images/email/";
const IMAGES: [RegExp, string][] = [
  [/fit dans ta vie/i, "p-fit-dans-ta-vie.jpg"],
  [/apr[eè]s b[eé]b[eé]|pack maman/i, "p-postpartum.jpg"],
  [/ventre plat/i, "p-ventre-plat.jpg"],
  [/booty/i, "p-booty-sculpt.jpg"],
  [/iron girl/i, "p-iron-girl.jpg"],
  [/ageless/i, "p-ageless-girl.jpg"],
  [/summer body/i, "p-summer-body.jpg"],
  [/planner/i, "p-planner.jpg"],
  [/recettes/i, "p-recettes.jpg"],
  [/morpho/i, "p-morpho.jpg"],
];
function imageFor(produit: string) {
  for (const [re, f] of IMAGES) if (re.test(produit)) return IMG + f;
  return IMG + "p-fit-dans-ta-vie.jpg"; // coaching / consultation : photo d'Ornella
}
const euros = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",").replace(",00", "");
function expireLabel(ms: number) {
  const d = new Date(ms);
  const jour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(d);
  const h = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(d).replace(":", "h");
  return `${jour} à ${h}`;
}

type Panier = {
  id: string; email: string; prenom: string | null; produit: string; payment_link: string; montant: number | null;
  created_at: string; relance1_at: string | null; relance2_at: string | null; relance3_at: string | null;
  promo_code: string | null; stop_token: string; test: boolean;
};

async function secret(name: string, key: string) {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await supa.rpc("get_private_config", { k: key });
  return (data as string | null) ?? "";
}

async function createPromo(prenom: string | null) {
  if (!STRIPE_KEY) return null;
  const base = (prenom || "FIT").normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8) || "FIT";
  for (let i = 0; i < 3; i++) {
    const code = `${base}15${crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase()}`;
    const expires = String(Math.floor(Date.now() / 1000) + 48 * 3600);
    const tries: URLSearchParams[] = [
      new URLSearchParams({ "promotion[type]": "coupon", "promotion[coupon]": COUPON, code, max_redemptions: "1", expires_at: expires, "metadata[source]": "relance-panier" }),
      new URLSearchParams({ coupon: COUPON, code, max_redemptions: "1", expires_at: expires, "metadata[source]": "relance-panier" }),
    ];
    for (const body of tries) {
      const r = await fetch("https://api.stripe.com/v1/promotion_codes", {
        method: "POST",
        headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (r.ok) { const pc = await r.json(); return { code: pc.code as string, id: pc.id as string }; }
      const err = await r.text();
      if (err.includes("already exists")) break; // on retente avec un autre code
    }
  }
  return null;
}

async function sendTemplate(p: Panier, n: 1 | 2 | 3, code: string | null) {
  const lien = `${p.payment_link}?prefilled_email=${encodeURIComponent(p.email)}`;
  const params: Record<string, string> = {
    PRENOM: p.prenom || "toi",
    PRODUIT: p.produit,
    IMAGE: imageFor(p.produit),
    LIEN: lien,
    STOP: STOP_BASE + p.stop_token,
  };
  if (n === 3 && code) {
    params.CODE = code;
    params.LIEN_PROMO = `${lien}&prefilled_promo_code=${encodeURIComponent(code)}`;
    const prix = Number(p.montant) || 0;
    params.PRIX = euros(prix);
    params.PRIX_REMISE = euros(prix * 0.85);
    params.EXPIRE = expireLabel(Date.now() + 48 * 3600_000);
  }
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      templateId: TEMPLATES[n],
      to: [{ email: p.email, name: p.prenom || undefined }],
      params,
      tags: ["relance-panier", `relance-${n}`],
    }),
  });
  if (!r.ok) console.error("brevo", n, p.id, r.status, await r.text());
  return r.ok;
}

Deno.serve(async (req) => {
  const CRON_SECRET = await secret("CRON_SECRET", "cron_secret");
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  if (!BREVO_KEY) return new Response("BREVO_API_KEY manquante", { status: 503 });

  // mode test : ?accelere=1 → les délais sont en minutes au lieu d'heures (uniquement pour les paniers marqués test)
  const url = new URL(req.url);
  const accel = url.searchParams.get("accelere") === "1";

  const since = new Date(Date.now() - 120 * H).toISOString();
  const { data, error } = await supa.from("paniers").select("*").eq("statut", "ouvert").gte("created_at", since)
    .order("created_at", { ascending: true }).limit(200);
  if (error) return new Response(error.message, { status: 500 });

  const report: string[] = [];
  for (const p of (data ?? []) as Panier[]) {
    const age = Date.now() - new Date(p.created_at).getTime();
    const factor = accel && p.test ? 1 / 60 : 1; // heures → minutes en test
    // on n'envoie qu'une relance par passage et par panier, la plus avancée due
    for (const step of [...STEPS].reverse()) {
      const col = `relance${step.n}_at` as const;
      if (p[col]) break; // déjà envoyée → rien de plus récent à faire
      if (age < step.after * factor) continue;
      if (age > step.before * factor) { report.push(`${p.id} R${step.n} trop tard`); break; }
      let code: string | null = p.promo_code;
      if (step.n === 3 && !code) {
        const promo = await createPromo(p.prenom);
        if (!promo) { report.push(`${p.id} R3 sans code (Stripe)`); break; }
        code = promo.code;
        await supa.from("paniers").update({ promo_code: promo.code, promo_code_id: promo.id }).eq("id", p.id);
      }
      // verrou : on marque avant d'envoyer pour éviter tout doublon si deux passages se chevauchent
      const { data: locked } = await supa.from("paniers").update({ [col]: new Date().toISOString() })
        .eq("id", p.id).is(col, null).eq("statut", "ouvert").select("id");
      if (!locked || !locked.length) break;
      const ok = await sendTemplate(p, step.n, code);
      if (!ok) await supa.from("paniers").update({ [col]: null }).eq("id", p.id); // on retentera au prochain passage
      report.push(`${p.id} R${step.n} ${ok ? "envoyée" : "échec"}`);
      break;
    }
  }
  return new Response(JSON.stringify({ traites: data?.length ?? 0, report }), { headers: { "Content-Type": "application/json" } });
});
