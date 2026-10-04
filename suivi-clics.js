/* Suivi des clics sur les boutons importants -> Meta Pixel (événements personnalisés) + dataLayer GTM.
   Noms lisibles dans le Gestionnaire d'événements Meta :
   - Clic_Achat_<Produit>  : clic vers une page de paiement (Stripe / GoCardless)
   - Clic_Bilan            : clic vers Calendly (bilan gratuit)
   - Clic_WhatsApp         : clic vers WhatsApp
   - Clic_Vers_<Page>      : clic vers une autre page du site (ex. Clic_Vers_BootySculpt, Clic_Vers_Offres)
   - Clic_Instagram        : clic vers Instagram
   Le paramètre "page" indique la page où le clic a eu lieu. */
(function () {
  if (window._suiviClicsReady) return;
  window._suiviClicsReady = true;

  var PRODUITS = {
    '8x26oHas9f8n5o9cmh8Vi03': 'SurMesure',
    'eVq6oH6bT0dteYJ2LH8Vi07': 'SurMesureNutrition',
    '9B67sL7fXgcr03P5XT8Vi04': 'DistancielSansEngagement',
    '9B6aEX0Rz1hx6sd9a58Vi0x': 'Consultation',
    'bJefZh1VD5xNaIt9a58Vi0p': 'DiagnosticDistanciel',
    '00w8wP7fXgcr8Al3PL8Vi0q': 'IronGirl',
    'aFa00jfMt9O32bX3PL8Vi0u': 'IronGirl',
    '6oUfZh7fX1hxdUF9a58Vi0w': 'FitDansTaVie',
    '7sY5kD6bT2lBeYJbid8Vi0v': 'FitDansTaVie',
    'fZu00jbwdbWbeYJ2LH8Vi0y': 'FitDansTaVie',
    '00wfZhcAhaS76sdfyt8Vi0d': 'PostPartum',
    '00w00jas9aS7bMx0Dz8Vi0z': 'Planner',
    'fZu7sL43L0dt3g12LH8Vi0e': 'AgelessGirl',
    '8x2eVdcAhgcr4k5bid8Vi0m': 'AgelessGirl',
    'eVq4gzfMtd0f17T2LH8Vi0l': 'VentrePlat',
    '9B69AT7fXbWb9Epfyt8Vi09': 'VentrePlat',
    'bJeeVdgQx6BRg2N4TP8Vi0o': 'GuideRecettes',
    '8x28wP0Rz7FV17Tae98Vi0k': 'BootySculpt',
    '00w00j6bTbWb8Al0Dz8Vi06': 'BootySculpt',
    '14A7sLbwd3pF03P1HD8Vi0c': 'SummerBody',
    '7sY14n57P2lB5o98618Vi0a': 'Bundle',
    '9B6aEX7fX9O317Teup8Vi0r': 'PackMaman',
    'bJe14n57P6BRaItbid8Vi0j': 'Morpho',
    'aFaaEX7fXe4j6sd9a58Vi0i': 'Morpho',
    '4gMdR92ZH9O3dUFbid8Vi0h': 'Morpho',
    'bJe14nfMt4tJ4k5dql8Vi0g': 'Morpho',
    '4gMdR9fMt0dt5o92LH8Vi0f': 'Morpho'
  };
  var PAGE = location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'accueil';

  // "/booty-sculpt.html" -> "BootySculpt", "/blog/xxx.html" -> "Blog", "/" -> "Accueil"
  function nomPage(chemin) {
    if (/^\/blog\//.test(chemin)) return 'Blog';
    var slug = chemin.replace(/^\//, '').replace(/\.html$/, '') || 'accueil';
    if (slug === 'index') slug = 'accueil';
    return slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^A-Za-z0-9]+/)
      .map(function (m) { return m.charAt(0).toUpperCase() + m.slice(1); }).join('').slice(0, 30);
  }

  function envoyer(nom) {
    if (typeof fbq !== 'undefined') fbq('trackCustom', nom, { page: PAGE });
    (window.dataLayer = window.dataLayer || []).push({ event: 'clic_bouton', bouton: nom, page: PAGE });
  }

  // Pour les boutons qui redirigent en JavaScript (window.location.href = lien Stripe)
  window.suiviAchat = function (url) {
    var code = String(url).split('buy.stripe.com/')[1];
    if (code) envoyer('Clic_Achat_' + (PRODUITS[code.split(/[?#]/)[0]] || 'Autre'));
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.href || '';
    if (href.indexOf('buy.stripe.com/') !== -1) {
      var code = href.split('buy.stripe.com/')[1].split(/[?#]/)[0];
      envoyer('Clic_Achat_' + (PRODUITS[code] || 'Autre'));
    } else if (href.indexOf('pay.gocardless.com') !== -1) {
      envoyer('Clic_Achat_Coaching');
    } else if (href.indexOf('calendly.com') !== -1) {
      envoyer('Clic_Bilan');
    } else if (href.indexOf('wa.me/') !== -1 || href.indexOf('api.whatsapp.com') !== -1) {
      envoyer('Clic_WhatsApp');
    } else if (href.indexOf('instagram.com') !== -1) {
      envoyer('Clic_Instagram');
    } else if (a.host === location.host && /\.html$|\/$/.test(a.pathname) && a.pathname !== location.pathname) {
      envoyer('Clic_Vers_' + nomPage(a.pathname));
    }
  }, true);
})();
