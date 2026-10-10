/* ============================================================
   RARETÉ — PLACES DISPONIBLES
   👉 MODIFIE UNIQUEMENT LES 2 NOMBRES CI-DESSOUS quand ça change.
   Le mois (« Octobre », « Novembre »…) se met à jour tout seul.
   Ce texte s'affiche automatiquement partout où il y a data-ofc-places
   (accueil, offres, transformations). Rien d'autre à modifier.
   Résultat : "Octobre : plus que 2 places à domicile (+ 3 en hybride)"
   ============================================================ */
var OFC_PLACES_DOMICILE = 2;
var OFC_PLACES_HYBRIDE  = 3;

/* Injection — ne pas modifier */
(function () {
  var MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  window.OFC_PLACES = MOIS[new Date().getMonth()] + ' : plus que ' + OFC_PLACES_DOMICILE + ' place' + (OFC_PLACES_DOMICILE > 1 ? 's' : '') +
    ' à domicile (+ ' + OFC_PLACES_HYBRIDE + ' en hybride)';
  function fill() {
    document.querySelectorAll('[data-ofc-places]').forEach(function (el) { el.textContent = window.OFC_PLACES; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
})();
