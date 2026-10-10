/* js/stats-guard.js — Ornella Fit Coaching
 * Exclut les visites d'Ornella des statistiques. Chargé EN PREMIER dans le <head>.
 *
 *   ?moi=1  → cet appareil n'est plus compté (localStorage "ofc_internal" = "1")
 *   ?moi=0  → on recompte cet appareil
 *
 * Appareil exclu :
 *   - GTM ne se charge pas (donc ni GA4, ni Clarity, ni Pinterest via GTM) :
 *     chaque snippet GTM commence par if(w.OFC_INTERNAL)return;
 *   - Meta Pixel et Pinterest (suivi-clics.js) ne se chargent pas : leurs snippets
 *     s'arrêtent si fbq / pintrk existent déjà, on pose donc des fonctions vides.
 *   - dataLayer reçoit traffic_type: 'internal' (au cas où).
 */
(function (w, d) {
  'use strict';
  var KEY = 'ofc_internal', toast = '';
  try {
    var m = /[?&]moi=([01])\b/.exec(location.search);
    if (m) {
      if (m[1] === '1') { localStorage.setItem(KEY, '1'); toast = 'Stats désactivées sur cet appareil'; }
      else { localStorage.removeItem(KEY); toast = 'Stats réactivées sur cet appareil'; }
      if (history.replaceState) {
        var q = location.search.replace(/([?&])moi=[01]&?/, '$1').replace(/[?&]$/, '');
        history.replaceState(null, '', location.pathname + q + location.hash);
      }
    }
    w.OFC_INTERNAL = localStorage.getItem(KEY) === '1';
  } catch (e) { w.OFC_INTERNAL = false; }

  if (w.OFC_INTERNAL) {
    var rien = function () {};
    rien.queue = []; rien.loaded = true; rien.version = '2.0';
    w.fbq = w._fbq = rien;
    w.pintrk = rien;
    (w.dataLayer = w.dataLayer || []).push({ traffic_type: 'internal' });
  }

  if (toast) {
    var montrer = function () {
      var t = d.createElement('div');
      t.textContent = toast;
      t.setAttribute('role', 'status');
      t.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:100000;' +
        'background:#1B3A2D;color:#F5EFE6;font:600 14px/1.4 system-ui,-apple-system,sans-serif;' +
        'padding:12px 20px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:calc(100% - 32px);text-align:center';
      d.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 3500);
    };
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', montrer); else montrer();
  }
})(window, document);
