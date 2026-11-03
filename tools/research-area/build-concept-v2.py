"""Fill concept-v2/template.html with the animated SVG pieces and write concept-v2/index.html.

usage: python -I tools/build-concept-v2.py <repo root>
The research renders come with overlay paths (assets/<name>.json, 1200x660 space) exported
from tools/render-research.html; they become animated "power flow" strokes over each image.
"""
import re
import json, os, sys

root = os.path.join(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'concept-v2')
tpl = open(os.path.join(root, 'template.html'), encoding='utf-8').read()

ALT = {
    'circuit': 'Stacked point-of-load module: a top board with rows of ceramic capacitors, copper windings and ferrite cores between two boards, and solder pins along the bottom',
    'pdn': 'Exploded power delivery path: regulator on the motherboard, plated vias, BGA solder balls, package substrate with decoupling capacitors, flip-chip bumps and the processor',
    'magnetics': 'Toroidal ferrite core wound with copper wire, with a blue magnetic-flux loop circulating in the core',
}


def d_of(pts, closed):
    s = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
    return s + (' Z' if closed else '')


def twin_art():
    sl = json.load(open(os.path.join(root, 'assets', 'twin-slide.json')))
    return (f'<div class="twin-stage" style="--dx:{sl["dx_pct"]}%;--dy:{sl["dy_pct"]}%;aspect-ratio:{sl["w"]}/{sl["h"]}">'
            f'<img class="twin-phys" src="assets/twin-phys.webp" width="{sl["w"]}" height="{sl["h"]}" loading="lazy" alt="Power-stage board with its blue wireframe digital twin sliding out beside it">'
            f'<img class="twin-wire" src="assets/twin-wire.webp" width="{sl["w"]}" height="{sl["h"]}" loading="lazy" alt="" aria-hidden="true"></div>')


LAYERS = [('Digital Twin', 'Virtual model'), ('Circuit', 'Converter stage'),
          ('Magnetics', 'Planar windings and cores'), ('PDN', 'Power planes, vias and balls')]  # front to back


def stack():
    # plate3 = twin ... plate0 = PDN. The twin sits in front (lowest, painted last); PDN is the rearmost layer.
    out = ['<figure class="stack" aria-label="Four research areas as one integrated stack: Digital Twin in front, then Circuit, Magnetics and PDN at the back">']
    for i, (name, sub) in reversed(list(enumerate(LAYERS))):
        k = 3 - i
        out.append(f'<div class="layer" style="--i:{i}"><img src="assets/plate{k}.webp" width="728" height="384" loading="lazy" decoding="async" alt="">'
                   f'<span class="layer-label"><b>{name}</b></span></div>')
    out.append('</figure>')
    return '\n      '.join(out)


def art(name):
    if name == 'twin': return twin_art()
    ov = json.load(open(os.path.join(root, 'assets', f'{name}.json')))
    paths = []
    for o in ov:
        d = d_of(o['pts'], o['closed'])
        up = o['id'].startswith('up')
        dash = 'flow loop' if o['closed'] else ('flow up' if up else 'flow')
        paths.append(f'<path class="base" d="{d}"/><path class="{dash}" pathLength="300" d="{d}"{" marker-end=\"url(#arrow-%s)\"" % name if up else ""}/>')
    marker = (f'<defs><marker id="arrow-{name}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
              f'<path d="M0 0 L10 5 L0 10 z" fill="#8cc8ff"/></marker></defs>')
    return (f'<img src="assets/{name}.webp" width="1200" height="660" loading="lazy" decoding="async" alt="{ALT[name]}">'
            f'<svg class="flow-svg" viewBox="0 0 1200 660" aria-hidden="true" focusable="false">{marker}{"".join(paths)}</svg>')


VISION = '''<figure class="vision-figure">
      <svg class="vision-svg full" viewBox="0 118 1000 284" role="img" aria-labelledby="vision-svg-title">
        <title id="vision-svg-title">Today, the converter sits on the board and power travels a long lateral path to the processor; the longer path has higher resistance, which causes I²R loss, heat and voltage droop. With IPC, the converter sits directly beneath the processor, so the vertical path is short and the loss is low, with the same power in a smaller form factor.</title>
        <defs>
          <linearGradient id="vg-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f5"/><stop offset="1" stop-color="#b9c1cc"/></linearGradient>
          <linearGradient id="vg-ipc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f95ff"/><stop offset="1" stop-color="#1f5fd0"/></linearGradient>
          <linearGradient id="vg-board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3f6b"/><stop offset="1" stop-color="#0e2647"/></linearGradient>
          <marker id="vg-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#3f95ff"/></marker>
          <marker id="vg-arrow-loss" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#e0562b"/></marker>
        </defs>
        <g id="vision-art">
        <!-- Today -->
        <text class="v-tag" x="40" y="146">TODAY</text>
        <text class="v-title" x="40" y="172">Converter on the board</text>
        <rect x="40" y="290" width="420" height="20" rx="5" fill="url(#vg-board)"/>
        <g class="v-parts">
          <rect x="60" y="238" width="40" height="52" rx="6" fill="#1a1c21"/><rect x="108" y="238" width="40" height="52" rx="6" fill="#1a1c21"/><rect x="156" y="238" width="40" height="52" rx="6" fill="#1a1c21"/>
          <rect x="66" y="232" width="28" height="6" rx="2" fill="#d9824a"/><rect x="114" y="232" width="28" height="6" rx="2" fill="#d9824a"/><rect x="162" y="232" width="28" height="6" rx="2" fill="#d9824a"/>
          <rect x="206" y="272" width="16" height="18" rx="2" fill="#c7aa82"/><rect x="226" y="272" width="16" height="18" rx="2" fill="#c7aa82"/>
        </g>
        <text class="v-label" x="128" y="216" text-anchor="middle">Converter</text>
        <rect x="320" y="272" width="120" height="18" rx="3" fill="#173a34"/>
        <rect x="340" y="246" width="80" height="26" rx="4" fill="url(#vg-lid)" stroke="#9aa5b3"/>
        <text class="v-label" x="380" y="232" text-anchor="middle">Processor</text>
        <path class="v-path loss" d="M128 300 H250 l5 -6 l10 12 l10 -12 l10 12 l10 -12 l10 12 l5 -6 H380 V276" marker-end="url(#vg-arrow-loss)"/>
        <path class="v-flow loss" pathLength="300" d="M128 300 H250 l5 -6 l10 12 l10 -12 l10 12 l10 -12 l10 12 l5 -6 H380 V276"/>
        <g class="v-heat" aria-hidden="true">
          <path d="M262 284 q-5 -5 0 -10 t0 -10"/><path d="M280 284 q-5 -5 0 -10 t0 -10"/><path d="M298 284 q-5 -5 0 -10 t0 -10"/>
        </g>
        <text class="v-loss" x="280" y="254" text-anchor="middle">I²R loss</text>
        <path class="v-bracket" d="M40 330 v10 H460 v-10"/>
        <text class="v-note v-loss-note" x="250" y="366" text-anchor="middle">Long path → higher resistance → loss and heat</text>
        <text class="v-sub" x="250" y="388" text-anchor="middle">Voltage droop · large board area</text>
        <!-- transition -->
        <g class="v-mid">
          <path d="M530 268 h78 m-14 -14 l14 14 l-14 14" fill="none" stroke="#1f6fe0" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="569" y="240" text-anchor="middle">Same power</text>
          <text x="569" y="310" text-anchor="middle">Smaller form factor</text>
        </g>
        <!-- IPC -->
        <text class="v-tag v-accent" x="650" y="146">WITH IPC</text>
        <text class="v-title" x="650" y="172">Converter under the processor</text>
        <rect x="690" y="290" width="160" height="20" rx="5" fill="url(#vg-board)"/>
        <rect x="710" y="272" width="120" height="18" rx="3" fill="#173a34"/>
        <rect x="720" y="242" width="100" height="30" rx="5" fill="url(#vg-ipc)"/>
        <text x="770" y="262" text-anchor="middle" class="v-chip">IPC</text>
        <rect x="730" y="216" width="80" height="26" rx="4" fill="url(#vg-lid)" stroke="#9aa5b3"/>
        <text class="v-label" x="770" y="202" text-anchor="middle">Processor</text>
        <g class="v-short">
          <path class="v-path" d="M744 298 V222" marker-end="url(#vg-arrow)"/><path class="v-path" d="M796 298 V222" marker-end="url(#vg-arrow)"/>
          <path class="v-flow short" pathLength="300" d="M744 298 V222"/><path class="v-flow short" pathLength="300" d="M796 298 V222"/>
        </g>
        <path class="v-bracket v-accent-stroke" d="M690 330 v10 H850 v-10"/>
        <text class="v-note v-accent" x="770" y="366" text-anchor="middle">Short vertical path → low loss</text>
        <text class="v-sub" x="770" y="388" text-anchor="middle">Compact footprint</text>
        </g>
      </svg>
      <div class="vision-mobile" aria-hidden="true">
        <svg viewBox="20 118 465 284"><use href="#vision-art"/></svg>
        <svg viewBox="642 118 358 284"><use href="#vision-art"/></svg>
      </div>
    </figure>'''

def projects():
    f = os.path.join(root, 'assets', 'partners', 'projects.json')
    if not os.path.exists(f): return ''
    exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'projects_render.py'), encoding='utf-8').read(), globals())
    return projects_block(json.load(open(f, encoding='utf-8')), '')


# Sponsors & collaborators strip at the bottom of the page: two rows of logo cards moving in
# opposite directions (CSS only; each row holds the list twice so the loop is seamless).
SPONSORS = [  # (name, logo file in assets/partners or None for a text mark, width, height)
    ('National Research Foundation of Korea', 'nrf.svg', 141, 42),
    ('Samsung', 'samsung.png', 360, 153),
    ('Hyundai Motor Group', 'hyundai.png', 360, 141),
    ('Korea Aerospace Research Institute (KARI)', 'kari.svg', 443, 112),
    ('Korea Institute of Machinery and Materials (KIMM)', 'kimm.png', 360, 87),
    ('Intel', None, 0, 0),
    ('Chang Sung Corporation (CSC)', 'changsung.png', 360, 146),
    ('Korea Electronics Technology Institute (KETI)', 'keti.png', 266, 51),
]

def sponsors():
    def card(s):
        name, f, w, h = s
        inner = (f'<img src="assets/partners/{f}" width="{w}" height="{h}" alt="{name}" loading="lazy" decoding="async">'
                 if f else f'<span class="m-word">{name}</span>')
        return f'<li class="m-card">{inner}</li>'
    def row(items, cls):
        cards = ''.join(card(s) for s in items)
        copy = re.sub(r' alt="[^"]*"', ' alt=""', cards)  # the second copy is only there for the loop
        return (f'<div class="marquee{cls}"><ul class="m-track">{cards}</ul>'
                f'<ul class="m-track" aria-hidden="true">{copy}</ul></div>')
    half = len(SPONSORS) // 2
    return ('<section class="sponsors" aria-labelledby="sponsors-title">\n'
            '    <div class="sec-head"><p class="kicker">Working together</p><h2 id="sponsors-title">Our Sponsors &amp; Collaborators</h2>'
            '<p>Our research is funded by and carried out with these companies and institutes.</p></div>\n'
            '    ' + row(SPONSORS, '') + '\n'
            '    ' + row(SPONSORS[half:] + SPONSORS[:half], ' rev') + '\n'
            '  </section>')


html = tpl.replace('{{VISION_SVG}}', VISION).replace('{{SPONSORS}}', sponsors()).replace('{{STACK}}', stack()).replace('{{PROJECTS}}', projects())
for n in ['circuit', 'pdn', 'magnetics', 'twin']:
    html = html.replace('{{ART_%s}}' % n, art(n))
assert '{{' not in html
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8', newline='\n').write(html)
print('ok')
