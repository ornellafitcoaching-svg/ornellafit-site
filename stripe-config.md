# Stripe → pages de remerciement → achat suivi dans Meta

Chaque page de remerciement envoie l'événement Meta **Purchase** (valeur + identifiant produit du catalogue)
**une seule fois**, et **uniquement** quand l'acheteuse arrive de Stripe. Une cliente qui rouvre sa page
d'accès depuis un email n'est pas recomptée.

## URL de redirection à mettre sur chaque lien de paiement Stripe

Stripe → **Payment Links** → ouvrir le lien → **Modifier** → onglet **Page de confirmation** →
« Ne pas afficher la page de confirmation » → coller l'URL ci-dessous → **Enregistrer**.

Le `?session_id={CHECKOUT_SESSION_ID}` est important : Stripe le remplace par le numéro de commande,
ce qui garantit que l'achat est compté (et jamais deux fois).

| Produit | Prix | URL de redirection |
|---|---|---|
| Programme sur-mesure 8 semaines | 79€ | `https://www.ornellafitcoaching.com/merci.html?session_id={CHECKOUT_SESSION_ID}` |
| Booty Sculpt | 19€ | `https://www.ornellafitcoaching.com/booty-sculpt-merci.html?session_id={CHECKOUT_SESSION_ID}` |
| Bundle Booty Sculpt + Ventre Plat | 25€ | `https://www.ornellafitcoaching.com/bundle-merci.html?session_id={CHECKOUT_SESSION_ID}` |
| Fit Dans Ta Vie | 49€ | `https://www.ornellafitcoaching.com/fit-dans-ta-vie-merci.html?session_id={CHECKOUT_SESSION_ID}` |
| Iron Girl | 49€ | `https://www.ornellafitcoaching.com/iron-girl-merci.html?session_id={CHECKOUT_SESSION_ID}` |
| Pack Maman | 27€ | `https://www.ornellafitcoaching.com/pack-maman-merci.html?session_id={CHECKOUT_SESSION_ID}` |
| Planner Ventre & Fessiers | 12,75€ | `https://www.ornellafitcoaching.com/planner-merci.html?session_id={CHECKOUT_SESSION_ID}` |
| Ventre Plat 14 jours | 12€ | `https://www.ornellafitcoaching.com/ventre-plat-merci.html?session_id={CHECKOUT_SESSION_ID}` |
| Ageless Girl | 17€ | `https://www.ornellafitcoaching.com/ageless-girl-confirmation.html?session_id={CHECKOUT_SESSION_ID}` |
| Ventre Plat Après Bébé | 17€ | `https://www.ornellafitcoaching.com/confirmation-postpartum.html?session_id={CHECKOUT_SESSION_ID}` |
| Summer Body Challenge | 19€ | `https://www.ornellafitcoaching.com/summer-body-confirmation.html?session_id={CHECKOUT_SESSION_ID}` |

Le Guide Recettes (7€) n'a pas encore de page de remerciement dédiée : son achat n'est pas compté dans Meta.

## Vérifier

1. Meta **Gestionnaire d'événements** → ton Pixel → **Tester les événements**.
2. Ouvre une des URL ci-dessus en ajoutant `?achat=1` (ex. `…/merci.html?achat=1`) dans le navigateur de test.
3. Tu dois voir **Purchase** apparaître avec la bonne valeur et l'identifiant produit (ex. `programme-sur-mesure-8sem`).

## Catalogue Meta

Le flux produit est `https://www.ornellafitcoaching.com/meta-catalogue.csv` (13 produits, images dans `images/catalogue/`).
Pour le modifier : `scripts/catalogue/produits.json`, puis `node scripts/catalogue/build.js`.
Les identifiants (`id`) sont exactement ceux envoyés par le Pixel (ViewContent, InitiateCheckout, Purchase) : ne pas les changer.
