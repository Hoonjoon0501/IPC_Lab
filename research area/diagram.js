// Scale the complete HTML diagram together, preserving its reference layout.
(() => {
  const frame = document.querySelector('.power-diagram-frame');
  if (!frame) return;
  const canvas = frame.querySelector('.power-diagram');
  const resize = () => {
    canvas.style.transform = `scale(${frame.clientWidth / 900})`;
  };
  resize();
  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(frame);
  } else {
    window.addEventListener('resize', resize);
  }

  const trigger = document.querySelector('.chip-toggle');
  const panel = document.querySelector('#future-delivery-panel');
  const close = panel?.querySelector('.delivery-close');
  const deliveryFrame = panel?.querySelector('.delivery-panel-frame');
  const deliveryCanvas = panel?.querySelector('.delivery-panel-canvas');
  if (!trigger || !panel || !close || !deliveryFrame || !deliveryCanvas) return;

  const resizeDelivery = () => {
    if (!panel.hidden) deliveryCanvas.style.transform = `scale(${deliveryFrame.clientWidth / 900})`;
  };
  const setOpen = (open, returnFocus = false) => {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    resizeDelivery();
    if (!open && returnFocus) trigger.focus({ preventScroll: true });
  };
  trigger.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false, true));
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); }
  });
  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  if ('ResizeObserver' in window) new ResizeObserver(resizeDelivery).observe(deliveryFrame);
  else window.addEventListener('resize', resizeDelivery);
})();
