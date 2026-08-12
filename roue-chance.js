(function(){
  "use strict";

  if (localStorage.getItem('ofc_roue_played') === '1') return;
  if (sessionStorage.getItem('ofc_roue_shown')) return;

  var _a='xkeysib-b3f029f593ab90bd2bb',_b='2290988c5a455f29ddad8ec51e4ca585',_c='dcf702b601838-1wVKxDw8s4P48lV3';
  var BREVO_KEY=_a+_b+_c;
  var LIST_ID = 43;
  var TEMPLATE_ID = 160;
  var EXPIRY_LABEL = '19 août 2026';

  // Ordre visuel sur la roue = ordre dans ce tableau (5 secteurs de 72°)
  var PRIZES = [
    { label: '-5%',      code: 'ROUE5',  pct: 5,  weight: 35, win: true  },
    { label: 'Pas de\nchance', code: '', pct: 0,  weight: 15, win: false },
    { label: '-10%',     code: 'ROUE10', pct: 10, weight: 30, win: true  },
    { label: '-15%',     code: 'ROUE15', pct: 15, weight: 15, win: true  },
    { label: '-20%\n🎉', code: 'ROUE20', pct: 20, weight: 5,  win: true  }
  ];
  var SEGMENT_COLORS = ['#C45C78', '#F7F1EF', '#D9A97A', '#C45C78', '#B9825A'];
  var SEGMENT_TEXT_COLORS = ['#fff', '#302D2B', '#302D2B', '#fff', '#fff'];
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

  var css = ''
    + '.ofc-roue-overlay{position:fixed;inset:0;background:rgba(48,45,43,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:10px;opacity:0;transition:opacity .3s ease;}'
    + '.ofc-roue-overlay.ofc-show{opacity:1;}'
    + '.ofc-roue-modal{box-sizing:border-box;background:#F7F1EF;border-radius:20px;max-width:340px;width:100%;max-height:88vh;max-height:88dvh;overflow-y:auto;padding:18px 16px 18px;font-family:Georgia,serif;color:#302D2B;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center;}'
    + '.ofc-roue-close{position:absolute;top:6px;right:6px;width:36px;height:36px;border:none;background:transparent;font-size:20px;color:#8C7A73;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;}'
    + '.ofc-roue-eyebrow{font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;color:#B9825A;font-weight:bold;margin:0 0 4px;}'
    + '.ofc-roue-title{font-size:18px;margin:0 0 4px;line-height:1.25;}'
    + '.ofc-roue-sub{font-size:12.5px;color:#5B5450;margin:0 0 12px;line-height:1.4;}'
    + '.ofc-roue-wrap{position:relative;width:min(48vw,180px);height:min(48vw,180px);margin:0 auto 12px;}'
    + '.ofc-roue-pointer{position:absolute;top:-5px;left:50%;transform:translateX(-50%);font-size:20px;color:#302D2B;z-index:3;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25));}'
    + '.ofc-roue-wheel{width:100%;height:100%;border-radius:50%;position:relative;border:5px solid #302D2B;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:transform 4.2s cubic-bezier(.17,.67,.2,1);will-change:transform;overflow:hidden;}'
    + '.ofc-roue-label{position:absolute;top:50%;left:50%;width:60px;margin-left:-30px;text-align:center;font-size:11px;font-weight:bold;line-height:1.05;white-space:pre-line;transform-origin:50% 0;}'
    + '.ofc-roue-hub{position:absolute;top:50%;left:50%;width:26px;height:26px;margin:-13px 0 0 -13px;background:#302D2B;border-radius:50%;border:3px solid #F7F1EF;z-index:2;}'
    + '.ofc-roue-form{display:flex;flex-direction:column;gap:8px;}'
    + '.ofc-roue-input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1.5px solid #D9C9C0;background:#fff;font-size:16px;font-family:Georgia,serif;color:#302D2B;}'
    + '.ofc-roue-input:focus{outline:none;border-color:#C45C78;}'
    + '.ofc-roue-btn{width:100%;padding:13px;border:none;border-radius:30px;background:#C45C78;color:#fff;font-size:14.5px;font-weight:bold;font-family:Arial,sans-serif;cursor:pointer;transition:opacity .2s;}'
    + '.ofc-roue-btn:disabled{opacity:.55;cursor:default;}'
    + '.ofc-roue-err{color:#B23A3A;font-size:12px;margin:0;min-height:14px;}'
    + '.ofc-roue-result{display:none;}'
    + '.ofc-roue-result.ofc-show{display:block;}'
    + '.ofc-roue-code{display:inline-block;background:#302D2B;color:#fff;font-family:"Courier New",monospace;font-size:19px;font-weight:bold;letter-spacing:2.5px;padding:10px 18px;border-radius:10px;margin:8px 0;}'
    + '.ofc-roue-note{font-size:11.5px;color:#8C7A73;margin-top:8px;line-height:1.4;}';

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
    labelHtml += '<div class="ofc-roue-label" style="transform:rotate(' + center + 'deg) translateY(-54px);color:' + SEGMENT_TEXT_COLORS[l] + '">' + PRIZES[l].label.replace(/\n/g,'<br>') + '</div>';
  }

  var overlay = document.createElement('div');
  overlay.className = 'ofc-roue-overlay';
  overlay.innerHTML =
    '<div class="ofc-roue-modal">' +
      '<button type="button" class="ofc-roue-close" aria-label="Fermer">✕</button>' +
      '<div class="ofc-roue-form-view">' +
        '<p class="ofc-roue-eyebrow">Le Club Ornella Fit</p>' +
        '<h2 class="ofc-roue-title">🎡 Tente ta chance</h2>' +
        '<p class="ofc-roue-sub">Entre ton email et fais tourner la roue pour tenter de gagner une réduction sur tes programmes.</p>' +
        '<div class="ofc-roue-wrap">' +
          '<div class="ofc-roue-pointer">▼</div>' +
          '<div class="ofc-roue-wheel" id="ofcRoueWheel" style="background:' + wheelBg + '">' + labelHtml + '</div>' +
          '<div class="ofc-roue-hub"></div>' +
        '</div>' +
        '<form class="ofc-roue-form" id="ofcRoueForm">' +
          '<input type="email" class="ofc-roue-input" id="ofcRoueEmail" placeholder="Ton email" required>' +
          '<p class="ofc-roue-err" id="ofcRoueErr"></p>' +
          '<button type="submit" class="ofc-roue-btn" id="ofcRoueBtn">Je fais tourner la roue</button>' +
        '</form>' +
      '</div>' +
      '<div class="ofc-roue-result" id="ofcRoueResult">' +
        '<p class="ofc-roue-eyebrow" id="ofcResultEyebrow">Le Club Ornella Fit</p>' +
        '<h2 class="ofc-roue-title" id="ofcResultTitle"></h2>' +
        '<p class="ofc-roue-sub" id="ofcResultSub"></p>' +
        '<p class="ofc-roue-note" id="ofcResultNote">On vient aussi de t\'envoyer ton résultat par email.</p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var wheelEl = document.getElementById('ofcRoueWheel');
  var formView = overlay.querySelector('.ofc-roue-form-view');
  var resultView = document.getElementById('ofcRoueResult');
  var closeBtn = overlay.querySelector('.ofc-roue-close');
  var form = document.getElementById('ofcRoueForm');
  var emailInput = document.getElementById('ofcRoueEmail');
  var errEl = document.getElementById('ofcRoueErr');
  var btn = document.getElementById('ofcRoueBtn');

  var shown = false;
  var played = false;
  var currentRotation = 0;

  function openRoue(){
    if (shown || played) return;
    shown = true;
    sessionStorage.setItem('ofc_roue_shown', '1');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ overlay.classList.add('ofc-show'); });
  }

  function closeRoue(){
    overlay.classList.remove('ofc-show');
    document.body.style.overflow = '';
    setTimeout(function(){ overlay.style.display = 'none'; }, 250);
  }

  closeBtn.addEventListener('click', closeRoue);
  overlay.addEventListener('click', function(e){
    if (e.target === overlay) closeRoue();
  });

  function isValidEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function sendToBrevo(email, prize){
    var attrs = {
      PRIZE_PCT: String(prize.pct),
      PROMO_CODE: prize.code
    };
    fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
      body: JSON.stringify({
        email: email,
        listIds: [LIST_ID],
        updateEnabled: true,
        attributes: attrs
      })
    }).catch(function(){});

    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
      body: JSON.stringify({
        templateId: TEMPLATE_ID,
        to: [{ email: email }],
        params: {
          IS_WIN: prize.win,
          PRIZE_LABEL: prize.win ? ('-' + prize.pct + '%') : '',
          PROMO_CODE: prize.code,
          EXPIRY_LABEL: EXPIRY_LABEL
        }
      })
    }).catch(function(){});
  }

  function showResult(prize){
    var title = document.getElementById('ofcResultTitle');
    var sub = document.getElementById('ofcResultSub');
    if (prize.win) {
      title.innerHTML = 'Tu as gagné <span style="color:#C45C78">' + prize.label.replace(/\n/g,' ') + '</span> !';
      sub.innerHTML = 'Ton code : <span class="ofc-roue-code">' + prize.code + '</span><br>Valable jusqu\'au ' + EXPIRY_LABEL + ' sur tous mes programmes digitaux.';
    } else {
      title.textContent = 'Pas de chance cette fois-ci 🎡';
      sub.textContent = 'Ça arrive ! Reviens tenter ta chance lors d\'une prochaine visite.';
    }
    formView.style.display = 'none';
    resultView.classList.add('ofc-show');
  }

  function showAlreadyPlayed(){
    var title = document.getElementById('ofcResultTitle');
    var sub = document.getElementById('ofcResultSub');
    var note = document.getElementById('ofcResultNote');
    title.textContent = 'Tu as déjà tenté ta chance 🎡';
    sub.textContent = 'Retrouve ton code dans l\'email qu\'on t\'a envoyé la première fois (vérifie aussi tes spams).';
    if (note) note.style.display = 'none';
    formView.style.display = 'none';
    resultView.classList.add('ofc-show');
  }

  function spin(email){
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
    sendToBrevo(email, prize);

    setTimeout(function(){
      showResult(prize);
    }, 4300);
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var email = emailInput.value.trim();
    if (!isValidEmail(email)) {
      errEl.textContent = 'Merci d\'entrer un email valide.';
      return;
    }
    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Vérification...';

    // Vérifie côté Brevo (source de vérité) si cet email a déjà joué, pour ne jamais
    // ré-attribuer un code si le localStorage local ne suffit pas (ex: navigateur in-app différent).
    fetch('https://api.brevo.com/v3/contacts/' + encodeURIComponent(email), {
      headers: { 'api-key': BREVO_KEY }
    }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
    .then(function(contact){
      var already = contact && contact.listIds && contact.listIds.indexOf(LIST_ID) !== -1;
      if (already) {
        played = true;
        localStorage.setItem('ofc_roue_played', '1');
        showAlreadyPlayed();
        return;
      }
      spin(email);
    });
  });

  // Déclenchement : 10s après chargement OU 25% de scroll, avec filet de sécurité mobile 22s
  // et exit-intent desktop (mouvement de souris vers le haut de l'écran).
  var timerShown = false;
  setTimeout(function(){ if (!shown) openRoue(); }, 10000);

  window.addEventListener('scroll', function(){
    if (shown) return;
    var scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    if (scrolled >= 0.25) openRoue();
  }, { passive: true });

  document.addEventListener('mousemove', function(e){
    if (shown) return;
    if (e.clientY <= 8) openRoue();
  });

  setTimeout(function(){ if (!shown) openRoue(); }, 22000);
})();
