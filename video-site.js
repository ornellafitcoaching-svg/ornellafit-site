/* video-site.js — Ornella Fit Coaching
 * Vidéos courtes des pages de vente (images/video/site_*.mp4).
 *
 * Utilisation :
 *   <div class="ofc-video" style="...">
 *     <video autoplay muted loop playsinline preload="metadata" poster="images/video/xxx.jpg">
 *       <source src="images/video/xxx.mp4" type="video/mp4">
 *     </video>
 *   </div>
 *   <script src="video-site.js" defer></script>
 *
 * - Lecture seulement quand la vidéo est à l'écran (batterie + fluidité mobile)
 * - "Réduire les animations" ou mode économie de données : pas d'autoplay, bouton lecture
 * - Fichier absent ou illisible : le bloc est masqué (jamais de lecteur cassé)
 */
(function () {
  'use strict';
  var blocs = document.querySelectorAll('.ofc-video');
  if (!blocs.length) return;

  var calme = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ||
              (navigator.connection && navigator.connection.saveData);

  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.25 }) : null;

  Array.prototype.forEach.call(blocs, function (bloc) {
    var v = bloc.querySelector('video');
    if (!v) return;
    var src = v.querySelector('source');
    function masquer() { bloc.style.display = 'none'; if (io) io.unobserve(v); }
    (src || v).addEventListener('error', masquer);
    /* l'erreur a pu arriver avant ce script (defer) */
    if (v.error || v.networkState === 3) { masquer(); return; }

    if (calme) {
      v.removeAttribute('autoplay');
      v.autoplay = false;
      v.pause();
      v.controls = true;
      return;
    }
    if (io) io.observe(v);
  });
})();
