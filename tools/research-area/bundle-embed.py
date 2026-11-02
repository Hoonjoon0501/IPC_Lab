"""Bundle concept-v3 pages into self-contained HTML files for a Google Sites "Embed code" block.

usage: python -I tools/bundle-embed.py <repo root> <out dir> [links.json]
CSS and JS are inlined and every local image becomes a data URI. links.json maps page names
(index, ai-datacenter, ...) to the Google Sites page URLs; links between pages then open the
site page in the top window. Without it, those links keep their relative paths.
"""
import base64, io, json, mimetypes, os, re, sys

root, out = os.path.join(sys.argv[1], 'concept-v3'), sys.argv[2]
links = json.load(open(sys.argv[3], encoding='utf-8')) if len(sys.argv) > 3 else {}
os.makedirs(out, exist_ok=True)
mimetypes.add_type('image/webp', '.webp'); mimetypes.add_type('image/svg+xml', '.svg')
PAGES = {'index': 'index.html', **{n: f'applications/{n}.html' for n in
         ['ai-datacenter', 'electric-vehicles', 'humanoids', 'rf-systems', 'wireless-power-transfer']}}


def data_uri(path):
    mt = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    raw = open(path, 'rb').read()
    if mt in ('image/png', 'image/webp') and len(raw) > 30000:  # keep the paste small: recompress large rasters
        from PIL import Image
        im = Image.open(io.BytesIO(raw)); im.thumbnail((900, 900))
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=82, method=6); raw, mt = buf.getvalue(), 'image/webp'
    return f'data:{mt};base64,' + base64.b64encode(raw).decode()


for name, rel in PAGES.items():
    f = os.path.join(root, rel); base = os.path.dirname(f)
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: '<style>' + open(os.path.join(base, m.group(1)), encoding='utf-8').read() + '</style>', s)
    s = re.sub(r'<script src="([^"]+)" defer></script>', lambda m: '<script>document.addEventListener("DOMContentLoaded",function(){' + open(os.path.join(base, m.group(1)), encoding='utf-8').read() + '});</script>', s)
    s = re.sub(r'src="(?!https?:|data:)([^"]+)"', lambda m: f'src="{data_uri(os.path.normpath(os.path.join(base, m.group(1))))}"', s)

    def href(m):
        u = m.group(1)
        if u.startswith(('http', '#', 'mailto:')): return m.group(0)
        path, _, frag = u.partition('#')
        key = os.path.splitext(os.path.basename(path))[0]
        if key in links:
            return f'href="{links[key]}{"#" + frag if frag else ""}" target="_top"'
        return m.group(0)
    s = re.sub(r'href="([^"]+)"', href, s)
    s = s.replace('<header class="site-head">', '<header class="site-head" hidden>')  # the Google Site has its own header
    open(os.path.join(out, f'{name}.html'), 'w', encoding='utf-8', newline='\n').write(s)
    print(f'{name}.html {os.path.getsize(os.path.join(out, name + ".html")) / 1024:.0f} KB')
