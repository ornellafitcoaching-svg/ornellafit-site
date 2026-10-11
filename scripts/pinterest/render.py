"""Génère les visuels Pinterest 1000x1500 (charte OFC, gabarit v2) dans images/pinterest/<slug>.jpg.
Gabarit v2 : titre en HAUT (gros, lisible en miniature), photo au milieu, gros bandeau CTA corail en bas.
Usage : python3 scripts/pinterest/render.py batch.json
Champs : slug, photo, pos|fit("contain" pour photos basse résolution), eyebrow, headline (<em> = mot en corail),
         sub (1 ligne courte), cta (texte du bandeau, ex. « Lire l'article gratuit »),
         labels (optionnel, avant/après sur une photo déjà en 2 volets, ex. ["AVANT","APRÈS"])."""
import json, os, base64, sys, re
from playwright.sync_api import sync_playwright

S = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(S, "..", ".."))
OUT = os.path.join(REPO, "images", "pinterest")
os.makedirs(OUT, exist_ok=True)
F = os.environ.get("PIN_FONTS", "/tmp/pinfonts")  # npm pack @fontsource/playfair-display @fontsource/inter, extraits en fontsource-playfair-display / fontsource-inter

b64 = lambda f: base64.b64encode(open(f, "rb").read()).decode()
PINS = json.load(open(sys.argv[1] if len(sys.argv) > 1 else S + "/batch.json"))

CSS = f"""
@font-face{{font-family:PF;src:url(data:font/woff2;base64,{b64(F+'/fontsource-playfair-display/files/playfair-display-latin-800-normal.woff2')})}}
@font-face{{font-family:IN;src:url(data:font/woff2;base64,{b64(F+'/fontsource-inter/files/inter-latin-500-normal.woff2')});font-weight:500}}
@font-face{{font-family:IN;src:url(data:font/woff2;base64,{b64(F+'/fontsource-inter/files/inter-latin-700-normal.woff2')});font-weight:700}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1000px;height:1500px;background:#F5EFE6;font-family:IN;overflow:hidden;display:flex;flex-direction:column}}
.top{{padding:54px 60px 34px}}
.tag{{display:inline-block;background:#E8634A;color:#fff;font-weight:700;font-size:27px;letter-spacing:3px;padding:12px 24px;border-radius:40px;margin-bottom:24px}}
h1{{font-family:PF;color:#1B3A2D;font-size:98px;line-height:1.02;letter-spacing:-1.5px}}
h1 em{{font-style:normal;color:#E8634A}}
p{{color:#1B3A2D;font-size:36px;line-height:1.3;margin-top:18px;font-weight:500;opacity:.85}}
.ph{{flex:1;background-size:cover;position:relative;overflow:hidden}}
.lab{{position:absolute;bottom:26px;font-weight:700;font-size:34px;letter-spacing:3px;padding:12px 26px;border-radius:40px;color:#fff}}
.cta{{background:#E8634A;color:#fff;text-align:center;padding:34px 40px 30px}}
.cta b{{display:block;font-weight:700;font-size:52px;letter-spacing:-.5px}}
.cta small{{display:block;font-size:28px;margin-top:8px;opacity:.95;font-weight:500}}
"""

# typo FR : pas de « : » ou « ? » orphelin, chiffre collé au mot suivant, tiret insécable
H = lambda t: re.sub(r"(\d) ", r"\1&nbsp;", t.replace(" :", "&nbsp;:").replace(" ?", "&nbsp;?").replace("-", "\u2011"))

FIT = """() => { const h=document.querySelector('h1'), t=document.querySelector('.top');
  let s=98; while(t.offsetHeight>560 && s>64){ s-=4; h.style.fontSize=s+'px'; } return s; }"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1000, "height": 1500})
    for x in PINS:
        img = os.path.join(REPO, x["photo"])
        ext = img.rsplit(".", 1)[1].replace("jpg", "jpeg")
        data = base64.b64encode(open(img, "rb").read()).decode()
        url = f"data:image/{ext};base64,{data}"
        inner = ""
        if x.get("fit") == "contain":
            inner += f'<div style="position:absolute;inset:-40px;background:url({url}) center/cover;filter:blur(30px) brightness(.85)"></div><div style="position:absolute;inset:0;background:url({url}) center/contain no-repeat"></div>'
        if x.get("labels"):
            a, c = x["labels"]
            inner += f'<div class="lab" style="left:26px;background:#1B3A2D">{a}</div><div class="lab" style="right:26px;background:#E8634A">{c}</div>'
        html = f"""<html><head><style>{CSS}</style></head><body>
<div class="top"><div class="tag">{x['eyebrow']}</div><h1>{H(x['headline'])}</h1>{'<p>'+x['sub']+'</p>' if x.get('sub') else ''}</div>
<div class="ph" style="background-image:url({url});background-position:{x.get('pos','center 30%')}">{inner}</div>
<div class="cta"><b>{x['cta']} →</b><small>ornellafitcoaching.com</small></div></body></html>"""
        pg.set_content(html)
        pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(400)
        pg.evaluate(FIT)
        pg.screenshot(path=os.path.join(OUT, x["slug"] + ".jpg"), type="jpeg", quality=88)
        print("ok", x["slug"])
    b.close()
