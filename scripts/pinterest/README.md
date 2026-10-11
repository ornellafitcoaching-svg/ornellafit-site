# Pinterest — publication automatique (Ornella Fit Coaching)

Compte : fr.pinterest.com/Ornellafitcoaching — objectif : **trafic → leads → clientes**.

## Fichiers
- `queue.json` : épingles prêtes (visuel déjà en ligne), publiées dans l'ordre.
- `published.json` : tout ce qui a déjà été publié (slug, lien, date). Ne jamais republier un même lien avec le même visuel.
- `render.py` : génère les visuels 1000x1500 dans `images/pinterest/<slug>.jpg`.

## Tableaux (board key → id)
- V Ventre plat femme : exercices & conseils — 1087267603730476936
- F Exercices fessiers femme à la maison — 1087267603730476938
- R Routine sport femme débutante — 1087267603730774632
- P Sport post-partum & remise en forme après bébé — 1087267603730476937
- Q Sport femme 40 ans & ménopause — 1087267603730476933
- C Recettes rééquilibrage alimentaire — 1087267603730870212
Ne pas utiliser « Réseaux » (tableau auto Instagram).

## Règles de contenu
- Un titre = une recherche Pinterest réelle (mots-clés en tête), pas une légende Insta.
- Formats qui s'enregistrent : listes, routines, « combien / comment / quoi », programmes types.
- Lien = page précise du site (article de blog, page programme, challenge-ventre-plat.html, guide-offert.html, quiz.html), toujours avec `?utm_source=pinterest&utm_medium=organic`. Jamais Instagram.
- Mix par lot de 10 : ~6 articles de blog, 2 aimants à leads (challenge ventre plat, guide 9 erreurs, quiz), 2 programmes payants (prix à jour sur la page !).
- Une même page peut revenir avec un **nouveau visuel et un nouvel angle** (fresh pin), pas le même.
- Photos : uniquement les vraies photos d'Ornella (assets/, images/ornella-*.jpg…). **Interdit** : photos retouchées IA / tenue bleue studio (images/ornella-profil-ext.jpg, images/poster-hero.jpg, images/ornella-profil-studio.*, images/ornella-fente.webp), photos de clientes, visuels produits avec un ancien prix (IRON-GIRL-Creme-1080.png affiche 39 €). Photos basse résolution (360 px) → `"fit":"contain"`.
- Pas de Canva.

## Gabarit visuel (v2, render.py)
- Titre EN HAUT, gros (lisible en miniature dans le fil), 1 ligne de sous-titre max.
- Photo au milieu ; gros bandeau CTA corail en bas avec une action claire (« Lire l'article gratuit », « Faire le quiz gratuit », « Je rejoins le challenge », « Voir le programme ») + ornellafitcoaching.com.
- Avant/après : 3-4 épingles par lot, uniquement les transformations d'Ornella elle-même (ornella-avant-apres-postpartum, ornella-postpartum, guide-photo-2, ornella-sculpture-2mois, ornella-competition), étiquettes via `"labels":["AVANT","APRÈS"]`, sans promesse chiffrée. Jamais de clientes.
- Pas deux épingles de la même file avec la même photo.
- Ajouter `?v=<date>` à `image_url` à la publication (évite qu'un ancien visuel en cache soit repris).

## Publication (Chrome, session Pinterest d'Ornella)
Depuis un onglet fr.pinterest.com : POST `/resource/PinResource/create/` (form `source_url`, `data={options,context:{}}`, en-têtes `X-Requested-With`, `X-CSRFToken` = cookie csrftoken, `X-Pinterest-PWS-Handler`) avec options `{board_id, title, description, link, image_url:"https://www.ornellafitcoaching.com/images/pinterest/<slug>.jpg", method:"uploaded", section:null}`. `scheduled_ts` est ignoré (publie tout de suite). Attendre ≥ 6 s entre deux épingles. Vérifier ensuite (PinResource get) : image 1000x1500 + lien ornellafitcoaching.com.
