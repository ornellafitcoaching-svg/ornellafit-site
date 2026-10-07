/* avis-carrousel.js — Ornella Fit Coaching
 * Carrousel "preuve sociale" : avant/après + prénom + formule + résultat.
 * Les données viennent de data/temoignages.js (à charger AVANT ce fichier).
 *
 * Utilisation dans une page :
 *   <div class="ofc-avis"
 *        data-ordre="louise,emeline,chantal"          (optionnel : ids + ordre, sinon tout)
 *        data-kicker="Résultats réels"                 (optionnel)
 *        data-titre="Elles ont transformé leur corps"  (optionnel)
 *        data-note="Texte sous le carrousel"           (optionnel)
 *        data-accent="#C96358"></div>                  (optionnel : couleur de la page)
 *   <script src="data/temoignages.js" defer></script>
 *   <script src="avis-carrousel.js" defer></script>
 */
(function () {
  'use strict';
  var DATA = window.OFC_TEMOIGNAGES || [];
  if (!DATA.length) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var css = '' +
    '.ofc-avis{--oa-accent:#C96358;--oa-ink:#2C1F1A;--oa-muted:#7A6A62;--oa-line:#EADFD8;padding:56px 0 44px;color:var(--oa-ink)}' +
    '.ofc-avis-head{text-align:center;max-width:640px;margin:0 auto 26px;padding:0 20px}' +
    '.ofc-avis-k{display:inline-block;font-size:.7rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--oa-accent);margin-bottom:10px}' +
    '.ofc-avis-t{font-family:"Playfair Display",Georgia,serif;font-weight:600;font-size:clamp(1.5rem,5vw,2.1rem);line-height:1.2;margin:0}' +
    '.ofc-avis-g{display:inline-flex;align-items:center;gap:8px;margin-top:12px;font-size:.85rem;color:var(--oa-muted)}' +
    '.ofc-avis-g b{color:var(--oa-ink)}.ofc-avis-g .st{color:#E0A526;letter-spacing:1px}' +
    '.ofc-avis-wrap{position:relative;max-width:1080px;margin:0 auto}' +
    '.ofc-avis-track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:6px 20px 16px;scroll-padding:0 20px}' +
    '.ofc-avis-track::-webkit-scrollbar{display:none}' +
    '.ofc-avis-card{flex:0 0 80%;max-width:320px;scroll-snap-align:start;background:#fff;border:1px solid var(--oa-line);border-radius:20px;overflow:hidden;box-shadow:0 8px 28px rgba(44,31,26,.08);display:flex;flex-direction:column}' +
    '@media(min-width:700px){.ofc-avis-card{flex-basis:300px}}' +
    '.ofc-avis-ph{position:relative;background:#F4EEE9;aspect-ratio:1/1}' +
    '.ofc-avis-ph img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.ofc-avis-tag{position:absolute;left:10px;bottom:10px;background:rgba(255,255,255,.94);color:var(--oa-ink);font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px}' +
    '.ofc-avis-b{padding:16px 18px 18px;display:flex;flex-direction:column;gap:6px;flex:1}' +
    '.ofc-avis-st{color:#E0A526;font-size:.9rem;letter-spacing:2px}' +
    '.ofc-avis-n{font-weight:700;font-size:1rem}.ofc-avis-n span{font-weight:400;color:var(--oa-muted);font-size:.85rem}' +
    '.ofc-avis-f{font-size:.75rem;color:var(--oa-muted)}' +
    '.ofc-avis-r{font-weight:700;color:var(--oa-accent);font-size:.92rem;margin-top:2px}' +
    '.ofc-avis-p{font-size:.88rem;line-height:1.55;color:#4A3B34;margin:2px 0 0}' +
    '.ofc-avis-nav{display:none}' +
    '@media(min-width:900px){.ofc-avis-nav{display:flex;position:absolute;top:38%;width:44px;height:44px;border-radius:50%;border:1px solid var(--oa-line);background:#fff;color:var(--oa-ink);font-size:20px;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.08);z-index:2}' +
    '.ofc-avis-nav.prev{left:-6px}.ofc-avis-nav.next{right:-6px}}' +
    '.ofc-avis-hint{text-align:center;font-size:.72rem;color:var(--oa-muted);letter-spacing:.06em;margin:4px 0 0}' +
    '@media(min-width:900px){.ofc-avis-hint{display:none}}' +
    '.ofc-avis-note{max-width:620px;margin:14px auto 0;padding:0 20px;text-align:center;font-size:.8rem;line-height:1.6;color:var(--oa-muted)}';

  function injectCss() {
    if (document.getElementById('ofc-avis-css')) return;
    var s = document.createElement('style');
    s.id = 'ofc-avis-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function card(t) {
    return '<article class="ofc-avis-card">' +
      (t.photo ? '<div class="ofc-avis-ph"><img src="' + esc(t.photo) + '" alt="' + esc(t.alt || ('Transformation ' + t.prenom)) + '" loading="lazy" decoding="async" width="720" height="720">' +
        '<span class="ofc-avis-tag">Avant → Après</span></div>' : '') +
      '<div class="ofc-avis-b">' +
        '<span class="ofc-avis-st" aria-label="5 étoiles">★★★★★</span>' +
        '<div class="ofc-avis-n">' + esc(t.prenom) + (t.infos ? ' <span>· ' + esc(t.infos) + '</span>' : '') + '</div>' +
        (t.formule ? '<div class="ofc-avis-f">' + esc(t.formule) + '</div>' : '') +
        (t.resultat ? '<div class="ofc-avis-r">' + esc(t.resultat) + '</div>' : '') +
        (t.texte ? '<p class="ofc-avis-p">' + esc(t.texte) + '</p>' : '') +
      '</div></article>';
  }

  function build(el) {
    var ordre = (el.getAttribute('data-ordre') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var list = ordre.length
      ? ordre.map(function (id) { return DATA.filter(function (t) { return t.id === id; })[0]; }).filter(Boolean)
      : DATA.slice();
    if (!list.length) return;
    var accent = el.getAttribute('data-accent');
    if (accent) el.style.setProperty('--oa-accent', accent);
    var kicker = el.getAttribute('data-kicker') || 'Résultats réels · Photos non retouchées';
    var titre = el.getAttribute('data-titre') || 'Elles ont transformé leur corps avec Ornella';
    var note = el.getAttribute('data-note') || '';
    el.innerHTML =
      '<div class="ofc-avis-head"><span class="ofc-avis-k">' + esc(kicker) + '</span>' +
        '<h2 class="ofc-avis-t">' + esc(titre) + '</h2>' +
        '<div class="ofc-avis-g"><span class="st">★★★★★</span><span><b>5,0/5</b> · 25 avis Google</span></div></div>' +
      '<div class="ofc-avis-wrap">' +
        '<button type="button" class="ofc-avis-nav prev" aria-label="Avis précédent">‹</button>' +
        '<div class="ofc-avis-track" tabindex="0">' + list.map(card).join('') + '</div>' +
        '<button type="button" class="ofc-avis-nav next" aria-label="Avis suivant">›</button>' +
      '</div>' +
      '<p class="ofc-avis-hint">← glisse pour voir les autres →</p>' +
      (note ? '<p class="ofc-avis-note">' + esc(note) + '</p>' : '');
    var track = el.querySelector('.ofc-avis-track');
    function step(dir) {
      var c = track.querySelector('.ofc-avis-card');
      track.scrollBy({ left: dir * ((c ? c.offsetWidth : 300) + 14), behavior: 'smooth' });
    }
    el.querySelector('.prev').addEventListener('click', function () { step(-1); });
    el.querySelector('.next').addEventListener('click', function () { step(1); });
  }

  function init() {
    var els = document.querySelectorAll('.ofc-avis');
    if (!els.length) return;
    injectCss();
    for (var i = 0; i < els.length; i++) build(els[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
