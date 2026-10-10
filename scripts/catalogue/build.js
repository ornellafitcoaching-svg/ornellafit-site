// Génère les visuels catalogue (images/catalogue/<id>.jpg, 1080x1080) et le flux Meta (meta-catalogue.csv).
// Usage : node scripts/catalogue/build.js   — source des produits : scripts/catalogue/produits.json
const fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const ROOT = path.join(__dirname, '..', '..');
const SITE = 'https://www.ornellafitcoaching.com/';
const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'produits.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const prix = p => p.replace('.', ',').replace(',00', '') + '€';
function page(p) {
  const imgs = p.imgs.map(i => `<div class="ph"><div class="bg" style="background-image:url('file://${path.join(ROOT, i)}')"></div><img src="file://${path.join(ROOT, i)}" style="object-fit:${p.fit};object-position:${p.pos || 'center'}"></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&family=DM+Sans:wght@500;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1080px;background:#F5EFE6;font-family:'DM Sans';display:flex;flex-direction:column;overflow:hidden}
.top{height:690px;display:flex;gap:14px;padding:36px 36px 0}.ph{flex:1;position:relative;border-radius:28px;overflow:hidden;background:#EADFD3}
.ph .bg{position:absolute;inset:-30px;background-size:cover;background-position:center;filter:blur(28px) brightness(.95);opacity:.55}
.ph img{position:relative;width:100%;height:100%;display:block}
.bot{flex:1;padding:34px 56px 40px;display:flex;flex-direction:column}
.k{font:800 22px/1 'DM Sans';letter-spacing:.2em;text-transform:uppercase;color:#E8634A}
h1{font:600 54px/1.08 'Playfair Display';color:#1B3A2D;margin:16px 0 10px}
.s{font:500 27px/1.3 'DM Sans';color:#5B4A42}
.row{margin-top:auto;display:flex;align-items:center;justify-content:space-between}
.pr{background:#E8634A;color:#fff;font:700 44px/1 'Playfair Display';padding:16px 34px;border-radius:999px}
.br{font:700 22px/1.3 'DM Sans';color:#1B3A2D;text-align:right}.br span{display:block;font-weight:500;color:#8B7A71;font-size:19px}
</style></head><body><div class="top">${imgs}</div><div class="bot"><span class="k">${esc(p.type)}</span><h1>${esc(p.title.split(' — ')[0])}</h1><div class="s">${esc(p.title.includes(' — ') ? p.title.split(' — ')[1] + ' · ' + p.sub : p.sub)}</div>
<div class="row"><span class="pr">${prix(p.price)}</span><span class="br">Ornella Fit Coaching<span>Coach diplômée d'État · accès immédiat</span></span></div></div></body></html>`;
}
(async () => {
  const b = await pw.chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  for (const p of P) {
    const tmp = path.join(__dirname, '_tmp.html');
    fs.writeFileSync(tmp, page(p));
    await pg.goto('file://' + tmp, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(ROOT, 'images', 'catalogue', p.id + '.jpg'), type: 'jpeg', quality: 86 });
  }
  await b.close();
  fs.unlinkSync(path.join(__dirname, '_tmp.html'));
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const head = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'google_product_category', 'product_type'];
  const rows = P.map(p => [p.id, p.title, p.desc, p.avail, 'new', p.price + ' EUR', SITE + p.link, SITE + 'images/catalogue/' + p.id + '.jpg', 'Ornella Fit Coaching', 'Sporting Goods > Exercise & Fitness', p.type].map(q).join(','));
  fs.writeFileSync(path.join(ROOT, 'meta-catalogue.csv'), head.join(',') + '\n' + rows.join('\n') + '\n');
  console.log(P.length + ' produits → meta-catalogue.csv + images/catalogue/');
})();
