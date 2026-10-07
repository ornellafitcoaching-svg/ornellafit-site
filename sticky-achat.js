/* sticky-achat.js — Ornella Fit Coaching
 * Barre d'achat fixée en bas de l'écran (prix + bouton), comme les grandes plateformes.
 * - apparaît après 300 px de scroll
 * - se cache quand un vrai bouton d'achat / le formulaire d'achat est déjà visible à l'écran
 * - remonte la bulle WhatsApp pour qu'elle ne soit pas cachée
 *
 * Utilisation (une ligne en bas de la page) :
 *   <script src="sticky-achat.js" defer
 *     data-prix="49€"                          prix affiché
 *     data-sous="Accès à vie · remboursé 48h"  petite ligne sous le prix
 *     data-bouton="Je commence"                texte du bouton
 *     data-lien="https://buy.stripe.com/…"     lien Stripe OU "#achat" (scroll vers le formulaire)
 *     data-couleur="#C96358"                   couleur du bouton (optionnel)
 *     data-valeur="49" data-produit="fit-dans-ta-vie-28j"   (optionnel : suivi Meta InitiateCheckout)
 *     data-masquer="#achat"></script>          (optionnel : zones qui cachent la barre)
 * Les liens Stripe passent automatiquement par panier.js (relances panier abandonné).
 */
(function () {
  'use strict';
  var me = document.currentScript;
  if (!me) return;
  function opt(k, d) { var v = me.getAttribute('data-' + k); return v == null || v === '' ? d : v; }

  var prix = opt('prix', ''), sous = opt('sous', ''), bouton = opt('bouton', 'Je commence');
  var lien = opt('lien', '#achat'), couleur = opt('couleur', '#C96358');
  var valeur = parseFloat(opt('valeur', '')) || 0, produit = opt('produit', '');
  var masquer = opt('masquer', '#achat, a[href^="https://buy.stripe.com/"]:not(.ofc-sb-btn)');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var css = '' +
    '#ofc-sb{position:fixed;left:0;right:0;bottom:0;z-index:900;background:rgba(255,253,250,.97);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-top:1px solid #EADFD8;box-shadow:0 -6px 24px rgba(44,31,26,.08);padding:10px 16px calc(10px + env(safe-area-inset-bottom));transform:translateY(110%);transition:transform .3s ease;font-family:inherit}' +
    '#ofc-sb.on{transform:none}' +
    '#ofc-sb .in{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px}' +
    '#ofc-sb .px{display:flex;flex-direction:column;line-height:1.15;min-width:0}' +
    '#ofc-sb .px b{font-family:"Playfair Display",Georgia,serif;font-size:1.45rem;color:#2C1F1A;font-weight:700}' +
    '#ofc-sb .px span{font-size:.72rem;color:#7A6A62;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#ofc-sb .ofc-sb-btn{flex-shrink:0;display:inline-block;background:' + couleur + ';color:#fff;text-decoration:none;font-weight:700;font-size:.92rem;letter-spacing:.02em;padding:14px 22px;border-radius:50px;box-shadow:0 6px 18px rgba(44,31,26,.18);white-space:nowrap}' +
    '#ofc-sb .ofc-sb-btn:active{transform:scale(.98)}' +
    'body.ofc-sb-on{padding-bottom:84px}' +
    'body.ofc-sb-on .floating-wa,body.ofc-sb-on .wa-float{bottom:96px!important;transition:bottom .3s ease}';

  function init() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var bar = document.createElement('div');
    bar.id = 'ofc-sb';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Achat rapide');
    bar.innerHTML = '<div class="in"><div class="px">' + (prix ? '<b>' + esc(prix) + '</b>' : '') +
      (sous ? '<span>' + esc(sous) + '</span>' : '') + '</div>' +
      '<a class="ofc-sb-btn" href="' + esc(lien) + '">' + esc(bouton) + ' →</a></div>';
    document.body.appendChild(bar);

    var btn = bar.querySelector('.ofc-sb-btn');
    btn.addEventListener('click', function (e) {
      if (lien.charAt(0) === '#') {
        var t = document.querySelector(lien);
        if (t) {
          e.preventDefault();
          var y = t.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - 80;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          var f = t.querySelector('input[type="email"], input, button');
          if (f && f.focus) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (x) {} }, 600);
        }
      } else if (valeur && produit && typeof window.fbq === 'function') {
        window.fbq('track', 'InitiateCheckout', { value: valeur, currency: 'EUR', content_ids: [produit], content_type: 'product' });
      }
    });

    var visibles = 0, scrolled = false;
    function render() {
      var show = scrolled && visibles === 0;
      bar.classList.toggle('on', show);
      document.body.classList.toggle('ofc-sb-on', show);
    }
    window.addEventListener('scroll', function () {
      var s = (window.scrollY || window.pageYOffset) > 300;
      if (s !== scrolled) { scrolled = s; render(); }
    }, { passive: true });

    var zones = [];
    try { zones = Array.prototype.slice.call(document.querySelectorAll(masquer)); } catch (x) {}
    zones = zones.filter(function (z) { return !bar.contains(z); });
    if (zones.length && 'IntersectionObserver' in window) {
      var seen = new Set();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
        visibles = seen.size;
        render();
      }, { threshold: 0.15 });
      zones.forEach(function (z) { io.observe(z); });
    }
    scrolled = (window.scrollY || window.pageYOffset) > 300;
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
