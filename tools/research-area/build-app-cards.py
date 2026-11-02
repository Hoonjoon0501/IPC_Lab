"""Write the five application card diagrams (concept-v3/assets/apps/<key>-card.svg).

usage: python -I tools/build-app-cards.py <repo root> [concept-v3]
Flat system diagrams in the same palette as the vision figure: each shows where the lab's
power conversion sits in the application. Drawn in a 480x360 frame with the content kept
inside x 60..420 so a square crop (application grid) loses nothing.
"""
import os, sys

root = os.path.join(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'concept-v3')
out = os.path.join(root, 'assets', 'apps')

NAVY, NAVY2, INK, BODY = '#0e2647', '#1d3f6b', '#0b1a30', '#46546a'
BLUE, GLOW, COPPER, CREAM, CHIP, LID = '#1f6fe0', '#3f95ff', '#d9824a', '#c7aa82', '#1a1c21', '#d5dbe3'
SHELL, SHELL_EDGE = '#e3e8ef', '#c3ccd8'


def svg(body, title):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-label="{title}">
<title>{title}</title>
<style>
  text {{ font-family: Inter, Arial, Helvetica, sans-serif; font-size: 19px; font-weight: 600; fill: {BODY}; }}
  .acc {{ fill: {BLUE}; }}
  .chip {{ fill: #fff; font-weight: 800; letter-spacing: .5px; font-size: 11px; }}
  .flow {{ fill: none; stroke: {GLOW}; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }}
  .thin {{ fill: none; stroke: {GLOW}; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }}
</style>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5f8fc"/><stop offset="1" stop-color="#e9eff7"/></linearGradient>
  <marker id="ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="{GLOW}"/></marker>
</defs>
<rect width="480" height="360" fill="url(#bg)"/>
{body}
</svg>
'''


def ai():
    slots = ''.join(f'<rect x="88" y="{88 + i * 22}" width="74" height="14" rx="2" fill="{NAVY2}"/><circle cx="152" cy="{95 + i * 22}" r="2.2" fill="{GLOW}"/>' for i in range(9))
    body = f'''
<rect x="78" y="74" width="94" height="222" rx="7" fill="{NAVY}"/>{slots}
<text x="125" y="326" text-anchor="middle">Server rack</text>
<path class="flow" d="M172 186 H230 V254" marker-end="url(#ar)"/>
<rect x="210" y="262" width="200" height="14" rx="4" fill="{NAVY2}"/>
<rect x="266" y="236" width="88" height="26" rx="4" fill="{BLUE}"/>
<rect x="262" y="226" width="96" height="10" rx="2" fill="#173a34"/>
<rect x="278" y="198" width="64" height="28" rx="4" fill="{LID}" stroke="#9aa5b3"/>
<path class="thin" d="M292 258 V206" marker-end="url(#ar)"/><path class="thin" d="M328 258 V206" marker-end="url(#ar)"/>
<text x="310" y="184" text-anchor="middle">Processor</text>
<text class="acc" x="314" y="304" text-anchor="middle">Converter right</text>
<text class="acc" x="314" y="328" text-anchor="middle">under the processor</text>'''
    return svg(body, 'Power flows from the server rack to a converter mounted directly beneath the processor')


def ev():
    body = f'''
<path d="M66 252 V214 Q70 198 96 194 L150 188 Q184 146 236 144 L300 146 Q332 148 364 182 L398 192 Q414 198 414 220 V252 Z" fill="{SHELL}" stroke="{SHELL_EDGE}" stroke-width="2"/>
<path d="M170 186 Q196 160 236 158 L296 160 Q318 162 340 184 Z" fill="#c9d4e2"/>
<rect x="150" y="232" width="178" height="16" rx="3" fill="{NAVY}"/>
{''.join(f'<rect x="{154 + i * 22}" y="235" width="18" height="10" rx="1.5" fill="{NAVY2}"/>' for i in range(8))}
<rect x="92" y="220" width="42" height="26" rx="4" fill="{BLUE}"/>
<rect x="344" y="222" width="34" height="24" rx="4" fill="{CHIP}"/>
<circle cx="138" cy="262" r="26" fill="{CHIP}"/><circle cx="138" cy="262" r="11" fill="#c9ced6"/>
<circle cx="350" cy="262" r="26" fill="{CHIP}"/><circle cx="350" cy="262" r="11" fill="#c9ced6"/>
<rect x="60" y="208" width="10" height="16" rx="2" fill="{CHIP}"/>
<path class="flow" d="M64 216 H88" marker-end="url(#ar)"/>
<path class="thin" d="M134 233 H146" marker-end="url(#ar)"/>
<path class="thin" d="M328 240 H340" marker-end="url(#ar)"/>
<text class="acc" x="64" y="118">On-board charger</text>
<path d="M113 126 V214" stroke="{BLUE}" stroke-width="1.2" stroke-dasharray="3 3"/>
<text x="240" y="324" text-anchor="middle">Battery</text><path d="M240 304 V252" stroke="#9aa5b3" stroke-width="1.2" stroke-dasharray="3 3"/>
<text x="361" y="118" text-anchor="middle">Motor</text><path d="M361 126 V218" stroke="#9aa5b3" stroke-width="1.2" stroke-dasharray="3 3"/>'''
    return svg(body, 'Electric vehicle: charge port, on-board charger, battery and motor drive along the power path')


def humanoid():
    def limb(x1, y1, x2, y2, w):
        return f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{SHELL_EDGE}" stroke-width="{w + 3}" stroke-linecap="round"/><path d="M{x1} {y1} L{x2} {y2}" stroke="{SHELL}" stroke-width="{w}" stroke-linecap="round"/>'
    J = {'ls': (204, 112), 'rs': (276, 112), 'le': (190, 172), 're': (290, 172), 'lw': (184, 228), 'rw': (296, 228),
         'lh': (226, 212), 'rh': (254, 212), 'lk': (222, 270), 'rk': (258, 270), 'la': (220, 326), 'ra': (260, 326)}
    limbs = ''.join(limb(*J[a], *J[b], 18) for a, b in [('ls', 'le'), ('le', 'lw'), ('rs', 're'), ('re', 'rw'), ('lh', 'lk'), ('lk', 'la'), ('rh', 'rk'), ('rk', 'ra')])
    B = (240, 146)
    vessels = ''.join(f'<path class="thin" d="M{B[0]} {B[1]} L{J[k][0]} {J[k][1]}" opacity=".85"/>' for k in ['ls', 'rs', 'lh', 'rh'])
    vessels += ''.join(f'<path class="thin" d="M{J[a][0]} {J[a][1]} L{J[b][0]} {J[b][1]}" opacity=".85"/>' for a, b in [('ls', 'le'), ('le', 'lw'), ('rs', 're'), ('re', 'rw'), ('lh', 'lk'), ('lk', 'la'), ('rh', 'rk'), ('rk', 'ra')])
    joints = ''.join(f'<circle cx="{x}" cy="{y}" r="7" fill="{CHIP}"/>' for k, (x, y) in J.items() if k not in ('lw', 'rw', 'la', 'ra'))
    body = f'''
<circle cx="240" cy="66" r="22" fill="{SHELL}" stroke="{SHELL_EDGE}" stroke-width="2"/>
<rect x="226" y="62" width="28" height="9" rx="4" fill="{CHIP}"/>
{limbs}
<rect x="202" y="96" width="76" height="98" rx="16" fill="{SHELL}" stroke="{SHELL_EDGE}" stroke-width="2"/>
<rect x="212" y="194" width="56" height="26" rx="9" fill="{SHELL}" stroke="{SHELL_EDGE}" stroke-width="2"/>
{vessels}
<rect x="226" y="126" width="28" height="40" rx="5" fill="{BLUE}"/>
<rect x="234" y="120" width="12" height="7" rx="2" fill="{BLUE}"/><path d="M233 140 H247 M233 150 H247" stroke="#fff" stroke-width="2" opacity=".7"/>
{joints}
<circle cx="290" cy="172" r="13" fill="none" stroke="{BLUE}" stroke-width="2.5"/>
<path d="M303 172 H318" stroke="{BLUE}" stroke-width="1.2" stroke-dasharray="3 3"/>
<text class="acc" x="322" y="178">Actuator</text>
<path d="M226 146 H184" stroke="#9aa5b3" stroke-width="1.2" stroke-dasharray="3 3"/>
<text x="180" y="152" text-anchor="end">Battery</text>'''
    return svg(body, 'Humanoid robot: power from one battery in the torso is distributed to the joint actuators and their drivers')


def rf():
    wave = 'M' + ' L'.join(f'{160 + i:.0f} {190 - 8 * __import__("math").sin(i / 35 * 2 * 3.14159 * 2):.1f}' for i in range(0, 36, 1))
    wave2 = 'M' + ' L'.join(f'{285 + i:.0f} {190 - 8 * __import__("math").sin(i / 35 * 2 * 3.14159 * 2):.1f}' for i in range(0, 36, 1))
    body = f'''
<rect x="66" y="146" width="94" height="88" rx="8" fill="{NAVY}"/>
<path d="M96 168 L96 212 L134 190 Z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
<path d="M82 190 H96 M134 190 H148" stroke="#fff" stroke-width="2.5"/>
<path d="{wave}" class="flow"/>
<rect x="195" y="146" width="90" height="88" rx="8" fill="#fff" stroke="{NAVY2}" stroke-width="2"/>
<path d="M207 176 h10 c0 -10 10 -10 10 0 c0 -10 10 -10 10 0 c0 -10 10 -10 10 0 h26" fill="none" stroke="{COPPER}" stroke-width="3" stroke-linecap="round"/>
<path d="M240 176 V196 M228 196 H252 M228 204 H252 M240 204 V218" fill="none" stroke="{NAVY2}" stroke-width="2.5" stroke-linecap="round"/>
<path d="M226 214 L254 186" stroke="{BLUE}" stroke-width="2" marker-end="url(#ar)"/>
<path d="{wave2}" class="flow"/>
<ellipse cx="366" cy="150" rx="46" ry="12" fill="#c9ced6"/>
<rect x="320" y="150" width="92" height="84" fill="#dfe3e8"/>
<ellipse cx="366" cy="234" rx="46" ry="12" fill="#c9ced6"/>
<ellipse cx="366" cy="192" rx="28" ry="18" fill="{GLOW}" opacity=".35"/>
<ellipse cx="366" cy="192" rx="16" ry="9" fill="{GLOW}" opacity=".7"/>
<ellipse cx="366" cy="150" rx="46" ry="12" fill="none" stroke="#9aa5b3" stroke-width="1.5"/>
<text class="acc" x="113" y="268" text-anchor="middle">RF</text><text class="acc" x="113" y="292" text-anchor="middle">amplifier</text>
<text class="acc" x="240" y="268" text-anchor="middle">Matching</text><text class="acc" x="240" y="292" text-anchor="middle">network</text>
<text x="366" y="274" text-anchor="middle">Plasma</text><text x="366" y="298" text-anchor="middle">load</text>'''
    return svg(body, 'RF system: RF amplifier, impedance matching network and plasma load in a chain')


def wpt():
    coils = ''.join(f'<ellipse cx="170" cy="258" rx="{r}" ry="{r * 0.32:.1f}" fill="none" stroke="{COPPER}" stroke-width="3"/>' for r in (74, 60, 46, 32))
    arcs = ''.join(f'<path d="M{170 + dx} 250 Q{260 + dx * 0.4} {120 - k * 20} {330 + dx * 0.15} 182" fill="none" stroke="{GLOW}" stroke-width="2" opacity="{0.75 - k * 0.15:.2f}" stroke-dasharray="5 6"/>' for k, dx in enumerate((-10, 10, 30)))
    body = f'''
<ellipse cx="170" cy="262" rx="96" ry="34" fill="{NAVY}"/>
<ellipse cx="170" cy="256" rx="96" ry="34" fill="{NAVY2}"/>
{coils}
{arcs}
<rect x="300" y="132" width="66" height="44" rx="8" fill="#dfe3e8" stroke="#b8c2cf" stroke-width="2"/>
<ellipse cx="333" cy="180" rx="30" ry="8" fill="{NAVY}"/>
<ellipse cx="333" cy="180" rx="22" ry="5.5" fill="none" stroke="{COPPER}" stroke-width="2.5"/>
<ellipse cx="333" cy="180" rx="13" ry="3.2" fill="none" stroke="{COPPER}" stroke-width="2.5"/>
<circle cx="352" cy="150" r="4.5" fill="{GLOW}"/>
<path d="M300 154 H284" stroke="#9aa5b3" stroke-width="1.2" stroke-dasharray="3 3"/>
<text x="333" y="118" text-anchor="middle">Sensor node</text>
<text class="acc" x="170" y="330" text-anchor="middle">Transmitter coil</text>
<path d="M404 188 V250" stroke="#9aa5b3" stroke-width="1.5" marker-start="url(#ga)" marker-end="url(#ga)"/>
<defs><marker id="ga" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#9aa5b3"/></marker></defs>
<text x="396" y="224" text-anchor="end">Air gap</text>'''
    return svg(body, 'Wireless power transfer: a transmitter coil sends power across an air gap to a sensor node with a receiver coil')


for key, f in [('ai', ai), ('ev', ev), ('humanoids', humanoid), ('rf', rf), ('wpt', wpt)]:
    open(os.path.join(out, f'{key}-card.svg'), 'w', encoding='utf-8', newline='\n').write(f())
print('ok')
