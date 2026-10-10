/* avis-carrousel.js — Ornella Fit Coaching
 * Carrousel "preuve sociale" : avant/après + prénom + formule + résultat.
 * Les données viennent de data/temoignages.js (à charger AVANT ce fichier).
 *
 * Utilisation dans une page :
 *   <div class="ofc-avis"
 *        data-ordre="louise,emeline,chantal"          (optionnel : ids + ordre, sinon tout)
 *        data-kicker="Résultats réels"                 (optionnel)
 *        data-titre="Elles ont transformé leur corps"  (optionnel)
 *        data-tete="non"                               (optionnel : sans titre)
 *        data-note="Texte sous le carrousel"           (optionnel)
 *        data-accent="#C96358"></div>                  (optionnel : couleur de la page)
 *   <script src="data/temoignages.js" defer></script>
 *   <script src="avis-carrousel.js" defer></script>
 */
(function () {
  'use strict';
  var DATA = window.OFC_TEMOIGNAGES || [];
  if (!DATA.length) return;

  /* chemins depuis la racine du site : le carrousel marche aussi dans /blog/ */
  function root(p) { p = String(p || ''); return (/^(https?:|\/|#|data:)/.test(p)) ? p : '/' + p; }

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
    '.ofc-avis-ph{display:block;position:relative;background:#F4EEE9;aspect-ratio:1/1}' +
    '.ofc-avis-ph img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.ofc-avis-tag{position:absolute;left:10px;bottom:10px;background:rgba(255,255,255,.94);color:var(--oa-ink);font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px}' +
    '.ofc-avis-b{padding:16px 18px 18px;display:flex;flex-direction:column;gap:6px;flex:1}' +
    '.ofc-avis-st{color:#E0A526;font-size:.9rem;letter-spacing:2px}' +
    '.ofc-avis-n{font-weight:700;font-size:1rem}.ofc-avis-n span{font-weight:400;color:var(--oa-muted);font-size:.85rem}' +
    '.ofc-avis-f{font-size:.75rem;color:var(--oa-muted)}' +
    '.ofc-avis-r{font-weight:700;color:var(--oa-accent);font-size:.92rem;margin-top:2px}' +
    '.ofc-avis-p{font-size:.88rem;line-height:1.55;color:#4A3B34;margin:2px 0 0}' +
    '.ofc-avis-cta{margin-top:auto;padding-top:12px;font-size:.82rem;font-weight:700;color:var(--oa-accent);text-decoration:none;display:inline-flex;align-items:center;gap:4px}' +
    '.ofc-avis-cta span{text-decoration:underline;text-underline-offset:3px}' +
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
      /* photo cliquable -> sa transformation (transformations.html#transfo-<id>) */
      (t.photo ? '<a class="ofc-avis-ph" href="/transformations.html#transfo-' + esc(t.id) + '" aria-label="Voir la transformation de ' + esc(t.prenom) + '"><img src="' + esc(root(t.photo)) + '" alt="' + esc(t.alt || ('Transformation ' + t.prenom)) + '" loading="lazy" decoding="async" width="720" height="720">' +
        '<span class="ofc-avis-tag">Avant → Après</span></a>' : '') +
      '<div class="ofc-avis-b">' +
        '<span class="ofc-avis-st" aria-label="5 étoiles">★★★★★</span>' +
        '<div class="ofc-avis-n">' + esc(t.prenom) + (t.infos ? ' <span>· ' + esc(t.infos) + '</span>' : '') + '</div>' +
        (t.formule ? '<div class="ofc-avis-f">' + esc(t.formule) + '</div>' : '') +
        (t.resultat ? '<div class="ofc-avis-r">' + esc(t.resultat) + '</div>' : '') +
        (t.texte ? '<p class="ofc-avis-p">' + esc(t.texte) + '</p>' : '') +
        (t.lien ? '<a class="ofc-avis-cta" href="' + esc(root(t.lien)) + '"><span>' + esc(t.lienTexte || 'Découvrir sa formule') + '</span> →</a>' : '') +
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
    var note = el.getAttribute('data-note') || 'Résultats de clientes accompagnées en coaching par Ornella, avec la même méthode. Photos publiées avec leur accord.';
    var tete = el.getAttribute('data-tete') !== 'non'; /* "non" : titre déjà affiché par la page */
    el.innerHTML =
      (tete ? '<div class="ofc-avis-head"><span class="ofc-avis-k">' + esc(kicker) + '</span>' +
        '<h2 class="ofc-avis-t">' + esc(titre) + '</h2>' +
        '<div class="ofc-avis-g"><span class="st">★★★★★</span><span><b>5,0/5</b> · 25 avis Google</span></div></div>' : '') +
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
    track.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.ofc-avis-cta');
      if (!a) return;
      var href = a.getAttribute('href') || '', i = href.indexOf('#');
      if (i < 0) return;
      var page = href.slice(0, i).replace(/^\//, ''), id = href.slice(i + 1);
      var ici = location.pathname.split('/').pop() || 'index.html';
      if (page && page !== ici) return;
      var cible = document.getElementById(id);
      if (!cible) return;
      e.preventDefault();
      if (typeof window.rfOpen === 'function' && id.indexOf('tarif-') === 0) { window.rfOpen(id); }
      else { cible.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    el.querySelector('.next').addEventListener('click', function () { step(1); });
  }

  /* ---------- Bandeau compact pour les héros : "preuve en un coup d'œil" ----------
   * <div class="ofc-preuve" data-ordre="lise,louise,emeline,chantal"
   *      data-theme="dark"      (optionnel : sur fond foncé)
   *      data-google="non"      (optionnel : masque la note si elle est déjà affichée)
   *      data-texte="…"></div>  (optionnel : texte de la 2e ligne)
   * Un clic descend jusqu'au carrousel de la page (ou ouvre transformations.html). */
  var cssPreuve = '' +
    '.ofc-preuve{margin:18px 0 0;position:relative;z-index:3;max-width:100%;min-width:0}' +
    '.ofc-preuve a{display:inline-flex;align-items:center;gap:12px;text-decoration:none;color:#2C1F1A;background:rgba(255,255,255,.75);border:1px solid rgba(44,31,26,.1);border-radius:999px;padding:5px 14px 5px 5px;max-width:100%;box-sizing:border-box;-webkit-tap-highlight-color:transparent}' +
    '.ofc-preuve.dark a{color:#fff;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22)}' +
    '.ofc-preuve .fa{display:flex;flex-shrink:0}' +
    '.ofc-preuve .fa img{width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #fff;margin-left:-9px;background:#eee}' +
    '.ofc-preuve .fa img:first-child{margin-left:0}' +
    '.ofc-preuve.dark .fa img{border-color:rgba(255,255,255,.85)}' +
    '.ofc-preuve .tx{display:flex;flex-direction:column;line-height:1.25;text-align:left;min-width:0}' +
    '.ofc-preuve .l1{font-size:.74rem;font-weight:700;white-space:nowrap}' +
    '.ofc-preuve .l1 .st{color:#E0A526;letter-spacing:0;margin-right:5px}' +
    '.ofc-preuve .l2{font-size:.72rem;opacity:.8;white-space:nowrap}' +
    '.ofc-preuve .l2 b{font-weight:700;opacity:1;text-decoration:underline;text-underline-offset:2px}';

  function buildPreuve(el) {
    var ordre = (el.getAttribute('data-ordre') || 'lise,louise,emeline,chantal').split(',').map(function (s) { return s.trim(); });
    var list = ordre.map(function (id) { return DATA.filter(function (t) { return t.id === id && t.photo; })[0]; }).filter(Boolean).slice(0, 3);
    if (!list.length) return;
    if (el.getAttribute('data-theme') === 'dark') el.classList.add('dark');
    var google = el.getAttribute('data-google') !== 'non';
    var texte = el.getAttribute('data-texte') || ('<b>Voir leurs avant/après</b> →');
    var l1 = google ? '<span class="st">★★★★★</span>5,0 · 25 avis Google' : '<span class="st">★★★★★</span>Résultats réels';
    var cible = document.querySelector('.ofc-avis');
    el.innerHTML = '<a href="' + (cible ? '#' : '/transformations.html') + '">' +
      '<span class="fa">' + list.map(function (t) { return '<img src="' + esc(root(t.photo)) + '" alt="" loading="lazy" width="38" height="38">'; }).join('') + '</span>' +
      '<span class="tx"><span class="l1">' + l1 + '</span><span class="l2">' + texte.replace(/<(?!\/?b>)[^>]*>/g, '') + '</span></span></a>';
    if (cible) {
      el.querySelector('a').addEventListener('click', function (e) {
        e.preventDefault();
        var y = cible.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - 70;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      });
    }
  }

  function init() {
    var els = document.querySelectorAll('.ofc-avis');
    var pr = document.querySelectorAll('.ofc-preuve');
    if (!els.length && !pr.length) return;
    injectCss();
    if (pr.length && !document.getElementById('ofc-preuve-css')) {
      var s = document.createElement('style'); s.id = 'ofc-preuve-css'; s.textContent = cssPreuve; document.head.appendChild(s);
    }
    for (var i = 0; i < els.length; i++) build(els[i]);
    for (var j = 0; j < pr.length; j++) buildPreuve(pr[j]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
