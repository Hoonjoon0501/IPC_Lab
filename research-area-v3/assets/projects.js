// Live project lists from the Google Sheet (Apps Script web app).
// The page ships a static copy of the lists; when IPC_PROJECTS_URL is set, both lists are
// replaced with the sheet's current rows on every page load.
(() => {
  const root = document.querySelector('[data-projects]');
  const url = window.IPC_PROJECTS_URL;
  if (!root || !url) return;
  const app = root.dataset.app || '';          // detail pages pass their application key
  const prefix = root.dataset.prefix || '';    // path back to the concept root
  const APPS = { ai: ['AI Datacenter', 'ai-datacenter'], ev: ['Electric Vehicles', 'electric-vehicles'], humanoids: ['Humanoids', 'humanoids'], rf: ['RF Systems', 'rf-systems'], wpt: ['Wireless Power Transfer', 'wireless-power-transfer'] };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const period = p => p.start && p.end ? `${p.start} – ${p.end}` : p.start ? (p.status === 'completed' ? p.start : `Since ${p.start}`) : (p.end || '');
  const logo = p => !p.logo ? `<span class="mark">${esc(p.partner_short || p.partner)}</span>`
    : `<img src="${/^(https?:|data:)/.test(p.logo) ? esc(p.logo) : prefix + 'assets/partners/' + esc(p.logo)}" alt="${esc(p.partner_short || p.partner)}" loading="lazy">`;
  const row = p => {
    let tag = '';
    if (!app) tag = APPS[p.app] ? `<a class="proj-app" href="${prefix}applications/${APPS[p.app][1]}.html">${APPS[p.app][0]}</a>` : (p.area ? `<span class="proj-app">${esc(p.area)}</span>` : '');
    const per = period(p);
    return `<li><span class="proj-logo">${logo(p)}</span><div class="proj-copy"><h3>${esc(p.title)}</h3><p>${tag}${esc(p.partner)}</p></div>${per ? `<span class="proj-period">${esc(per)}</span>` : ''}</li>`;
  };
  fetch(url + (url.includes('?') ? '&' : '?') + (app ? 'app=' + encodeURIComponent(app) : 'all=1') + '&_=' + Date.now(), { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => {
      const items = (d.projects || []).filter(p => !app || p.app === app).sort((a, b) => (+a.order || 999) - (+b.order || 999));
      const now = items.filter(p => p.status !== 'completed'), done = items.filter(p => p.status === 'completed');
      const cur = root.querySelector('.proj-list.current');
      if (cur) cur.innerHTML = now.map(row).join('') || '<li class="proj-empty">No ongoing projects.</li>';
      const det = root.querySelector('.proj-done');
      if (det) {
        det.hidden = !done.length;
        det.querySelector('.proj-count').textContent = done.length;
        det.querySelector('.proj-list').innerHTML = done.map(row).join('');
      }
      root.hidden = !now.length && !done.length && !!app;
    })
    .catch(() => {}); // keep the static copy
})();
