// Génère la brochure PDF des tarifs (hors site) : node scripts/tarifs-pdf/build.js
// Sortie : files/tarifs-ornella-fit-coaching.pdf
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, 'tarifs.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(__dirname, '..', '..', 'files', 'tarifs-ornella-fit-coaching.pdf');
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log('PDF →', out);
})();
