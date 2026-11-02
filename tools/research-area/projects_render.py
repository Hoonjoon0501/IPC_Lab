# Static project lists (the fallback copy that assets/projects.js replaces with live sheet data).
# Loaded with exec() by build-concept-v2.py and build-apps.py.
import html as _h, time as _t

_V = _t.strftime('%Y%m%d%H%M')  # cache-buster so browsers pick up script/config changes

APP_LINKS = {'ai': ('AI Datacenter', 'ai-datacenter'), 'ev': ('Electric Vehicles', 'electric-vehicles'), 'humanoids': ('Humanoids', 'humanoids'),
             'rf': ('RF Systems', 'rf-systems'), 'wpt': ('Wireless Power Transfer', 'wireless-power-transfer')}


def _period(p):
    if p['start'] and p['end']: return f"{p['start']} – {p['end']}"
    if p['start']: return p['start'] if p['status'] == 'completed' else f"Since {p['start']}"
    return p['end']


def _row(p, prefix, show_app):
    logo = (f'<img src="{prefix}assets/partners/{_h.escape(p["logo"])}" alt="{_h.escape(p["partner_short"])}" loading="lazy" decoding="async">' if p['logo']
            else f'<span class="mark">{_h.escape(p["partner_short"])}</span>')
    tag = ''
    if show_app:
        tag = (f'<a class="proj-app" href="{prefix}applications/{APP_LINKS[p["app"]][1]}.html">{APP_LINKS[p["app"]][0]}</a>' if p['app'] in APP_LINKS
               else (f'<span class="proj-app">{_h.escape(p["area"])}</span>' if p['area'] else ''))
    per = _period(p)
    per = f'<span class="proj-period">{_h.escape(per)}</span>' if per else ''
    return f'<li><span class="proj-logo">{logo}</span><div class="proj-copy"><h3>{_h.escape(p["title"])}</h3><p>{tag}{_h.escape(p["partner"])}</p></div>{per}</li>'


def projects_block(items, prefix, app=''):
    items = sorted(items, key=lambda p: p.get('order') or 999)
    now = [p for p in items if p['status'] != 'completed']; done = [p for p in items if p['status'] == 'completed']
    if not now and not done: return ''
    show_app = not app
    cur = ''.join(_row(p, prefix, show_app) for p in now) or '<li class="proj-empty">No ongoing projects.</li>'
    fin = ''.join(_row(p, prefix, show_app) for p in done)
    return (f'  <section class="projects" id="projects" aria-labelledby="projects-title" data-projects data-app="{app}" data-prefix="{prefix}">\n'
            f'    <div class="sec-head"><h2 id="projects-title">Current projects</h2></div>\n'
            f'    <ul class="proj-list current">{cur}</ul>\n'
            f'    <details class="proj-done"{"" if done else " hidden"}><summary><span>Completed projects (<span class="proj-count">{len(done)}</span>)</span></summary><ul class="proj-list">{fin}</ul></details>\n'
            f'  </section>\n'
            f'  <script src="{prefix}assets/projects-config.js?v={_V}"></script><script src="{prefix}assets/projects.js?v={_V}" defer></script>\n')
