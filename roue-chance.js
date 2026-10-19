(function(){
  "use strict";

  if (localStorage.getItem('ofc_roue_played') === '1') return;
  // Une seule fois par visiteuse : pas ré-affichée avant 7 jours si elle l'a déjà vue (même sans jouer).
  var _shownAt = parseInt(localStorage.getItem('ofc_roue_shown_at') || '0', 10);
  if (_shownAt && (Date.now() - _shownAt) < 7 * 24 * 60 * 60 * 1000) return;
  if (sessionStorage.getItem('ofc_roue_shown')) return;

  var _a='via-proxy-securise',_b='',_c='';
  var BREVO_KEY=_a+_b+_c;
  var API = 'https://xvetwfqzkkcfchxxifuu.supabase.co/functions/v1/site-brevo';
  var LIST_ID = 43;
  var TEMPLATE_ID = 219; // v3 (19/10/2026) : roue 100 % gagnante, lot selon l'objectif + avant/après — source : emails/brevo-maj/roue-v3.html
  var SITE = 'https://www.ornellafitcoaching.com';
  var WA = 'https://wa.me/33756834626?text=';
  // Date affichée = aujourd'hui + 7 jours (urgence douce ; les codes ROUE* n'expirent pas côté Stripe)
  var EXPIRY_LABEL = (function(){ var d = new Date(Date.now() + 7*24*3600*1000); try { return d.toLocaleDateString('fr-FR', { day:'numeric', month:'long' }); } catch(e) { return d.getDate() + '/' + (d.getMonth()+1); } })();

  // Objectif choisi → programme conseillé + avant/après qui lui ressemble (chiffres repris de transformations.html)
  var OBJECTIFS = {
    ventre: {
      chip: 'Perdre du ventre', label: 'perdre du ventre',
      prog: { nom: 'Ventre Plat', duree: '14 jours', prix: 12, url: 'https://buy.stripe.com/9B69AT7fXbWb9Epfyt8Vi09', page: '/ventre-plat.html', img: 'p-ventre-plat.jpg',
              pitch: '14 séances progressives sans matériel, pour dégonfler et raffermir le ventre, à ton rythme.' },
      aa: { img: 'avis-louise-dos.jpg', nom: 'Louise', titre: 'Louise voulait perdre du ventre, elle aussi', resultat: '−9 cm de tour de taille · −5 kg', detail: '9 mois · coaching à domicile',
            texte: '2 séances par semaine avec moi, à la maison, et surtout de la régularité. Sa taille s’est affinée mois après mois : −9 cm de tour de taille et −5 kg.' }
    },
    poids: {
      chip: 'Perdre du poids', label: 'perdre du poids',
      prog: { nom: 'Fit dans ta vie', duree: '28 jours', prix: 49, url: 'https://buy.stripe.com/6oUfZh7fX1hxdUF9a58Vi0w', page: '/fit-dans-ta-vie.html', img: 'p-fit-dans-ta-vie.jpg',
              pitch: '12 séances de 20 à 45 min et ma méthode « assiette », sans régime, pensée pour les femmes qui manquent de temps.' },
      aa: { img: 'avis-maria.jpg', nom: 'Maria', titre: 'Maria voulait perdre du poids, avec 2 enfants et peu de temps', resultat: '−10 kg en 8 mois', detail: '38 ans · maman de 2 · 100 % à distance',
            texte: 'Jamais une séance en face à face : tout s’est fait à distance, avec un programme construit pour elle et un suivi régulier. −10 kg en 8 mois.' }
    },
    fessiers: {
      chip: 'Galber mes fessiers', label: 'galber tes fessiers',
      prog: { nom: 'Booty Sculpt', duree: '8 semaines', prix: 19, url: 'https://buy.stripe.com/00w00j6bTbWb8Al0Dz8Vi06', page: '/booty-sculpt.html', img: 'p-booty-sculpt.jpg',
              pitch: '8 semaines ciblées fessiers, avec les vidéos de chaque exercice, pour les remonter et les arrondir.' },
      aa: { img: 'avis-emeline.jpg', nom: 'Emeline', titre: 'Emeline voulait des fessiers plus galbés', resultat: 'Fessiers remontés · −3 cm de taille', detail: 'dès le 1er mois · maman de 2',
            texte: 'Elle ne croyait plus vraiment aux résultats rapides. En 4 semaines, sa taille s’est affinée et ses fessiers sont remontés. Et elle continue.' }
    },
    postpartum: {
      chip: 'Retrouver mon corps après bébé', label: 'retrouver ton corps après bébé',
      prog: { nom: 'Post-partum', duree: '8 semaines', prix: 17, url: 'https://buy.stripe.com/00wfZhcAhaS76sdfyt8Vi0d', page: '/programme-postpartum.html', img: 'p-postpartum.jpg',
              pitch: '8 semaines pensées pour l’après-bébé : on reconstruit en douceur, puis on tonifie le ventre et la silhouette.' },
      aa: { img: 'avis-ornella.jpg', nom: 'Ornella', titre: 'Moi aussi, je suis passée par là', resultat: 'Mon corps, avant et après ma grossesse', detail: 'ta coach · maman',
            texte: 'Après ma grossesse, je ne reconnaissais plus mon corps. Ce qui m’a fait revenir, ce n’est pas un régime : c’est un entraînement régulier et adapté. C’est exactement ce que je fais avec les mamans que j’accompagne.' }
    },
    muscler: {
      chip: 'Me muscler à la salle', label: 'te muscler à la salle',
      prog: { nom: 'Iron Girl', duree: '8 semaines', prix: 49, url: 'https://buy.stripe.com/00w8wP7fXgcr8Al3PL8Vi0q', page: '/iron-girl-sales.html', img: 'p-iron-girl.jpg',
              pitch: '3 phases, 5 séances par semaine, 74 exercices en vidéo : un vrai plan de salle pour se muscler sans tourner en rond.' },
      aa: { img: 'avis-lise.jpg', nom: 'Lise', titre: 'Lise s’entraînait déjà, mais elle stagnait', resultat: 'Silhouette redessinée', detail: '6 mois · sans régime extrême',
            texte: 'Beaucoup d’efforts, peu de changements visibles. On a tout restructuré : en 6 mois, sa silhouette s’est redessinée, sans régime extrême.' }
    }
  };

  // 100 % gagnant. Ordre visuel sur la roue = ordre du tableau (6 secteurs de 60°).
  // COACH20 = −20 % sur le 1er mois de coaching (en ligne ou hybride), appliqué par Ornella à la main.
  var PRIZES = [
    { label: '−10 %',           code: 'ROUE10',  pct: 10, coaching: false, weight: 20 },
    { label: '−20 %\ncoaching', code: 'COACH20', pct: 20, coaching: true,  weight: 12.5 },
    { label: '−15 %',           code: 'ROUE15',  pct: 15, coaching: false, weight: 25 },
    { label: '−20 %',           code: 'ROUE20',  pct: 20, coaching: false, weight: 10 },
    { label: '−20 %\ncoaching', code: 'COACH20', pct: 20, coaching: true,  weight: 12.5 },
    { label: '−10 %',           code: 'ROUE10',  pct: 10, coaching: false, weight: 20 }
  ];
  var SEGMENT_COLORS = ['#1B3A2D', '#E8634A', '#F5EFE6', '#1B3A2D', '#E8634A', '#F5EFE6'];
  var SEGMENT_TEXT_COLORS = ['#F5EFE6', '#ffffff', '#1B3A2D', '#F5EFE6', '#ffffff', '#1B3A2D'];
  var SEG_ANGLE = 360 / PRIZES.length;

  function pickPrize(){
    var total = 0, i;
    for (i = 0; i < PRIZES.length; i++) total += PRIZES[i].weight;
    var r = Math.random() * total, acc = 0;
    for (i = 0; i < PRIZES.length; i++) {
      acc += PRIZES[i].weight;
      if (r <= acc) return i;
    }
    return PRIZES.length - 1;
  }

  function euros(n){
    var s = (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
    return s.replace(/,00$/, '') + ' €';
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; });
  }

  var css = ''
    + '.ofc-roue-overlay{position:fixed;inset:0;background:rgba(27,58,45,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:10px;opacity:0;transition:opacity .3s ease;}'
    + '.ofc-roue-overlay.ofc-show{opacity:1;}'
    + '.ofc-roue-modal{box-sizing:border-box;background:#F5EFE6;border-radius:20px;max-width:350px;width:100%;max-height:90vh;max-height:90dvh;overflow-y:auto;padding:18px 16px;font-family:Arial,Helvetica,sans-serif;color:#1B3A2D;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center;}'
    + '.ofc-roue-close{position:absolute;top:6px;right:6px;width:36px;height:36px;border:none;background:transparent;font-size:20px;color:#7d8a83;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;}'
    + '.ofc-roue-eyebrow{font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:#E8634A;font-weight:bold;margin:0 0 4px;}'
    + '.ofc-roue-title{font-family:Georgia,"Times New Roman",serif;font-size:20px;margin:0 0 4px;line-height:1.25;color:#1B3A2D;}'
    + '.ofc-roue-sub{font-size:13px;color:#4f5a54;margin:0 0 12px;line-height:1.45;}'
    + '.ofc-roue-wrap{position:relative;width:min(46vw,176px);height:min(46vw,176px);margin:0 auto 12px;}'
    + '.ofc-roue-pointer{position:absolute;top:-6px;left:50%;transform:translateX(-50%);font-size:20px;color:#E8634A;z-index:3;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25));}'
    + '.ofc-roue-wheel{width:100%;height:100%;border-radius:50%;position:relative;border:5px solid #1B3A2D;box-shadow:0 6px 20px rgba(0,0,0,.22);transition:transform 4.2s cubic-bezier(.17,.67,.2,1);will-change:transform;overflow:hidden;}'
    + '.ofc-roue-label{position:absolute;top:50%;left:50%;width:58px;margin-left:-29px;text-align:center;font-size:10.5px;font-weight:bold;line-height:1.05;white-space:pre-line;transform-origin:50% 0;}'
    + '.ofc-roue-hub{position:absolute;top:50%;left:50%;width:24px;height:24px;margin:-12px 0 0 -12px;background:#1B3A2D;border-radius:50%;border:3px solid #F5EFE6;z-index:2;}'
    + '.ofc-roue-q{font-family:Georgia,serif;font-size:15.5px;font-weight:bold;margin:0 0 8px;}'
    + '.ofc-roue-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;}'
    + '.ofc-roue-chip{border:1.5px solid #1B3A2D;background:#fff;color:#1B3A2D;border-radius:22px;padding:9px 12px;font-size:13.5px;font-weight:bold;font-family:Arial,sans-serif;cursor:pointer;}'
    + '.ofc-roue-chip:active,.ofc-roue-chip:hover{background:#1B3A2D;color:#fff;}'
    + '.ofc-roue-picked{font-size:12.5px;color:#4f5a54;margin:0 0 8px;}'
    + '.ofc-roue-picked button{border:none;background:none;color:#E8634A;font-weight:bold;font-size:12.5px;cursor:pointer;padding:0 0 0 4px;text-decoration:underline;}'
    + '.ofc-roue-form{display:none;flex-direction:column;gap:8px;}'
    + '.ofc-roue-form.ofc-show{display:flex;}'
    + '.ofc-roue-input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1.5px solid #d8cdbd;background:#fff;font-size:16px;font-family:Arial,sans-serif;color:#1B3A2D;}'
    + '.ofc-roue-input:focus{outline:none;border-color:#E8634A;}'
    + '.ofc-roue-hint{font-size:11px;color:#7d8a83;margin:-4px 0 0;text-align:left;line-height:1.35;}'
    + '.ofc-roue-btn{display:block;width:100%;box-sizing:border-box;padding:14px;border:none;border-radius:30px;background:#E8634A;color:#fff;font-size:15px;font-weight:bold;font-family:Arial,sans-serif;cursor:pointer;transition:opacity .2s;text-decoration:none;text-align:center;}'
    + '.ofc-roue-btn:disabled{opacity:.55;cursor:default;}'
    + '.ofc-roue-btn.ofc-wa{background:#25D366;}'
    + '.ofc-roue-err{color:#B23A3A;font-size:12px;margin:0;min-height:14px;}'
    + '.ofc-roue-result{display:none;}'
    + '.ofc-roue-result.ofc-show{display:block;}'
    + '.ofc-roue-code{display:inline-block;background:#1B3A2D;color:#fff;font-family:"Courier New",monospace;font-size:20px;font-weight:bold;letter-spacing:2.5px;padding:9px 18px;border-radius:10px;margin:6px 0 4px;}'
    + '.ofc-roue-card{background:#fff;border-radius:14px;padding:12px 14px;margin:10px 0 12px;text-align:left;border:1px solid #eadfce;}'
    + '.ofc-roue-card-k{font-size:10.5px;letter-spacing:1.3px;text-transform:uppercase;color:#7d8a83;font-weight:bold;}'
    + '.ofc-roue-card-t{font-family:Georgia,serif;font-size:17px;font-weight:bold;margin:2px 0 4px;}'
    + '.ofc-roue-card-p{font-size:14px;}'
    + '.ofc-roue-card-p s{color:#9a948a;}'
    + '.ofc-roue-card-p b{color:#E8634A;font-size:17px;}'
    + '.ofc-roue-link{display:inline-block;margin-top:9px;font-size:12.5px;color:#1B3A2D;}'
    + '.ofc-roue-note{font-size:11.5px;color:#7d8a83;margin-top:10px;line-height:1.4;}';

  var styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  var gradientStops = [];
  for (var s = 0; s < PRIZES.length; s++) {
    var startDeg = s * SEG_ANGLE;
    var endDeg = startDeg + SEG_ANGLE;
    gradientStops.push(SEGMENT_COLORS[s] + ' ' + startDeg + 'deg ' + endDeg + 'deg');
  }
  var wheelBg = 'conic-gradient(from 0deg, ' + gradientStops.join(', ') + ')';
  var labelHtml = '';
  for (var l = 0; l < PRIZES.length; l++) {
    var center = l * SEG_ANGLE + SEG_ANGLE / 2;
    var dist = PRIZES[l].label.indexOf('\n') > -1 ? 47 : 56; // libellé sur 2 lignes : un peu plus près du centre pour ne pas déborder
    labelHtml += '<div class="ofc-roue-label" style="transform:rotate(' + center + 'deg) translateY(-' + dist + 'px);color:' + SEGMENT_TEXT_COLORS[l] + '">' + PRIZES[l].label.replace(/\n/g,'<br>') + '</div>';
  }

  var chipsHtml = '';
  for (var key in OBJECTIFS) {
    if (OBJECTIFS.hasOwnProperty(key)) chipsHtml += '<button type="button" class="ofc-roue-chip" data-obj="' + key + '">' + OBJECTIFS[key].chip + '</button>';
  }

  var overlay = document.createElement('div');
  overlay.className = 'ofc-roue-overlay';
  overlay.innerHTML =
    '<div class="ofc-roue-modal" role="dialog" aria-modal="true" aria-label="Roue de la chance">' +
      '<button type="button" class="ofc-roue-close" aria-label="Fermer">✕</button>' +
      '<div class="ofc-roue-form-view">' +
        '<p class="ofc-roue-eyebrow">Le Club Ornella Fit · 100 % gagnant</p>' +
        '<h2 class="ofc-roue-title">🎁 Un cadeau t’attend</h2>' +
        '<p class="ofc-roue-sub">Jusqu’à <strong>−20 % sur mes programmes</strong>, ou <strong>−20 % sur ton 1er mois de coaching</strong>. Tout le monde gagne.</p>' +
        '<div class="ofc-roue-wrap">' +
          '<div class="ofc-roue-pointer">▼</div>' +
          '<div class="ofc-roue-wheel" id="ofcRoueWheel" style="background:' + wheelBg + '">' + labelHtml + '</div>' +
          '<div class="ofc-roue-hub"></div>' +
        '</div>' +
        '<div id="ofcRoueStep1">' +
          '<p class="ofc-roue-q">Ton objectif n°1 ?</p>' +
          '<div class="ofc-roue-chips">' + chipsHtml + '</div>' +
        '</div>' +
        '<form class="ofc-roue-form" id="ofcRoueForm" novalidate>' +
          '<p class="ofc-roue-picked" id="ofcRouePicked"></p>' +
          '<input type="text" class="ofc-roue-input" id="ofcRouePrenom" placeholder="Ton prénom" autocomplete="given-name" required>' +
          '<input type="email" class="ofc-roue-input" id="ofcRoueEmail" placeholder="Ton email (pour recevoir ton code)" autocomplete="email" required>' +
          '<input type="tel" class="ofc-roue-input" id="ofcRoueTel" placeholder="Ton numéro (facultatif)" autocomplete="tel" inputmode="tel">' +
          '<p class="ofc-roue-hint">Ton numéro, c’est seulement si tu veux un petit mot perso de ma part sur WhatsApp. Jamais de pub.</p>' +
          '<p class="ofc-roue-err" id="ofcRoueErr"></p>' +
          '<button type="submit" class="ofc-roue-btn" id="ofcRoueBtn">Je tourne la roue 🎡</button>' +
        '</form>' +
      '</div>' +
      '<div class="ofc-roue-result" id="ofcRoueResult">' +
        '<p class="ofc-roue-eyebrow">La roue a parlé 🎉</p>' +
        '<h2 class="ofc-roue-title" id="ofcResultTitle"></h2>' +
        '<div id="ofcResultBody"></div>' +
        '<p class="ofc-roue-note" id="ofcResultNote"></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  // IMPORTANT : masqué (display:none) tant que la roue n'est pas déclenchée, sinon l'overlay
  // (invisible, opacity:0) capte les clics au centre de la page et bloque l'interaction.
  overlay.style.display = 'none';

  var wheelEl = document.getElementById('ofcRoueWheel');
  var formView = overlay.querySelector('.ofc-roue-form-view');
  var step1 = document.getElementById('ofcRoueStep1');
  var resultView = document.getElementById('ofcRoueResult');
  var closeBtn = overlay.querySelector('.ofc-roue-close');
  var form = document.getElementById('ofcRoueForm');
  var pickedEl = document.getElementById('ofcRouePicked');
  var prenomInput = document.getElementById('ofcRouePrenom');
  var emailInput = document.getElementById('ofcRoueEmail');
  var telInput = document.getElementById('ofcRoueTel');
  var errEl = document.getElementById('ofcRoueErr');
  var btn = document.getElementById('ofcRoueBtn');

  var shown = false;
  var played = false;
  var objKey = '';
  var currentRotation = 0;
  var startTime = Date.now();
  var ROUE_PAGE = (location.pathname || '/').replace(/\.html$/, '') || '/';

  // Remonte un événement au Pixel Meta (événement perso) + dataLayer GTM. Silencieux si absent.
  function track(evtName, extra){
    var data = extra || {};
    data.page = ROUE_PAGE;
    try { if (typeof fbq === 'function') fbq('trackCustom', evtName, data); } catch (e) {}
    try {
      window.dataLayer = window.dataLayer || [];
      var payload = { event: evtName };
      for (var k in data) { if (data.hasOwnProperty(k)) payload[k] = data[k]; }
      window.dataLayer.push(payload);
    } catch (e) {}
  }

  function openRoue(){
    if (shown || played) return;
    shown = true;
    sessionStorage.setItem('ofc_roue_shown', '1');
    try { localStorage.setItem('ofc_roue_shown_at', String(Date.now())); } catch (e) {}
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ overlay.classList.add('ofc-show'); });
    track('RoueShown');
  }

  function closeRoue(){
    if (!played) track('RoueClosed');
    overlay.classList.remove('ofc-show');
    document.body.style.overflow = '';
    setTimeout(function(){ overlay.style.display = 'none'; }, 250);
  }

  closeBtn.addEventListener('click', closeRoue);
  overlay.addEventListener('click', function(e){
    if (e.target === overlay) closeRoue();
  });

  // Étape 1 → 2 : objectif choisi (un seul tap), puis prénom / email / numéro
  function pickObjectif(key){
    objKey = key;
    pickedEl.innerHTML = 'Objectif : <strong>' + esc(OBJECTIFS[key].chip) + '</strong><button type="button" id="ofcRoueChange">modifier</button>';
    step1.style.display = 'none';
    form.classList.add('ofc-show');
    document.getElementById('ofcRoueChange').addEventListener('click', function(){
      form.classList.remove('ofc-show');
      step1.style.display = '';
    });
    track('RoueObjectif', { objectif: key });
    try { prenomInput.focus({ preventScroll: true }); } catch (e) {}
  }
  var chips = overlay.querySelectorAll('.ofc-roue-chip');
  for (var c = 0; c < chips.length; c++) {
    chips[c].addEventListener('click', function(){ pickObjectif(this.getAttribute('data-obj')); });
  }

  function isValidEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // Numéro français → format Brevo (+33…). Renvoie '' si le numéro n'est pas exploitable.
  function normPhone(v){
    var p = String(v || '').replace(/[\s.\-()]/g, '');
    if (/^0[67]\d{8}$/.test(p)) return '+33' + p.slice(1);
    if (/^(\+|00)33[67]\d{8}$/.test(p)) return '+33' + p.slice(-9);
    return '';
  }

  function progUrl(o, prize, email){
    return o.prog.url + '?prefilled_promo_code=' + encodeURIComponent(prize.code) + '&prefilled_email=' + encodeURIComponent(email);
  }

  function waUrl(o, prize, prenom){
    var txt = prize.coaching
      ? 'Bonjour Ornella ! C’est ' + prenom + '. J’ai gagné −20 % sur mon 1er mois de coaching à la roue (code ' + prize.code + ') 😊 Mon objectif : ' + o.chip.toLowerCase() + '.'
      : 'Bonjour Ornella ! C’est ' + prenom + '. J’ai joué à la roue et j’aimerais en savoir plus sur le coaching 😊 Mon objectif : ' + o.chip.toLowerCase() + '.';
    return WA + encodeURIComponent(txt);
  }

  function post(op, body){
    return fetch(API + '?op=' + op, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
      body: JSON.stringify(body)
    }).catch(function(){});
  }

  function sendToBrevo(email, prenom, tel, prize){
    var o = OBJECTIFS[objKey];
    post('contacts', {
      email: email,
      listIds: [LIST_ID],
      updateEnabled: true,
      attributes: {
        PRENOM: prenom,
        OBJECTIF: o.chip,
        PRIZE_PCT: String(prize.pct),
        PROMO_CODE: prize.code,
        PRODUIT_RECOMMANDE: prize.coaching ? 'Coaching (−20 % 1er mois)' : o.prog.nom
      }
    });
    // Numéro enregistré à part : un numéro refusé par Brevo ne doit jamais faire perdre le contact
    if (tel) post('contacts', { email: email, attributes: { SMS: tel }, updateEnabled: true });

    var remise = o.prog.prix * (1 - prize.pct / 100);
    post('email', {
      templateId: TEMPLATE_ID,
      to: [{ email: email, name: prenom }],
      sender: { name: 'Ornella Fit Coaching', email: 'contact@ornellafitcoaching.com' },
      replyTo: { email: 'ornellafit.coaching@gmail.com' },
      params: {
        PRENOM: prenom,
        IS_COACHING: prize.coaching,
        PRIZE_SHORT: prize.coaching ? '−20 % sur ton coaching' : ('−' + prize.pct + ' %'),
        PRIZE_LABEL: prize.coaching ? '−20 % sur ton 1er mois de coaching' : ('−' + prize.pct + ' % sur ton programme'),
        PROMO_CODE: prize.code,
        EXPIRY_LABEL: EXPIRY_LABEL,
        OBJ_LABEL: o.label,
        PROG_NOM: o.prog.nom,
        PROG_DUREE: o.prog.duree,
        PROG_PITCH: o.prog.pitch,
        PROG_PRIX: euros(o.prog.prix),
        PROG_PRIX_REMISE: euros(remise),
        PROG_URL: progUrl(o, prize, email),
        PROG_PAGE: o.prog.page,
        PROG_IMG: SITE + '/images/email/' + o.prog.img,
        AA_IMG: SITE + '/images/email/' + o.aa.img,
        AA_NOM: o.aa.nom,
        AA_TITRE: o.aa.titre,
        AA_RESULTAT: o.aa.resultat,
        AA_DETAIL: o.aa.detail,
        AA_TEXTE: o.aa.texte,
        WA_URL: waUrl(o, prize, prenom)
      }
    });
  }

  function showResult(prize, email, prenom){
    var o = OBJECTIFS[objKey];
    var title = document.getElementById('ofcResultTitle');
    var body = document.getElementById('ofcResultBody');
    var note = document.getElementById('ofcResultNote');
    if (prize.coaching) {
      title.innerHTML = esc(prenom) + ', tu as gagné <span style="color:#E8634A">−20 % sur ton 1er mois de coaching</span>';
      body.innerHTML =
        '<span class="ofc-roue-code">' + prize.code + '</span>' +
        '<p class="ofc-roue-sub" style="margin:8px 0 12px">Le plus beau lot de la roue ! Écris-moi sur WhatsApp avec ton code : on fait ton <strong>bilan offert</strong> (appel de 15 min ou messages) et je te construis ton programme pour ' + esc(o.label) + '.</p>' +
        '<a class="ofc-roue-btn ofc-wa" href="' + waUrl(o, prize, prenom) + '" target="_blank" rel="noopener">💬 Je réclame mon −20 % →</a>';
    } else {
      var remise = o.prog.prix * (1 - prize.pct / 100);
      title.innerHTML = esc(prenom) + ', tu as gagné <span style="color:#E8634A">−' + prize.pct + ' %</span> 🎉';
      body.innerHTML =
        '<span class="ofc-roue-code">' + prize.code + '</span>' +
        '<div class="ofc-roue-card">' +
          '<div class="ofc-roue-card-k">Pour ' + esc(o.label) + ', je te conseille</div>' +
          '<div class="ofc-roue-card-t">' + esc(o.prog.nom) + ' · ' + esc(o.prog.duree) + '</div>' +
          '<div class="ofc-roue-card-p"><s>' + euros(o.prog.prix) + '</s> <b>' + euros(remise) + '</b> avec ton code</div>' +
        '</div>' +
        '<a class="ofc-roue-btn" href="' + progUrl(o, prize, email) + '" id="ofcRoueBuy">J’en profite, code appliqué →</a>' +
        '<a class="ofc-roue-link" href="' + o.prog.page + '?src=roue">Voir le programme en détail</a>';
    }
    note.textContent = 'Ton code t’attend aussi par email (valable jusqu’au ' + EXPIRY_LABEL + ').';
    formView.style.display = 'none';
    resultView.classList.add('ofc-show');
    var buy = document.getElementById('ofcRoueBuy');
    if (buy) buy.addEventListener('click', function(){ track('RoueCheckout', { code: prize.code, produit: o.prog.nom }); });
  }

  function showAlreadyPlayed(){
    var title = document.getElementById('ofcResultTitle');
    var body = document.getElementById('ofcResultBody');
    var note = document.getElementById('ofcResultNote');
    title.textContent = 'Tu as déjà tenté ta chance 🎡';
    body.innerHTML = '<p class="ofc-roue-sub">Retrouve ton code dans l’email qu’on t’a envoyé la première fois (vérifie aussi tes spams).</p>';
    if (note) note.style.display = 'none';
    formView.style.display = 'none';
    resultView.classList.add('ofc-show');
    track('RoueAlreadyPlayed');
  }

  function spin(email, prenom, tel){
    btn.textContent = 'La roue tourne...';
    var idx = pickPrize();
    var prize = PRIZES[idx];
    var center = idx * SEG_ANGLE + SEG_ANGLE / 2;
    var spins = 5;
    var target = spins * 360 + (360 - center);
    currentRotation += target;
    wheelEl.style.transform = 'rotate(' + currentRotation + 'deg)';

    played = true;
    localStorage.setItem('ofc_roue_played', '1');
    sendToBrevo(email, prenom, tel, prize);

    // Email capturé = vrai Lead (standard Meta, exploitable pour l'optim des pubs) + détail du lot.
    try { if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'Roue de la chance', page: ROUE_PAGE }); } catch (e) {}
    track('RoueLead', { objectif: objKey });
    track('RouePrize', { prize: prize.coaching ? 'coaching-20' : ('-' + prize.pct + '%'), code: prize.code, objectif: objKey });

    // Pendant la rotation, on remonte la roue à l'écran (le formulaire disparaît pour la laisser voir)
    form.classList.remove('ofc-show');
    try { overlay.querySelector('.ofc-roue-modal').scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}

    setTimeout(function(){
      showResult(prize, email, prenom);
    }, 4300);
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var prenom = prenomInput.value.trim().replace(/\s+/g, ' ').slice(0, 40);
    var email = emailInput.value.trim();
    var rawTel = telInput.value.trim();
    var tel = normPhone(rawTel);
    if (!objKey) { errEl.textContent = 'Choisis d’abord ton objectif.'; return; }
    if (!prenom) { errEl.textContent = 'Merci d’indiquer ton prénom.'; return; }
    if (!isValidEmail(email)) { errEl.textContent = 'Merci d’entrer un email valide.'; return; }
    if (rawTel && !tel) { errEl.textContent = 'Ce numéro ne semble pas valide (ex. 06 12 34 56 78). Tu peux aussi le laisser vide.'; return; }
    prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1);
    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Vérification...';

    // Vérifie côté Brevo (source de vérité) si cet email a déjà joué, pour ne jamais
    // ré-attribuer un code si le localStorage local ne suffit pas (ex: navigateur in-app différent).
    fetch(API + '?op=in-list&list=' + LIST_ID + '&email=' + encodeURIComponent(email)
    ).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
    .then(function(res){
      var already = !!(res && res.inList);
      if (already) {
        played = true;
        localStorage.setItem('ofc_roue_played', '1');
        showAlreadyPlayed();
        return;
      }
      spin(email, prenom, tel);
    });
  });

  // Déclenchement RETARDÉ (visiteuse déjà engagée) : 35s après chargement OU 55% de scroll,
  // filet de sécurité 45s, + exit-intent desktop (souris vers le haut de l'écran, prioritaire).
  // But : ne plus couvrir la page au moment où elle commence à lire (cause n°1 de fermeture).
  setTimeout(function(){ if (!shown) openRoue(); }, 35000);

  // Plancher de temps : la roue ne peut JAMAIS surgir "trop vite" au début de la lecture.
  var SCROLL_MIN_DELAY = 12000; // scroll : pas avant 12s
  var EXIT_MIN_DELAY = 6000;    // exit-intent : pas avant 6s (garde le rattrapage de celles qui partent)

  var _rTick = false;
  window.addEventListener('scroll', function(){
    if (shown || _rTick) return;
    if (Date.now() - startTime < SCROLL_MIN_DELAY) return;
    _rTick = true;
    requestAnimationFrame(function(){
      _rTick = false;
      var scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrolled >= 0.55) openRoue();
    });
  }, { passive: true });

  document.addEventListener('mousemove', function(e){
    if (shown) return;
    if (Date.now() - startTime < EXIT_MIN_DELAY) return;
    if (e.clientY <= 8) openRoue();
  });

  setTimeout(function(){ if (!shown) openRoue(); }, 45000);
})();
