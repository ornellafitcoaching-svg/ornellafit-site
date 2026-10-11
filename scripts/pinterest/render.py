"""Génère les visuels Pinterest 1000x1500 (charte OFC) dans images/pinterest/<slug>.jpg.
Usage : python3 scripts/pinterest/render.py batch.json  (champs : slug, photo, pos|fit, eyebrow, headline, sub, cta)"""
import json, os, base64, sys
from playwright.sync_api import sync_playwright

S = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(S, "..", ".."))
OUT = os.path.join(REPO, "images", "pinterest")
os.makedirs(OUT, exist_ok=True)
F = os.environ.get("PIN_FONTS", "/tmp/pinfonts")  # npm pack @fontsource/playfair-display @fontsource/inter, extraits en fontsource-playfair-display / fontsource-inter

b64=lambda f: base64.b64encode(open(f,"rb").read()).decode()
PINS = json.load(open(sys.argv[1] if len(sys.argv) > 1 else S + "/batch.json"))

CSS = f"""
@font-face{{font-family:PF;src:url(data:font/woff2;base64,{b64(F+'/fontsource-playfair-display/files/playfair-display-latin-800-normal.woff2')})}}
@font-face{{font-family:IN;src:url(data:font/woff2;base64,{b64(F+'/fontsource-inter/files/inter-latin-500-normal.woff2')});font-weight:500}}
@font-face{{font-family:IN;src:url(data:font/woff2;base64,{b64(F+'/fontsource-inter/files/inter-latin-600-normal.woff2')});font-weight:600}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1000px;height:1500px;background:#F5EFE6;font-family:IN;overflow:hidden}}
.ph{{height:900px;background-size:cover;position:relative}}
.tag{{position:absolute;top:44px;left:44px;background:#E8634A;color:#fff;font-weight:600;font-size:26px;letter-spacing:3px;padding:14px 26px;border-radius:40px}}
.txt{{padding:50px 64px 0;height:600px;display:flex;flex-direction:column}}
h1{{font-family:PF;color:#1B3A2D;font-size:80px;line-height:1.06;letter-spacing:-1px}}
h1 em{{font-style:normal;color:#E8634A}}
p{{color:#1B3A2D;opacity:.85;font-size:35px;line-height:1.35;margin-top:22px;font-weight:500}}
.ft{{margin-top:auto;margin-bottom:46px;display:flex;justify-content:space-between;align-items:center;border-top:2px solid rgba(27,58,45,.15);padding-top:30px}}
.ft b{{font-family:PF;color:#1B3A2D;font-size:32px}}
.ft span{{background:#1B3A2D;color:#F5EFE6;font-weight:600;font-size:26px;padding:16px 28px;border-radius:40px}}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1000, "height": 1500})
    for x in PINS:
        img = os.path.join(REPO, x["photo"])
        ext = img.rsplit(".", 1)[1].replace("jpg", "jpeg")
        data = base64.b64encode(open(img, "rb").read()).decode()
        html = f"""<html><head><style>{CSS}</style></head><body>
<div class="ph" style="background-image:url(data:image/{ext};base64,{data});background-position:{x.get('pos','center 30%')}">{'<div style="position:absolute;inset:0;backdrop-filter:blur(30px) brightness(.9)"></div><div style="position:absolute;inset:0;background:url(data:image/'+ext+';base64,'+data+') center/contain no-repeat"></div>' if x.get('fit')=='contain' else ''}<div class="tag">{x['eyebrow']}</div></div>
<div class="txt"><h1>{x['headline']}</h1><p>{x['sub']}</p>
<div class="ft"><b>Ornella Fit Coaching</b><span>{x['cta']} →</span></div></div></body></html>"""
        pg.set_content(html)
        pg.evaluate('document.fonts.ready');pg.wait_for_timeout(400)
        pg.screenshot(path=os.path.join(OUT, x["slug"] + ".jpg"), type="jpeg", quality=88)
        print("ok", x["slug"])
    b.close()
