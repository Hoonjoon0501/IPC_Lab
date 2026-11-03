// Toggle the vision panel from the IPC chip.
(() => {
  const toggle = document.querySelector('.vision-toggle');
  const panel = document.getElementById('vision-panel');
  if (!toggle || !panel) return;
  const close = panel.querySelector('.vision-close');
  const set = (open, focusBack) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    else if (focusBack) toggle.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => set(panel.hidden));
  close.addEventListener('click', () => set(false, true));
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') set(false, true); });
  if (location.hash === '#vision') set(true);
})();

// Run the looping figure animations only while the figure is visible.
(() => {
  const els = document.querySelectorAll('.art, .twin-stage, .vision-figure, .stack, .sponsors');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in-view')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting)), { rootMargin: '100px' });
  els.forEach(e => io.observe(e));
})();
