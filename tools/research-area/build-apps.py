"""Generate concept-v2/applications/*.html from the content below.

usage: python -I tools/build-apps.py <repo root>
Topic images come from concept-v2/assets (research renders) and concept-v2/assets/apps
(application renders + hero photos); each has an overlay JSON for the animated flow.
"""
import html, json, os, sys

root = os.path.join(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'concept-v2')
out_dir = os.path.join(root, 'applications'); os.makedirs(out_dir, exist_ok=True)
PROJECTS = json.load(open(os.path.join(root, 'assets', 'partners', 'projects.json'), encoding='utf-8'))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'projects_render.py'), encoding='utf-8').read())
CRED = json.load(open(os.path.join(root, 'assets', 'apps', 'hero-credits.json'), encoding='utf-8'))

APPS = [
  {'slug': 'ai-datacenter', 'key': 'ai', 'name': 'AI Datacenter',
   'tag': 'Power delivery for AI processors',
   'intro': ['An AI processor draws very large currents at a low core voltage, and the demand keeps rising with every generation.',
             'Every conversion step between the grid and the chip costs efficiency, space and cooling, which makes power delivery a key constraint in AI hardware.'],
   'alt': 'Rows of server racks with blue status lights in a data center aisle',
   'topics': [
     ('High-ratio conversion to the processor', 'circuit', '../assets/circuit',
      'Stepping the distribution voltage down to the processor core voltage in one stage loses efficiency, and distribution voltages keep changing.',
      'Compact, stackable point-of-load modules built on hybrid switched-capacitor converters that share the work between capacitors and small inductors.'),
     ('Power delivery under the processor', 'pdn', '../assets/pdn',
      'Long current paths across the board waste power and let the voltage sag.',
      'Deliver current vertically through the package, from directly beneath the chip.'),
     ('High-voltage DC distribution', 'magnetics', '../assets/magnetics',
      'Low-voltage distribution needs heavy copper and many conversion stages.',
      'Higher-voltage DC distribution with converters that pair switched-capacitor and transformer stages.'),
   ]},
  {'slug': 'electric-vehicles', 'key': 'ev', 'name': 'Electric Vehicles',
   'tag': 'Charging and vehicle power conversion',
   'intro': ['All the energy an electric vehicle uses passes through power converters — from the grid into the battery, and from the battery to the motor.',
             'Smaller, more efficient converters mean faster charging, longer range and lower cost.'],
   'alt': 'White electric car charging at a station at dusk',
   'topics': [
     ('Universal on-board charging', 'obc', '../assets/apps/obc',
      'Grids differ — single-phase, split-phase, three-phase — and one charger rarely suits them all.',
      'A modular charger that reconfigures for each grid, using single-stage and matrix-type conversion to cut parts and volume.'),
     ('Vehicle-to-vehicle charging', 'v2v', '../assets/apps/v2v',
      'Chargers are not always nearby when a battery runs low.',
      'Let one electric vehicle charge another, using power hardware the vehicles already carry.'),
   ]},
  {'slug': 'humanoids', 'key': 'humanoids', 'name': 'Humanoids',
   'tag': 'Actuators and power inside the robot',
   'intro': ['A humanoid robot drives dozens of joints from one battery, with sharp power peaks at every step.',
             'Its power electronics largely determine how long it runs, how much it lifts and how compact its limbs can be.'],
   'alt': 'White humanoid robot standing in a laboratory',
   'topics': [
     ('Power management inside the robot', 'robot', '../assets/apps/robot',
      'One battery must feed every joint, sensor and computer through fast-changing loads.',
      'A robot-wide power network that distributes, buffers and recovers energy — like a circulatory system.'),
     ('Hybrid actuators and drivers', 'actuator', '../assets/apps/actuator',
      'Joint motors that hold heavy loads for long periods, as in an arm holding a weight, become large and hot.',
      'Pair the joint motor with a shape-memory alloy spring mounted on the arm like a muscle: the motor moves, the alloy holds — with drivers for both.'),
   ]},
  {'slug': 'rf-systems', 'key': 'rf', 'name': 'RF Systems',
   'tag': 'RF power generation and matching',
   'intro': ['Kilowatt-level radio-frequency (RF) power systems enable a wide range of applications, from plasma processing in semiconductor manufacturing to industrial dielectric heating.',
             'These applications require efficient RF power generation and precise impedance matching to ensure stable power delivery, even under rapidly changing load conditions.'],
   'alt': 'RF power amplifier module on a lab bench',
   'topics': [
     ('High-Power RF Amplifiers', 'photo:rfpa', '../assets/apps/rf-pa-photo',
      'In high-power RF systems, switching losses, parasitic effects, and thermal stress are key design challenges.',
      'Resonant switch-mode amplifiers with low-parasitic circuit layouts and effective thermal management.'),
     ('Impedance matching system', 'photo:matching', '../assets/apps/rf-evc-photo',
      'Changes in load impedance can cause impedance mismatches and reflected power, potentially damaging the RF system.',
      'Matching networks that track the load quickly and accurately.'),
     ('RF magnetics', 'photo:rfmag', '../assets/apps/rf-magnetics-photo',
      'Air-core inductors are bulky and leak magnetic field.',
      'Magnetic-core components designed for high-frequency, high-power operation.'),
   ]},
  {'slug': 'wireless-power-transfer', 'key': 'wpt', 'name': 'Wireless Power Transfer',
   'tag': 'Contactless power for sensors',
   'intro': ['Cables and batteries are the weak points of moving machines, sealed equipment and factory-wide sensor networks.',
             'Wireless power sends energy across an air gap; power electronics decides how far and how reliably it gets there.'],
   'alt': 'Two coils transferring power wirelessly across an air gap',
   'topics': [
     ('Power across large gaps', 'wpt', '../assets/apps/wpt',
      'With weak coupling between coils, efficiency collapses.',
      'Coils and resonant circuits designed for weak coupling, powering sensor nodes from a distance.'),
     ('Robust resonant operation', 'chart:resonance', '',
      'Misalignment and load changes shift the resonance away from the operating frequency, and the transferred power drops.',
      'Compensation and control that bring the resonance back to the operating frequency, keeping transfer stable across these variations.'),
   ]},
]


def flow_svg(prefix, name, slice_=False):
    ov = json.load(open(os.path.join(root, 'applications', prefix + '.json'), encoding='utf-8'))
    parts = []
    for o in ov:
        if o['id'] == 'slide': continue
        d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in o['pts']) + (' Z' if o['closed'] else '')
        cls = 'flow loop' if o['closed'] else ('flow up' if o['id'].startswith('up') else 'flow')
        parts.append(f'<path class="base" d="{d}"/><path class="{cls}" pathLength="300" d="{d}"/>')
    par = ' preserveAspectRatio="xMidYMid slice"' if slice_ else ''
    return f'<svg class="flow-svg" viewBox="0 0 1200 660"{par} aria-hidden="true" focusable="false">{"".join(parts)}</svg>'


def resonance_chart():
    """Transferred power vs frequency: tuned (peak at the operating frequency) and detuned (shifted and lower)."""
    x0, x1, yb, yt = 200, 1060, 520, 150
    q, frd, pkd = 6.0, 1.18, 0.8
    def p(f, fr, peak):
        r = f / fr
        return peak / (1 + (q * (r - 1 / r)) ** 2)
    X = lambda f: x0 + (x1 - x0) * (f - 0.55) / 0.9
    Y = lambda v: yb - (yb - yt) * v
    def curve(fr, peak):
        return 'M' + ' L'.join(f'{X(f):.1f} {Y(p(f, fr, peak)):.1f}' for f in [0.55 + 0.9 * i / 200 for i in range(201)])
    fx, yT, yD = X(1.0), Y(p(1.0, 1.0, 1.0)), Y(p(1.0, frd, pkd))
    lx, ly = 850, 112
    return (f'<svg class="chart-svg" viewBox="0 0 1200 660" role="img" aria-label="Transferred power versus frequency. '
            'When tuned, the resonance peak sits at the operating frequency and power is highest. Misalignment or a load change shifts the resonance, '
            'so power at the operating frequency drops; compensation and control bring it back.">'
            '<defs><marker id="c-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#1f6fe0"/></marker></defs>'
            f'<path class="c-axis" d="M{x0} {yt - 40} V{yb} H{x1 + 30}"/>'
            f'<text class="c-ax" x="{x0}" y="{yt - 58}">Transferred power</text>'
            f'<text class="c-ax" x="{x1 + 30}" y="{yb + 44}" text-anchor="end">Frequency</text>'
            f'<path class="c-op" d="M{fx:.1f} {yt - 40} V{yb}"/>'
            f'<text class="c-ax c-opl" x="{fx:.1f}" y="{yb + 44}" text-anchor="middle">Operating frequency</text>'
            f'<path class="c-det" d="{curve(frd, pkd)}"/>'
            f'<path class="c-tun" d="{curve(1.0, 1.0)}"/>'
            f'<path class="c-fix" d="M{fx:.1f} {yD - 16:.1f} V{yT + 18:.1f}" marker-end="url(#c-arrow)"/>'
            f'<circle class="c-dot-t" cx="{fx:.1f}" cy="{yT:.1f}" r="9"/><circle class="c-dot-d" cx="{fx:.1f}" cy="{yD:.1f}" r="9"/>'
            f'<g class="c-legend"><path class="c-tun" d="M{lx} {ly} h44"/><text x="{lx + 58}" y="{ly + 9}">Tuned</text>'
            f'<path class="c-det" d="M{lx} {ly + 42} h44"/><text x="{lx + 58}" y="{ly + 51}">Detuned</text>'
            f'<path class="c-fix" d="M{lx + 22} {ly + 100} v-22" marker-end="url(#c-arrow)"/><text x="{lx + 58}" y="{ly + 93}">Re-tuned by control</text></g>'
            '</svg>')


def credit(key):
    c = CRED[key]
    if c.get('own'): return f'Header photo: {html.escape(c["text"])}.'
    lic = f'<a href="{html.escape(c["license_url"])}" rel="license noopener" target="_blank">{html.escape(c["license"])}</a>' if c['license_url'] else html.escape(c['license'])
    return f'Header photo: <a href="{html.escape(c["page"])}" rel="noopener" target="_blank">{html.escape(c["title"].rsplit(".", 1)[0])}</a> by {html.escape(c["artist"])}, {lic}, via Wikimedia Commons (cropped).'


def page(i, a):
    topics = []
    for k, (title, name, src, problem, approach) in enumerate(a['topics']):
        dark = ' dark' if name == 'robot' else ''
        art = (f'<div class="art chart">{resonance_chart()}</div>' if name == 'chart:resonance' else
               f'<div class="art photo"><img src="{src}.webp?v=2" loading="lazy" decoding="async" alt="{title}"></div>' if name.startswith('photo:') else
               f'<div class="art{dark}"><img src="{src}.webp" width="1200" height="660" loading="lazy" decoding="async" alt="">{flow_svg(src, name)}</div>')
        topics.append(f'''    <article class="topic{" flip" if k % 2 else ""}">
      {art}
      <div class="topic-copy">
        <span class="num">0{k + 1}</span>
        <h3>{title}</h3>
        <p class="label">Challenge</p><p>{problem}</p>
        <p class="label">Approach</p><p>{approach}</p>
      </div>
    </article>''')
    nav = '\n'.join(
        f'      <a href="{b["slug"]}.html"{" aria-current=\"page\"" if b is a else ""}><img src="../assets/apps/{b["key"]}-card.webp" width="640" height="400" alt="" loading="lazy" decoding="async"><span>{b["name"]}</span></a>'
        for b in APPS)
    intro = ''.join(f'<p>{p}</p>' for p in a['intro'])
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{a["tag"]}. KAIST Integrated Power Circuit Lab.">
  <title>{a["name"]} | KAIST Integrated Power Circuit Lab</title>
  <link rel="preconnect" href="https://script.google.com">
  <link rel="preconnect" href="https://script.googleusercontent.com" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"></noscript>
  <script>if (window.self !== window.top) document.documentElement.classList.add('embedded');</script>
  <link rel="preload" as="image" href="../assets/apps/{a["key"]}-photo.webp">
  <link rel="stylesheet" href="../concept-v2.css">
  <link rel="stylesheet" href="applications.css">
  <script src="../concept-v2.js" defer></script>
</head>
<body>
<main>
  <section class="app-hero" aria-labelledby="app-title">
    <div class="app-hero-copy">
      <a class="crumb" href="../index.html#applications">← All applications</a>
      <p class="kicker">Application {i + 1:02d}</p>
      <h1 id="app-title">{a["name"]}</h1>
      <p class="app-tag">{a["tag"]}</p>
      <div class="app-intro">{intro}</div>
    </div>
    <figure class="app-hero-img"><img src="../assets/apps/{a["key"]}-photo.webp" width="1280" height="800" fetchpriority="high" alt="{a["alt"]}"></figure>
  </section>

  <section class="topics" aria-labelledby="topics-title">
    <div class="sec-head">
      <h2 id="topics-title">Research topics</h2>
    </div>
{chr(10).join(topics)}
  </section>
{projects_block([p for p in PROJECTS if p['app'] == a['key']], '../', a['key'])}
  <nav class="app-next" aria-label="Applications">
    <p class="kicker">Explore other applications</p>
    <div class="app-next-row">
{nav}
    </div>
  </nav>
</main>
<footer class="site-foot embed-foot"><p class="credit">{credit(a["key"])}</p></footer>
<script>
  // Open each application page at its top. Inside the Google Site the page sits in an iframe and the
  // site keeps its own scroll position, so also bring the top of this page into view in the parent.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  if (window.self !== window.top) {{
    const top = document.querySelector('.app-hero');
    if (top) top.scrollIntoView({{ block: 'start' }});
  }}
</script>
</body>
</html>
'''


for i, a in enumerate(APPS):
    open(os.path.join(out_dir, a['slug'] + '.html'), 'w', encoding='utf-8', newline='\n').write(page(i, a))
print('ok', len(APPS))
