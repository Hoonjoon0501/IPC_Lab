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
