/* js/videos.js — Ornella Fit Coaching
 * Vidéos décoratives légères, chargées seulement quand elles sont visibles.
 *
 * Utilisation :
 *   <div class="vid"><video muted playsinline loop preload="none" aria-hidden="true"
 *        poster="images/video/xxx_poster.jpg" data-src="images/video/xxx.mp4"></video></div>
 *   Source selon la largeur (hero) : data-src-mobile="..." data-src-ordi="..." (bascule à 768 px)
 *   <script src="js/videos.js" defer></script>
 *
 * - Rien n'est téléchargé avant la fin du chargement de la page (LCP protégé)
 * - Source posée + lecture quand la vidéo est visible, pause quand elle sort de l'écran
 * - Une seule vidéo en lecture à la fois (la plus visible)
 * - "Réduire les animations" ou économie de données : poster seul, aucune vidéo
 * - Le conteneur .vid reçoit la classe "is-playing" pendant la lecture
 */
(function () {
  'use strict';
  var videos = [].slice.call(document.querySelectorAll('video[data-src], video[data-src-mobile]'));
  if (!videos.length) return;

  var calme = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ||
              (navigator.connection && navigator.connection.saveData);
  if (calme || !('IntersectionObserver' in window)) return; // le poster reste affiché

  var ratios = new Map();
  var active = null;

  function source(v) {
    var d = v.dataset;
    if (d.srcMobile) return window.innerWidth < 768 ? d.srcMobile : (d.srcOrdi || d.srcMobile);
    return d.src;
  }

  function lancer(v) {
    if (!v.getAttribute('src')) {
      v.muted = true; // iOS : lecture auto seulement si muet
      v.setAttribute('src', source(v));
      v.addEventListener('playing', function () { v.parentNode.classList.add('is-playing'); });
      v.addEventListener('pause', function () { v.parentNode.classList.remove('is-playing'); });
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* la plus visible joue, toutes les autres sont en pause */
  function choisir() {
    var best = null, bestR = 0.35;
    ratios.forEach(function (r, v) { if (r > bestR) { best = v; bestR = r; } });
    if (best === active) return;
    if (active) active.pause();
    active = best;
    if (active) lancer(active);
  }

  function demarrer() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) ratios.set(e.target, e.intersectionRatio);
        else ratios.delete(e.target);
      });
      choisir();
    }, { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] });
    videos.forEach(function (v) { io.observe(v); });

    document.addEventListener('visibilitychange', function () {
      if (!active) return;
      if (document.hidden) active.pause(); else lancer(active);
    });
  }

  if (document.readyState === 'complete') demarrer();
  else window.addEventListener('load', demarrer);
})();
