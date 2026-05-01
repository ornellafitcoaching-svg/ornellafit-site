# Configuration redirection Stripe → merci.html

## Configurer la redirection après paiement

1. Va sur https://dashboard.stripe.com
2. Menu **Payment Links** (ou Liens de paiement)
3. Clique sur ton lien `buy.stripe.com/8x26oHas9f8n5o9cmh8Vi03`
4. Clique **Modifier** (ou l'icône crayon)
5. Onglet **Page de confirmation**
6. Sélectionne **"Ne pas afficher la page de confirmation"**
7. Entre l'URL : `https://www.ornellafitcoaching.com/merci.html`
8. Clique **Modifier le lien** pour sauvegarder

## Ce qui se passe après

Achat confirmé → Stripe redirige vers merci.html → Pixel Meta déclenche :
- `PageView`
- `Purchase` (value: 79, currency: EUR)

## Vérifier en mode test

1. Dashboard Stripe → **Mode test** (toggle en haut à droite)
2. Crée un lien de paiement test ou utilise une carte test : `4242 4242 4242 4242`
3. Complète le paiement → tu dois arriver sur `ornellafitcoaching.com/merci.html`
4. Dans Meta Events Manager → **Évènements de test** → tu dois voir Purchase apparaître
