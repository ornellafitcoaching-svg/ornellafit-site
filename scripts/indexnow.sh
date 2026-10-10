#!/usr/bin/env bash
# ============================================================
# IndexNow — prévient Bing, Yandex (et moteurs partenaires) que
# des URLs ont changé, pour une (ré)indexation plus rapide.
# (Google n'utilise pas IndexNow : pour Google, passe par la
#  Search Console — voir README ci-dessous.)
#
# UTILISATION (après chaque mise en ligne) :
#   bash scripts/indexnow.sh
#
# Le script lit le sitemap.xml du site, récupère toutes les URLs
# et les envoie à api.indexnow.org en une seule requête.
# ============================================================
set -euo pipefail

HOST="www.ornellafitcoaching.com"
KEY="374041dca9d05f923d8f16b06e6600a8"
KEY_LOCATION="https://${HOST}/${KEY}.txt"
SITEMAP="https://${HOST}/sitemap.xml"

echo "→ Récupération des URLs depuis ${SITEMAP}"
URLS=$(curl -s "${SITEMAP}" | grep -oE '<loc>[^<]+</loc>' | sed -E 's#</?loc>##g')
COUNT=$(printf "%s\n" "${URLS}" | grep -c . || true)
echo "→ ${COUNT} URLs trouvées"

# Construit le tableau JSON urlList
URL_JSON=$(printf "%s\n" "${URLS}" | grep . | sed 's/.*/"&"/' | paste -sd, -)

BODY=$(cat <<JSON
{
  "host": "${HOST}",
  "key": "${KEY}",
  "keyLocation": "${KEY_LOCATION}",
  "urlList": [${URL_JSON}]
}
JSON
)

echo "→ Envoi à IndexNow…"
HTTP=$(curl -s -o /tmp/indexnow_resp.txt -w "%{http_code}" \
  -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data "${BODY}")

echo "→ Réponse HTTP: ${HTTP}"
# 200 ou 202 = accepté ; 422 = certaines URLs invalides ; 403 = clé non trouvée
cat /tmp/indexnow_resp.txt 2>/dev/null || true
echo
if [ "${HTTP}" = "200" ] || [ "${HTTP}" = "202" ]; then
  echo "✅ IndexNow a bien reçu les ${COUNT} URLs."
else
  echo "⚠️  Code ${HTTP} — vérifie que https://${HOST}/${KEY}.txt est en ligne et contient la clé."
fi
