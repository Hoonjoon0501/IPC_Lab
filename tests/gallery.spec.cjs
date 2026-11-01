const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gallery/data.js'), 'utf8'), context);
  const albums = context.window.GALLERY_ALBUMS;
  assert(albums.length > 0);
  assert.equal(new Set(albums.map(a => a.id)).size, albums.length);
  for (const album of albums) {
    assert(Number.isInteger(album.year) && album.title && album.photos.length);
    for (const photo of album.photos) {
      for (const source of [photo.src, photo.thumb].filter(Boolean)) {
        assert(fs.existsSync(path.resolve(root, 'gallery', source)), `Missing photo: ${source}`);
      }
    }
  }

  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.GALLERY_BASE_URL || 'http://127.0.0.1:8765/gallery/';
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    assert(await page.locator('.banner-photo').evaluate(img => img.complete && img.naturalWidth > 0));
    assert(await page.locator('.gallery-banner h1').evaluate(el =>
      getComputedStyle(el).fontFamily.includes('Montserrat') && getComputedStyle(el).fontWeight === '700'));
    assert.equal(await page.locator('.year-card').count(), new Set(albums.map(a => a.year)).size);
    assert.equal(await page.locator('#archive-count, .photo-count, .photo-number').count(), 0);
    assert.equal(await page.locator('h1').count(), 1);
    assert(await page.locator('#breadcrumbs').isHidden());
    assert(await page.locator('#archive-title').isHidden());
    assert(await page.locator('#back-nav').isHidden());
    assert.equal(await page.locator('#year-nav, .year-kicker, .event-footer').count(), 0);
    assert(!/Photo archive|IPC LAB|View photos/i.test(await page.locator('body').innerText()));
    await page.screenshot({ path: process.env.GALLERY_SCREENSHOT || path.join(root, '../gallery-years.png'), fullPage: true });
    await page.locator('.year-card').first().click();
    const firstYear = Math.max(...albums.map(a => a.year));
    assert.equal(new URL(page.url()).searchParams.get('year'), String(firstYear));
    assert.equal(await page.locator('.event-card').count(), albums.filter(a => a.year === firstYear).length);
    assert(await page.getByRole('link', { name: 'Back to years' }).isVisible());
    const firstOverlay = page.locator('.event-card').first().locator('.event-overlay');
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.event-overlay')).opacity === '0');
    await page.locator('.event-card').first().hover();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.event-overlay')).opacity === '1');
    assert.equal(await firstOverlay.locator('h3').count(), 1);
    assert.equal(await page.locator('.event-copy, .event-footer').count(), 0);
    await page.getByRole('link', { name: 'Back to years' }).click();
    assert.equal(await page.locator('.year-card').count(), new Set(albums.map(a => a.year)).size);
    await page.locator('.year-card').first().click();
    await page.locator('.event-card img').evaluateAll(images => images.forEach(img => { img.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.querySelectorAll('.event-card img')].every(img => img.complete && img.naturalWidth > 0));
    await page.locator('.event-card img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await page.screenshot({ path: path.join(root, '../gallery-events.png'), fullPage: true });
    await page.locator('.event-card').first().click();
    const first = albums.find(a => a.year === firstYear);
    assert.equal(await page.locator('.photo-tile').count(), first.photos.length);
    assert(await page.getByRole('link', { name: 'Back to events' }).isVisible());
    await page.getByRole('link', { name: 'Back to events' }).click();
    assert.equal(await page.locator('.event-card').count(), albums.filter(a => a.year === firstYear).length);
    await page.locator('.event-card').first().click();
    await page.locator('.photo-tile').first().click();
    assert(await page.locator('#photo-viewer').evaluate(el => el.open));
    await page.waitForFunction(() => document.fullscreenElement === document.documentElement);
    assert(await page.evaluate(() => {
      const bounds = document.querySelector('#photo-viewer').getBoundingClientRect();
      return bounds.x === 0 && bounds.y === 0 && Math.abs(bounds.width - innerWidth) < 1 && Math.abs(bounds.height - innerHeight) < 1;
    }));
    await page.waitForFunction(() => document.querySelector('#viewer-image').complete && document.querySelector('#viewer-image').naturalWidth > 0);
    await page.screenshot({ path: path.join(root, '../gallery-fullscreen.png') });
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#viewer-counter').innerText(), `2 / ${first.photos.length}`);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#viewer-counter').innerText(), `1 / ${first.photos.length}`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#photo-viewer').open && !document.fullscreenElement);
    assert(await page.locator('.photo-tile').first().evaluate(el => document.activeElement === el));
    await page.goBack();
    await page.waitForSelector('.event-card');
    await page.goForward();
    await page.waitForSelector('.photo-tile');

    // Every published album must be directly addressable and every thumbnail must decode.
    for (const album of albums) {
      await page.goto(`${base}?year=${album.year}&event=${album.id}`);
      assert.equal(await page.locator('#archive-title').innerText(), album.title);
      assert.equal(await page.locator('.photo-tile').count(), album.photos.length);
      await page.locator('.photo-tile').last().scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.photo-tile img')].every(img => img.complete && img.naturalWidth > 0));
    }
    await page.goto(`${base}?year=invalid&event=missing`);
    assert.equal(await page.locator('.year-card').count(), new Set(albums.map(a => a.year)).size);

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto(`${base}?year=${first.year}`);
    assert(await mobile.locator('.gallery-banner').evaluate(el => el.getBoundingClientRect().width <= innerWidth));
    assert.equal(await mobile.locator('.event-overlay').first().evaluate(el => getComputedStyle(el).opacity), '1');
    await mobile.goto(`${base}?year=${first.year}&event=${first.id}`);
    assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await mobile.locator('.photo-tile').first().click();
    await mobile.waitForFunction(() => document.querySelector('#viewer-image').complete && document.querySelector('#viewer-image').naturalWidth > 0);
    assert(await mobile.evaluate(() => {
      const bounds = document.querySelector('#photo-viewer').getBoundingClientRect();
      return bounds.x === 0 && bounds.y === 0 && Math.abs(bounds.width - innerWidth) < 1 && Math.abs(bounds.height - innerHeight) < 1;
    }));
    await mobile.screenshot({ path: path.join(root, '../gallery-mobile.png') });
    await mobile.getByRole('button', { name: 'Close photo viewer' }).click();
    await mobile.waitForFunction(() => !document.querySelector('#photo-viewer').open && !document.fullscreenElement);

    // A host that denies fullscreen must still get a working viewport-filling viewer.
    const host = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    host.on('pageerror', error => errors.push(error.message));
    await host.setContent(`<iframe src="${base}?year=${first.year}&event=${first.id}" allow="fullscreen 'none'" width="700" height="500"></iframe>`);
    const frame = host.frameLocator('iframe');
    await frame.locator('.photo-tile').first().click();
    assert(await frame.locator('#photo-viewer').evaluate(el => el.open));
    assert(await frame.locator('#photo-viewer').evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return !document.fullscreenEnabled && bounds.width === innerWidth && bounds.height === innerHeight;
    }));
    await frame.getByRole('button', { name: 'Close photo viewer' }).click();
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS: photo tiles, hover/touch captions, back buttons, native fullscreen and embedded fallback, keyboard, history, deep links and photo decoding.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
