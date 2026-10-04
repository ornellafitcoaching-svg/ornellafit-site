/* panier.js — Ornella Fit Coaching
 * Avant d'envoyer vers Stripe, demande prénom + e-mail dans une petite fenêtre
 * (sauf si la visiteuse l'a déjà donné sur le site : on passe alors directement au paiement).
 * → l'e-mail est pré-rempli sur la page de paiement
 * → si le paiement n'est pas terminé, les relances automatiques (1 h / 24 h / 72 h) prennent le relais.
 * Aucune clé secrète ici : tout passe par la fonction sécurisée Supabase « site-brevo ».
 * Pour désactiver sur un lien précis : ajouter l'attribut data-sans-panier au lien.
 */
(function () {
  'use strict';
  var API = 'https://xvetwfqzkkcfchxxifuu.supabase.co/functions/v1/site-brevo?op=panier';
  var STORE_EMAIL = 'ofc_email', STORE_PRENOM = 'ofc_prenom';
  var EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,24}$/i;

  function get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var EMAIL_KEYS = [STORE_EMAIL, 'ofc_last_email', 'ornella_lead_email', 'fdtv_buyer_email', 'bs_buyer_email',
    'vp_buyer_email', 'bd_buyer_email', 'pm_buyer_email', 'pp_buyer_email'];
  var PRENOM_KEYS = [STORE_PRENOM, 'fdtv_buyer_fname', 'bs_buyer_fname', 'vp_buyer_fname', 'bd_buyer_fname', 'pm_buyer_fname'];
  function first(keys) { for (var i = 0; i < keys.length; i++) { var v = get(keys[i]); if (v) return v; } return ''; }
  function knownEmail() { var e = first(EMAIL_KEYS).trim().toLowerCase(); return EMAIL_RE.test(e) ? e : ''; }
  function knownPrenom() { return first(PRENOM_KEYS).trim(); }

  var css = '' +
    '#ofcp-bg{position:fixed;inset:0;background:rgba(44,31,26,.55);z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s}' +
    '#ofcp-bg.ofcp-on{opacity:1}' +
    '@media(min-width:600px){#ofcp-bg{align-items:center}}' +
    '#ofcp{background:#fff;width:100%;max-width:420px;border-radius:22px 22px 0 0;padding:28px 22px 22px;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;color:#2C1F1A;transform:translateY(24px);transition:transform .25s;box-shadow:0 -8px 40px rgba(0,0,0,.15)}' +
    '@media(min-width:600px){#ofcp{border-radius:22px}}' +
    '#ofcp-bg.ofcp-on #ofcp{transform:none}' +
    '#ofcp .ofcp-x{position:absolute;right:14px;top:10px;background:none;border:0;font-size:26px;line-height:1;color:#9A8080;cursor:pointer;padding:6px}' +
    '#ofcp .ofcp-k{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#C96358;font-weight:700;margin:0 0 6px}' +
    '#ofcp h3{font-family:Georgia,serif;font-weight:600;font-size:22px;line-height:1.25;margin:0 0 6px}' +
    '#ofcp .ofcp-p{font-size:14px;color:#6F5B52;line-height:1.55;margin:0 0 18px}' +
    '#ofcp input{display:block;width:100%;box-sizing:border-box;border:1.5px solid #EAD9D1;border-radius:12px;padding:14px 14px;font-size:16px;margin:0 0 10px;color:#2C1F1A;background:#FDFBF9;outline:none}' +
    '#ofcp input:focus{border-color:#C96358;background:#fff}' +
    '#ofcp .ofcp-go{display:block;width:100%;border:0;border-radius:50px;background:#C96358;color:#fff;font-weight:700;font-size:16px;padding:16px;margin:6px 0 10px;cursor:pointer}' +
    '#ofcp .ofcp-go[disabled]{opacity:.7;cursor:wait}' +
    '#ofcp .ofcp-err{color:#B3261E;font-size:13px;min-height:16px;margin:0 0 4px}' +
    '#ofcp .ofcp-s{font-size:12px;color:#9A8080;text-align:center;margin:0;line-height:1.5}';

  var bg, form, inPrenom, inEmail, btn, err, pending = null;

  function build() {
    if (bg) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    bg = document.createElement('div'); bg.id = 'ofcp-bg';
    bg.innerHTML =
      '<form id="ofcp" novalidate role="dialog" aria-modal="true" aria-labelledby="ofcp-t" style="position:relative">' +
      '<button type="button" class="ofcp-x" aria-label="Fermer">×</button>' +
      '<p class="ofcp-k">Dernière étape avant le paiement</p>' +
      '<h3 id="ofcp-t">Où je t\'envoie ton accès ?</h3>' +
      '<p class="ofcp-p">Ton e-mail sert à t\'envoyer ton programme juste après le paiement.</p>' +
      '<input type="text" name="prenom" autocomplete="given-name" placeholder="Ton prénom" maxlength="60">' +
      '<input type="email" name="email" autocomplete="email" inputmode="email" placeholder="Ton e-mail" required>' +
      '<p class="ofcp-err" aria-live="polite"></p>' +
      '<button type="submit" class="ofcp-go">Continuer vers le paiement sécurisé →</button>' +
      '<p class="ofcp-s">🔒 Paiement sécurisé par Stripe · Aucun spam</p>' +
      '</form>';
    document.body.appendChild(bg);
    form = bg.querySelector('form');
    inPrenom = form.querySelector('[name=prenom]');
    inEmail = form.querySelector('[name=email]');
    btn = form.querySelector('.ofcp-go');
    err = form.querySelector('.ofcp-err');
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    form.querySelector('.ofcp-x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && bg.classList.contains('ofcp-on')) close(); });
    form.addEventListener('submit', submit);
  }

  function open(link) {
    build();
    pending = link;
    inPrenom.value = knownPrenom();
    inEmail.value = knownEmail();
    err.textContent = '';
    btn.disabled = false;
    btn.textContent = 'Continuer vers le paiement sécurisé →';
    bg.style.display = 'flex';
    requestAnimationFrame(function () { bg.classList.add('ofcp-on'); });
    setTimeout(function () { (inPrenom.value ? inEmail : inPrenom).focus(); }, 60);
  }

  function close() {
    if (!bg) return;
    bg.classList.remove('ofcp-on');
    setTimeout(function () { bg.style.display = 'none'; }, 200);
    pending = null;
  }

  // Enregistre le panier puis part sur Stripe (e-mail pré-rempli). Ne bloque jamais le paiement :
  // si le serveur ne répond pas en 4 s, on part quand même sur Stripe.
  function register(link, email, prenom, newTab) {
    link = String(link).split('?')[0];
    set(STORE_EMAIL, email); if (prenom) set(STORE_PRENOM, prenom);
    var fallback = link + '?prefilled_email=' + encodeURIComponent(email);
    var win = newTab ? window.open('', '_blank') : null; // ouvert tout de suite pour ne pas être bloqué
    var done = false;
    function go(url) {
      if (done) return; done = true;
      if (win) { try { win.opener = null; win.location.href = url; } catch (e) { window.location.href = url; } close(); }
      else window.location.href = url;
    }
    var timer = setTimeout(function () { go(fallback); }, 4000);
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, prenom: prenom || '', link: link, page: location.pathname })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (res) {
        clearTimeout(timer);
        go(res && res.url && res.url.indexOf('https://buy.stripe.com/') === 0 ? res.url : fallback);
      });
  }

  function submit(e) {
    e.preventDefault();
    var email = inEmail.value.trim().toLowerCase();
    var prenom = inPrenom.value.trim();
    if (!EMAIL_RE.test(email)) { err.textContent = 'Vérifie ton adresse e-mail 🙂'; inEmail.focus(); return; }
    btn.disabled = true; btn.textContent = 'Un instant…';
    register(pending.href, email, prenom, pending.target === '_blank');
  }

  // Pour les pages qui ont déjà leur propre formulaire (prénom + e-mail) avant le paiement :
  //   ofcPanierGo('https://buy.stripe.com/…', email, prenom[, nouvelOnglet])
  // Sans e-mail valide, la petite fenêtre s'ouvre.
  window.ofcPanierGo = function (link, email, prenom, newTab) {
    email = String(email || '').trim().toLowerCase();
    if (EMAIL_RE.test(email)) { register(link, email, String(prenom || '').trim(), !!newTab); return; }
    open({ href: link, target: newTab ? '_blank' : '_self' });
  };

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="https://buy.stripe.com/"]');
    if (!a || a.hasAttribute('data-sans-panier')) return;
    e.preventDefault();
    var email = knownEmail();
    if (email) { register(a.href, email, knownPrenom(), a.target === '_blank'); }
    else open(a);
  }, true);
})();
