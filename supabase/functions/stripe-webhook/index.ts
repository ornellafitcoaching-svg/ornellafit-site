// stripe-webhook — reçoit les paiements Stripe (checkout.session.completed).
// Marque les paniers de la personne comme payés → les relances s'arrêtent immédiatement,
// et met à jour sa fiche Brevo (PANIER_STATUT = paye, sortie de la liste « Paniers abandonnés »).
// Signature vérifiée avec le secret du webhook (stocké dans private.config, ou variable STRIPE_WEBHOOK_SECRET).

import { createClient } from "npm:@supabase/supabase-js@2";

const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";

async function secret(name: string, key: string) {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await supa.rpc("get_private_config", { k: key });
  return (data as string | null) ?? "";
}

function hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verify(raw: string, header: string, WEBHOOK_SECRET: string) {
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]).filter((p) => p.length === 2));
  const t = parts["t"];
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`)));
  return sigs.some((s) => s.length === expected.length && s === expected);
}

async function panierListId() {
  const r = await fetch("https://api.brevo.com/v3/contacts/lists?limit=50&offset=0", { headers: { "api-key": BREVO_KEY, accept: "application/json" } });
  if (!r.ok) return null;
  const l = ((await r.json()).lists ?? []).find((x: { name: string }) => x.name === "Paniers abandonnés");
  return l?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const WEBHOOK_SECRET = await secret("STRIPE_WEBHOOK_SECRET", "stripe_webhook_secret");
  if (!WEBHOOK_SECRET) return new Response("STRIPE_WEBHOOK_SECRET manquant", { status: 503 });
  const raw = await req.text();
  if (!(await verify(raw, req.headers.get("stripe-signature") ?? "", WEBHOOK_SECRET))) return new Response("signature invalide", { status: 400 });

  const event = JSON.parse(raw);
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    return new Response(JSON.stringify({ ignore: event.type }), { status: 200 });
  }
  const s = event.data.object;
  if (event.type === "checkout.session.completed" && s.payment_status === "unpaid") {
    return new Response(JSON.stringify({ attente: "paiement différé" }), { status: 200 });
  }
  const email = String(s.customer_details?.email ?? s.customer_email ?? "").toLowerCase();
  if (!email) return new Response(JSON.stringify({ sans_email: true }), { status: 200 });

  const { data } = await supa.from("paniers")
    .update({ statut: "paye", paid_at: new Date().toISOString(), stripe_session_id: s.id })
    .ilike("email", email).in("statut", ["ouvert", "stop", "expire"])
    .gte("created_at", new Date(Date.now() - 30 * 24 * 3600_000).toISOString())
    .select("id");

  if (BREVO_KEY && data && data.length) {
    const listId = await panierListId();
    const body: Record<string, unknown> = {
      email, updateEnabled: true,
      attributes: { PANIER_STATUT: "paye" },
    };
    if (listId) body.unlinkListIds = [listId];
    await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": BREVO_KEY, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }
  return new Response(JSON.stringify({ paniers_payes: data?.length ?? 0 }), { status: 200 });
});
