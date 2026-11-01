(() => {
  'use strict';
  const albums = window.GALLERY_ALBUMS || [];
  const years = [...new Set(albums.map(album => album.year))].sort((a, b) => b - a);
  const grid = document.querySelector('#gallery-grid');
  const heading = document.querySelector('#archive-title');
  const description = document.querySelector('#archive-description');
  const breadcrumbs = document.querySelector('#breadcrumbs');
  const backNav = document.querySelector('#back-nav');
  const viewer = document.querySelector('#photo-viewer');
  const viewerImage = document.querySelector('#viewer-image');
  const previous = document.querySelector('#previous-photo');
  const next = document.querySelector('#next-photo');
  let activeAlbum = null;
  let activeIndex = 0;
  let returnFocus = null;
  let viewerOwnsFullscreen = false;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function route(year, event) {
    const query = new URLSearchParams();
    if (year) query.set('year', year);
    if (event) query.set('event', event);
    return query.size ? `?${query}` : './';
  }

  function link(text, href, className = '') {
    const anchor = element('a', className, text);
    anchor.href = href;
    anchor.dataset.galleryLink = '';
    return anchor;
  }

  function image(photo, alt, eager = false) {
    const img = element('img');
    img.alt = alt;
    img.width = 720;
    img.height = 480;
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => img.parentElement.classList.add('image-error'));
    img.src = photo.thumb || photo.src;
    return img;
  }

  function cover(photo, alt, eager) {
    const wrap = element('div', 'cover-wrap');
    if (photo) wrap.append(image(photo, alt, eager));
    return wrap;
  }

  function crumb(text, href) {
    if (breadcrumbs.children.length) {
      const separator = element('span', 'crumb-separator', '/');
      separator.setAttribute('aria-hidden', 'true');
      breadcrumbs.append(separator);
    }
    const node = href ? link(text, href) : element('span', '', text);
    if (!href) node.setAttribute('aria-current', 'page');
    breadcrumbs.append(node);
  }

  function render(focus = false) {
    if (viewer.open) viewer.close();
    const params = new URLSearchParams(location.search);
    const selectedEvent = albums.find(album => album.id === params.get('event'));
    const selectedYear = selectedEvent?.year || (years.includes(Number(params.get('year'))) ? Number(params.get('year')) : null);
    const items = albums.filter(album => album.year === selectedYear);
    const view = selectedEvent ? 'photos' : selectedYear ? 'events' : 'years';
    grid.replaceChildren();
    grid.dataset.view = view;
    breadcrumbs.replaceChildren();
    breadcrumbs.hidden = !selectedYear;
    backNav.replaceChildren();
    backNav.hidden = !selectedYear;
    heading.parentElement.hidden = !selectedYear;
    document.querySelector('#year-divider').hidden = Boolean(selectedYear);
    description.hidden = !selectedEvent?.description;
    description.textContent = selectedEvent?.description || '';
    if (selectedYear) {
      crumb('Gallery', './');
      crumb(String(selectedYear), selectedEvent ? route(selectedYear) : null);
      const back = link(selectedEvent ? 'Back to events' : 'Back to years', selectedEvent ? route(selectedYear) : './', 'back-button');
      const arrow = element('span', 'back-arrow', '←');
      arrow.setAttribute('aria-hidden', 'true');
      back.prepend(arrow);
      backNav.append(back);
    }
    if (selectedEvent) crumb(selectedEvent.title);

    if (view === 'years') {
      heading.textContent = 'Gallery by year';
      years.forEach((year, index) => {
        const events = albums.filter(album => album.year === year);
        const card = link('', route(year), 'archive-card year-card');
        const frame = cover(events[0]?.photos[0], `${year} IPC Lab gallery`, index < 3);
        const overlay = element('div', 'year-overlay');
        const row = element('div', 'year-title-row');
        const arrow = element('span', 'card-arrow', '↗');
        arrow.setAttribute('aria-hidden', 'true');
        row.append(element('h3', '', String(year)), arrow);
        overlay.append(row);
        frame.append(overlay);
        card.append(frame);
        grid.append(card);
      });
    } else if (view === 'events') {
      heading.textContent = String(selectedYear);
      items.forEach((album, index) => {
        const card = link('', route(album.year, album.id), 'archive-card event-card');
        const frame = cover(album.photos[0], album.title, index < 3);
        const overlay = element('div', 'event-overlay');
        overlay.append(element('h3', '', album.title), element('p', 'event-year', String(album.year)));
        if (album.description) overlay.append(element('p', 'event-description', album.description));
        frame.append(overlay);
        card.append(frame);
        grid.append(card);
      });
    } else {
      heading.textContent = selectedEvent.title;
      selectedEvent.photos.forEach((photo, index) => {
        const button = element('button', 'photo-tile');
        button.type = 'button';
        button.setAttribute('aria-label', `Open ${selectedEvent.title}, photo ${index + 1} of ${selectedEvent.photos.length}`);
        button.append(image(photo, `${selectedEvent.title} — ${index + 1}`, index < 3));
        button.addEventListener('click', () => {
          activeAlbum = selectedEvent;
          activeIndex = index;
          returnFocus = button;
          updateViewer();
          viewer.showModal();
          enterFullscreen();
        });
        grid.append(button);
      });
    }
    if (!grid.children.length) grid.append(element('p', 'empty-state', 'No photos have been added yet.'));
    document.title = `${selectedEvent?.title || selectedYear || 'Gallery'} | IPC Lab Gallery`;
    if (focus) (selectedYear ? heading : document.querySelector('h1')).focus({ preventScroll: true });
  }

  async function enterFullscreen() {
    if (document.fullscreenElement || !document.fullscreenEnabled) return;
    try {
      // The document is used because dialog elements cannot enter native fullscreen.
      await document.documentElement.requestFullscreen();
      if (viewer.open) viewerOwnsFullscreen = true;
      else if (document.fullscreenElement === document.documentElement) await document.exitFullscreen();
    } catch {
      // Embedded pages may deny native fullscreen; the dialog still fills its viewport.
    }
  }

  function updateViewer() {
    const photo = activeAlbum.photos[activeIndex];
    viewerImage.hidden = false;
    document.querySelector('#viewer-error').hidden = true;
    viewerImage.alt = `${activeAlbum.title} — photo ${activeIndex + 1} of ${activeAlbum.photos.length}`;
    viewerImage.src = photo.src;
    document.querySelector('#open-image').href = photo.src;
    document.querySelector('#viewer-counter').textContent = `${activeIndex + 1} / ${activeAlbum.photos.length}`;
    document.querySelector('#viewer-caption').textContent = activeAlbum.title;
    previous.disabled = activeAlbum.photos.length < 2;
    next.disabled = activeAlbum.photos.length < 2;
  }

  function movePhoto(direction) {
    activeIndex = (activeIndex + direction + activeAlbum.photos.length) % activeAlbum.photos.length;
    updateViewer();
  }

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[data-gallery-link]');
    if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState(null, '', anchor.href);
    render(true);
    document.querySelector('.gallery-banner').scrollIntoView({ block: 'start' });
  });
  window.addEventListener('popstate', () => render(true));
  document.querySelector('#close-viewer').addEventListener('click', () => viewer.close());
  previous.addEventListener('click', () => movePhoto(-1));
  next.addEventListener('click', () => movePhoto(1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const bounds = viewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
  });
  viewer.addEventListener('close', async () => {
    if (viewerOwnsFullscreen && document.fullscreenElement === document.documentElement) {
      viewerOwnsFullscreen = false;
      await document.exitFullscreen().catch(() => {});
    }
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  document.addEventListener('fullscreenchange', () => {
    if (viewerOwnsFullscreen && !document.fullscreenElement) {
      viewerOwnsFullscreen = false;
      if (viewer.open) viewer.close();
    }
  });
  viewerImage.addEventListener('error', () => {
    viewerImage.hidden = true;
    document.querySelector('#viewer-error').hidden = false;
  });
  render();
})();
