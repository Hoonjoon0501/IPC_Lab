# Group-aware fitting for v3 renders.
import json, os, sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
def alpha_box(im, dx=0, dy=0):
    a = im.split()[3].point(lambda v: 255 if v > 12 else 0); b = a.getbbox(); return (b[0] + dx, b[1] + dy, b[2] + dx, b[3] + dy)
def union(bs): return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))
def save(im, path, size): im.resize(size, Image.LANCZOS).save(path, quality=90, method=6)

# single scenes via the same rule as fit2: fit content into 1200x660 frame
for n in ['circuit', 'pdn', 'magnetics']:
    im = Image.open(f'{src}/{n}.png').convert('RGBA'); x0, y0, x1, y1 = alpha_box(im)
    bw, bh = x1 - x0, y1 - y0; f = .64 if n == 'magnetics' else .80; k = min(2400 * f / bw, 1320 * f / bh)
    cw, ch = bw * k, bh * k; ox, oy = (2400 - cw) / 2, (1320 - ch) / 2
    c = Image.new('RGBA', (2400, 1320), (0, 0, 0, 0)); c.alpha_composite(im.crop((x0, y0, x1, y1)).resize((round(cw), round(ch)), Image.LANCZOS), (round(ox), round(oy)))
    save(c, f'{out}/{n}.webp', (1600, 880))
    ov = json.load(open(f'{src}/{n}.json'))
    for o in ov: o['pts'] = [[round(((x * 2 - x0) * k + ox) / 2, 1), round(((y * 2 - y0) * k + oy) / 2, 1)] for x, y in o['pts']]
    json.dump(ov, open(f'{out}/{n}.json', 'w'))

# twin: physical + wire model that slides by the projected offset
ph = Image.open(f'{src}/twinphys.png').convert('RGBA'); wi = Image.open(f'{src}/twinwire.png').convert('RGBA')
sl = [o for o in json.load(open(f'{src}/twinphys.json')) if o['id'] == 'slide'][0]['pts']
dx, dy = (sl[1][0] - sl[0][0]) * 2, (sl[1][1] - sl[0][1]) * 2
x0, y0, x1, y1 = union([alpha_box(ph), alpha_box(wi), alpha_box(wi, dx, dy)])
pad = 30; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
for n, im in [('twin-phys', ph), ('twin-wire', wi)]:
    save(im.crop((x0, y0, x1, y1)), f'{out}/{n}.webp', (round((x1 - x0) / 2), round((y1 - y0) / 2)))
json.dump({'w': round((x1 - x0) / 2), 'h': round((y1 - y0) / 2), 'dx_pct': round(dx / (x1 - x0) * 100, 2), 'dy_pct': round(dy / (y1 - y0) * 100, 2)}, open(f'{out}/twin.json', 'w'))

# plates: identical crop for all four
ps = [Image.open(f'{src}/plate{k}.png').convert('RGBA') for k in range(4)]
x0, y0, x1, y1 = union([alpha_box(p) for p in ps]); pad = 20; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
for k, p in enumerate(ps): save(p.crop((x0, y0, x1, y1)), f'{out}/plate{k}.webp', (round((x1 - x0) / 2), round((y1 - y0) / 2)))
json.dump({'w': round((x1 - x0) / 2), 'h': round((y1 - y0) / 2)}, open(f'{out}/plates.json', 'w'))
print(open(f'{out}/twin.json').read(), open(f'{out}/plates.json').read())
