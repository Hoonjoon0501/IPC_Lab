const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const script = path.resolve(__dirname, '../members/photos.js');
const portrait = fs.readFileSync(path.resolve(__dirname, '../images/doyeon-eom.webp'));

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        async function fixture({ cached = false, lazy = false, reduced = false, broken = false } = {}) {
            const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
            await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
            let release;
            const ready = new Promise(resolve => { release = resolve; });
            await page.route('https://portraits.test/photo.webp', async route => {
                await ready;
                await route.fulfill(broken
                    ? { status: 404, body: '' }
                    : { contentType: 'image/webp', body: portrait });
            });
            await page.setContent(`<style>
                .member-photo { width: 100px; height: 125px; opacity: .97; }
                .photo-fallback { display: none; }
                </style><div style="margin-top:${lazy ? 5000 : 0}px">
                <img class="member-photo" src="https://portraits.test/photo.webp" ${lazy ? 'loading="lazy"' : ''}>
                <div class="photo-fallback">Portrait unavailable</div></div>`,
                { waitUntil: 'domcontentloaded' });
            const photo = page.locator('img');
            if (cached) {
                release();
                await photo.evaluate(image => image.decode());
            }
            await page.addScriptTag({ path: script });
            return { page, photo, release };
        }

        for (const options of [{}, { cached: true }, { lazy: true }]) {
            const { page, photo, release } = await fixture(options);
            if (!options.cached) {
                assert.equal(await photo.evaluate(image => image.getAnimations().length), 0);
                if (options.lazy) await photo.scrollIntoViewIfNeeded();
                release();
            }
            await page.waitForFunction(() => document.querySelector('img').getAnimations().length === 1);
            const midpoint = await photo.evaluate(image => {
                const animation = image.getAnimations()[0];
                animation.pause();
                animation.currentTime = 300;
                return { duration: animation.effect.getTiming().duration,
                    opacity: Number(getComputedStyle(image).opacity),
                    transform: getComputedStyle(image).transform };
            });
            assert.equal(midpoint.duration, 600);
            assert(midpoint.opacity > 0 && midpoint.opacity < .97, JSON.stringify(midpoint));
            assert.equal(midpoint.transform, 'none');
            await photo.evaluate(image => image.getAnimations()[0].finish());
            await page.waitForFunction(() => document.querySelector('img').getAnimations().length === 0);
            assert.equal(await photo.evaluate(image => Number(getComputedStyle(image).opacity)), .97);
            await photo.dispatchEvent('load');
            assert.equal(await photo.evaluate(image => image.getAnimations().length), 0, 'Reveal runs once');
            await page.close();
        }

        const reduced = await fixture({ cached: true, reduced: true });
        await reduced.page.waitForFunction(() => document.querySelector('img').style.display === 'block');
        assert.equal(await reduced.photo.evaluate(image => image.getAnimations().length), 0);
        assert.equal(await reduced.photo.evaluate(image => Number(getComputedStyle(image).opacity)), .97);
        await reduced.page.close();

        const broken = await fixture({ broken: true });
        broken.release();
        await broken.page.waitForFunction(() => document.querySelector('.photo-fallback').style.display === 'flex');
        assert.equal(await broken.photo.evaluate(image => getComputedStyle(image).display), 'none');
        assert.equal(await broken.photo.evaluate(image => image.getAnimations().length), 0);
        await broken.page.close();
        console.log('Member photo checks passed: loaded, cached, lazy, reduced motion, error fallback, one reveal');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
