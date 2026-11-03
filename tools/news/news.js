(() => {
  'use strict';
  // News feed: the Apps Script web app (same sheet "IPC Lab 뉴스 관리", tab 뉴스관리) with ?type=news.
  const FEED = 'https://script.google.com/macros/s/AKfycbwNoBz6CV-hy7kZjFKRyhjerlrpG4nm5H89jLuc-ZBmju-F5C6c2HOVDi-XXwvABpcv/exec?type=news';
  const KEY = 'ipc-news:v1';
  const root = document.getElementById('ipc-news');
  const el = id => root.querySelector('#' + id);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const media = window.matchMedia('(max-width: 650px)');
  const pageSize = () => media.matches ? 2 : 4;
  const fullDate = n => months[Number(n.date.slice(5))-1] + ' ' + n.date.slice(0,4);

  let NEWS = [], sorted = [], years = [], featured = [];
  let year, page = 1, selectedId = null, featureOpener = null, touched = false, shown = '';
  const currentItems = () => sorted.filter(n => n.date.startsWith(year));

  function appendImage(container, item, className) {
    if (!item.image || typeof item.image.src !== 'string' || !['image/png','image/jpeg','image/gif','image/webp'].some(type => item.image.src.startsWith('data:' + type + ';base64,'))) return;
    const image = document.createElement('img');
    image.className = className;
    image.alt = item.image.alt || item.title;
    image.decoding = 'async';
    image.addEventListener('error', () => image.remove(), {once: true});
    image.src = item.image.src;
    container.appendChild(image);
  }

  function renderYears() {
    el('ipc-years').innerHTML = years.map(y => `<button type="button" class="ipc-year" data-year="${y}" aria-pressed="${y===year}" aria-controls="ipc-results">${y}<span>${sorted.filter(n=>n.date.startsWith(y)).length}</span></button>`).join('');
  }
  function renderRows(announce = true) {
    selectedId = null;
    const items = currentItems(), size = pageSize(), totalPages = Math.max(1, Math.ceil(items.length/size));
    page = Math.min(Math.max(page, 1), totalPages);
    const start = (page-1)*size;
    el('ipc-year-summary').textContent = `${year} / ${items.length} updates · Select a story to read more`;
    el('ipc-results').hidden = false;
    el('ipc-detail').hidden = true;
    el('ipc-pagination').hidden = false;
    el('ipc-results').innerHTML = items.slice(start,start+size).map(n => `<button type="button" class="ipc-row" data-story="${esc(n.id)}" aria-controls="ipc-detail" aria-label="Read update: ${esc(n.title)}"><time class="ipc-date" datetime="${esc(n.date)}">${months[Number(n.date.slice(5))-1].slice(0,3).toUpperCase()}<small>${n.date.slice(0,4)}</small></time><span class="ipc-category">${esc(n.category)}</span><span class="ipc-row-title">${esc(n.title)}</span><span class="ipc-arrow" aria-hidden="true">→</span></button>`).join('');
    el('ipc-range').textContent = `${start+1}–${Math.min(start+size,items.length)} of ${items.length} updates`;
    // Show a compact five-page window instead of squeezing 15 numbers onto mobile.
    let first = Math.max(1, page-2), last = Math.min(totalPages, first+4);
    first = Math.max(1,last-4);
    const numbers = Array.from({length:last-first+1},(_,i)=>i+first);
    el('ipc-page-buttons').innerHTML = `<button type="button" class="ipc-page" data-page="${page-1}" aria-label="Previous page" ${page===1?'disabled':''}>←</button>` + numbers.map(p=>`<button type="button" class="ipc-page" data-page="${p}" aria-label="Page ${p} of ${totalPages}" ${p===page?'aria-current="page"':''}>${p}</button>`).join('') + `<button type="button" class="ipc-page" data-page="${page+1}" aria-label="Next page" ${page===totalPages?'disabled':''}>→</button>`;
    if (announce) el('ipc-status').textContent = `${year}: page ${page} of ${totalPages}. ${el('ipc-range').textContent}.`;
  }
  function showStory(id) {
    const item = NEWS.find(n=>n.id===id);
    if (!item) return;
    selectedId = id;
    el('ipc-detail-meta').textContent = fullDate(item) + ' / ' + item.category;
    el('ipc-detail-title').textContent = item.title;
    el('ipc-detail-text').textContent = item.text;
    el('ipc-detail-media').replaceChildren();
    appendImage(el('ipc-detail-media'), item, 'ipc-detail-image');
    el('ipc-results').hidden = true;
    el('ipc-pagination').hidden = true;
    el('ipc-detail').hidden = false;
    el('ipc-detail-title').focus({preventScroll:true});
    el('ipc-status').textContent = 'Full update opened. Use Back to updates to return.';
  }

  // Draw the whole widget from a payload {news:[...]}. Returns false when there is nothing to show.
  function render(payload) {
    const list = payload && Array.isArray(payload.news) ? payload.news.filter(n => n && /^\d{4}-\d{2}/.test(n.date || '')) : [];
    if (!list.length) return false;
    const sig = JSON.stringify(list);
    if (sig === shown) return true;
    shown = sig;
    NEWS = list;
    sorted = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
    years = [...new Set(sorted.map(n => n.date.slice(0,4)))];
    year = years[0]; page = 1;
    featured = sorted.filter(n => n.feature).slice(0,3);
    ['ipc-years','ipc-pagination'].forEach(id => { el(id).hidden = false; });
    el('ipc-archive-title').textContent = 'Explore the archive';
    el('ipc-results').removeAttribute('role');
    el('ipc-featured').hidden = featured.length === 0;
    el('ipc-featured').innerHTML = featured.map(n => {
      const f = n.feature;
      return `<article class="ipc-card"><div class="ipc-card-meta"><span class="ipc-latest">HIGHLIGHT</span><time datetime="${esc(n.date)}">${esc(fullDate(n).toUpperCase())}</time></div><p class="ipc-topic">${esc(f.topic)}</p><h3>${esc(f.headline)}</h3><p class="ipc-summary">${esc(f.summary)}</p><div class="ipc-card-footer" ${!f.event && !f.eventDetails ? 'hidden' : ''}><p class="ipc-event">${esc(f.event)}</p><p class="ipc-event-detail">${esc(f.eventDetails)}</p></div><button type="button" class="ipc-feature-open" data-feature="${esc(n.id)}" aria-label="Read update: ${esc(n.title)}">Read update <span aria-hidden="true">→</span></button></article>`;
    }).join('');
    el('ipc-featured').querySelectorAll('.ipc-card').forEach((card, index) => {
      const box = document.createElement('div');
      appendImage(box, featured[index], 'ipc-card-image');
      if (box.firstChild) card.querySelector('.ipc-topic').before(box);
    });
    renderYears(); renderRows(false);
    return true;
  }
  function showUnavailable() {
    el('ipc-featured').hidden = true;
    el('ipc-years').hidden = true;
    el('ipc-pagination').hidden = true;
    el('ipc-archive-title').textContent = 'Lab updates';
    el('ipc-results').textContent = 'News is temporarily unavailable. Please try again later.';
    el('ipc-results').setAttribute('role', 'status');
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    touched = true;
    if (button.dataset.feature) {
      featureOpener = button;
      const item = NEWS.find(n=>n.id===button.dataset.feature);
      if (!item) return;
      year = item.date.slice(0,4);
      page = Math.floor(currentItems().findIndex(n=>n.id===item.id)/pageSize())+1;
      renderYears(); renderRows(false);
      showStory(button.dataset.feature);
      el('ipc-detail').scrollIntoView({block:'nearest',behavior:'instant'});
    } else if (button.dataset.year) {
      featureOpener = null;
      year = button.dataset.year; page = 1;
      renderYears(); renderRows();
      root.querySelector(`[data-year="${year}"]`).focus({preventScroll:true});
    } else if (button.dataset.page) {
      page = Number(button.dataset.page); renderRows();
      root.querySelector('[aria-current="page"]').focus({preventScroll:true});
    } else if (button.dataset.story) { featureOpener = null; showStory(button.dataset.story); }
    else if (button.id === 'ipc-back') {
      const previous = selectedId;
      page = Math.floor(currentItems().findIndex(n=>n.id===previous)/pageSize())+1;
      renderRows(false);
      const opener = featureOpener || root.querySelector(`[data-story="${previous}"]`);
      if (opener) opener.focus();
      featureOpener = null;
      el('ipc-status').textContent = 'Returned to updates.';
    }
  });
  media.addEventListener('change', () => { if (NEWS.length && !selectedId) { page=1; renderRows(); } });

  // 1) Show at once: what this browser saw last time, else the copy built into this page.
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  let built = null;
  try { built = JSON.parse(document.getElementById('ipc-payload').textContent); } catch (e) {}
  const ok = render(cached) || render(built);
  // 2) Refresh from the sheet in the background (Apps Script takes about 2 s).
  // If the reader has already clicked something, keep their view; the new list is used next time.
  fetch(FEED + '&_=' + Date.now(), { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => {
      if (!d || d.error || !Array.isArray(d.news) || !d.news.length) return;
      try { localStorage.setItem(KEY, JSON.stringify({ news: d.news })); } catch (e) {}
      if (!touched) render(d);
    })
    .catch(() => { if (!ok) showUnavailable(); });
})();
