/* data/temoignages.js — Ornella Fit Coaching
 * Témoignages affichés dans le carrousel d'avis (avis-carrousel.js).
 *
 * RÈGLE D'OR : uniquement de VRAIES clientes, avec leur accord écrit pour la photo.
 * Jamais de photo récupérée sur internet ou chez une autre coach.
 *
 * Pour ajouter une cliente : copie un bloc { ... }, change les infos, mets sa photo
 * (format carré, ~720 px, .webp) dans images/avis/ et choisis un "id" unique.
 */
window.OFC_TEMOIGNAGES = [
  {
    id: 'lise',
    prenom: 'Lise',
    infos: 'Suivi en cours',
    formule: 'Distanciel puis hybride · 6 mois',
    resultat: 'Ventre et taille transformés en 6 mois',
    texte: 'Un suivi à distance puis en hybride, sans régime extrême : la silhouette s’est redessinée mois après mois. Et elle continue.',
    photo: 'images/avis/lise.webp',
    alt: 'Avant / après de Lise, cliente coachée par Ornella'
  },
  {
    id: 'louise',
    prenom: 'Louise',
    infos: 'Maman de 2 enfants',
    formule: 'Coaching à domicile · 4 mois',
    resultat: '−9 cm de tour de taille · −5 kg',
    texte: 'Reprendre le contrôle de son corps sans se priver ni s’épuiser : 2 séances par semaine, adaptées à sa vraie vie.',
    photo: 'images/avis/louise.webp',
    alt: 'Avant / après de Louise, cliente coachée par Ornella'
  },
  {
    id: 'emeline',
    prenom: 'Émeline',
    infos: 'Maman de 2 enfants',
    formule: 'Coaching hybride',
    resultat: '−3 cm de tour de taille dès le 1er mois',
    texte: 'Peu de temps pour elle : 1 séance par semaine avec Ornella + des séances sur-mesure en autonomie. Fessiers redessinés, taille affinée.',
    photo: 'images/avis/emeline.webp',
    alt: 'Avant / après d’Émeline, cliente coachée par Ornella'
  },
  {
    id: 'chantal',
    prenom: 'Chantal',
    infos: '',
    formule: 'Coaching sur-mesure · 3 mois',
    resultat: '−4 kg en 3 mois',
    texte: 'Elle tournait en rond depuis des années sans programme fait pour elle. On a tout repris de zéro, sans se presser.',
    photo: 'images/avis/chantal.webp',
    alt: 'Avant / après de Chantal, cliente coachée par Ornella'
  },
  {
    id: 'anonyme',
    prenom: 'Cliente',
    infos: 'Photo anonymisée',
    formule: 'Coaching à domicile · 1×/semaine',
    resultat: '−4 cm de cuisses en 4 séances',
    texte: 'Fessiers remontés, silhouette affinée — sans régime et sans s’épuiser.',
    photo: 'images/avis/anonyme.webp',
    alt: 'Avant / après d’une cliente anonyme coachée par Ornella'
  },
  {
    id: 'ornella',
    prenom: 'Ornella',
    infos: 'La coach',
    formule: 'Reconstruction post-partum',
    resultat: 'Grossesse → 1 an après',
    texte: 'Je suis passée par là. Si j’ai pu reconstruire mon corps après ma grossesse, toi aussi.',
    photo: 'images/avis/ornella-postpartum.webp',
    alt: 'Avant / après post-partum d’Ornella'
  }
];
