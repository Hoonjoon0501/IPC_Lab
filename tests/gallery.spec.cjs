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
    assert.equal(await page.locator('.year-card').count(), new Set(albums.map(a => a.year)).size);
    assert.equal(await page.locator('#archive-count, .photo-count, .photo-number').count(), 0);
    assert.equal(await page.locator('.page-header p').count(), 0);
    assert(await page.locator('#breadcrumbs').isHidden());
    await page.screenshot({ path: process.env.GALLERY_SCREENSHOT || path.join(root, '../gallery-years.png'), fullPage: true });
    await page.locator('.year-card').first().click();
    const firstYear = Math.max(...albums.map(a => a.year));
    assert.equal(new URL(page.url()).searchParams.get('year'), String(firstYear));
    assert.equal(await page.locator('.event-card').count(), albums.filter(a => a.year === firstYear).length);
    await page.locator('.event-card img').evaluateAll(images => images.forEach(img => { img.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.querySelectorAll('.event-card img')].every(img => img.complete && img.naturalWidth > 0));
    await page.locator('.event-card img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await page.screenshot({ path: path.join(root, '../gallery-events.png'), fullPage: true });
    await page.locator('.event-card').first().click();
    const first = albums.find(a => a.year === firstYear);
    assert.equal(await page.locator('.photo-tile').count(), first.photos.length);
    await page.locator('.photo-tile').first().click();
    assert(await page.locator('#photo-viewer').evaluate(el => el.open));
    await page.waitForFunction(() => document.querySelector('#viewer-image').complete && document.querySelector('#viewer-image').naturalWidth > 0);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#viewer-counter').innerText(), `2 / ${first.photos.length}`);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#viewer-counter').innerText(), `1 / ${first.photos.length}`);
    await page.keyboard.press('Escape');
    assert(!(await page.locator('#photo-viewer').evaluate(el => el.open)));
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

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}?year=${first.year}&event=${first.id}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('.photo-tile').first().click();
    await page.waitForFunction(() => document.querySelector('#viewer-image').complete && document.querySelector('#viewer-image').naturalWidth > 0);
    const bounds = await page.locator('#photo-viewer').boundingBox();
    assert(bounds.width <= 390 && bounds.x >= 0 && bounds.y >= 0);
    await page.screenshot({ path: path.join(root, '../gallery-mobile.png') });
    await page.getByRole('button', { name: 'Close photo viewer' }).click();
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log(`PASS: ${albums.length} albums, ${albums.reduce((n, a) => n + a.photos.length, 0)} photos; routing, history, viewer, keyboard, focus, deep links and mobile.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
