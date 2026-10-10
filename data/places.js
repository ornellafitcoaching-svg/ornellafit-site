/* ============================================================
   RARETÉ — PLACES DISPONIBLES
   👉 MODIFIE UNIQUEMENT LA LIGNE CI-DESSOUS CHAQUE MOIS.
   Ce texte s'affiche automatiquement partout où il y a data-ofc-places
   (accueil, offres, transformations). Rien d'autre à modifier.
   Exemples :
     "Novembre : plus que 3 places à domicile (+ 2 en hybride)"
     "Décembre : complet à domicile · places en distanciel"
   ============================================================ */
window.OFC_PLACES = "Octobre : plus que 2 places à domicile (+ 3 en hybride)";

/* Injection — ne pas modifier */
(function () {
  function fill() {
    document.querySelectorAll('[data-ofc-places]').forEach(function (el) { el.textContent = window.OFC_PLACES; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
})();
