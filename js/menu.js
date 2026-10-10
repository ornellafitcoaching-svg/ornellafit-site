/* js/menu.js — Menu mobile ☰ commun à toutes les pages.
 * Bouton .nav-toggle -> ouvre/ferme #navMenu (classe "open").
 * Écoute délégué sur document : actif dès le 1er clic (navigateurs Instagram/Facebook),
 * sans dépendre de l'ordre de chargement. Un clic en dehors du menu le referme.
 * À charger dans le <head> : <script src="/js/menu.js"></script>
 */
(function () {
  if (window._menuReady) return;
  window._menuReady = true;

  function toggleMenu() {
    var m = document.getElementById('navMenu');
    if (!m) return;
    var open = m.classList.toggle('open');
    var t = document.querySelector('.nav-toggle');
    if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  window.toggleMenu = toggleMenu; // compatibilité : anciennes pages en cache

  document.addEventListener('click', function (e) {
    var m = document.getElementById('navMenu');
    if (!m) return;
    var t = e.target.closest && e.target.closest('.nav-toggle');
    if (t) { toggleMenu(); return; }
    if (!m.contains(e.target) && m.classList.contains('open')) {
      m.classList.remove('open');
      var b = document.querySelector('.nav-toggle');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  });
})();
