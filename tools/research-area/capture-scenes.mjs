// Render scenes from render-scenes.html to transparent 2x PNGs + overlay JSON.
// usage: node tools/capture.mjs <out dir> <scene> [<scene> ...]
// needs: npm i --no-save three@0.170.0 playwright-core (in tools/), and Edge or Chrome installed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const dir = path.dirname(fileURLToPath(import.meta.url));
const [out, ...scenes] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const srv = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = srv.address().port;
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=d3d11', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
for (const s of scenes) {
  await page.goto(`http://127.0.0.1:${port}/render-scenes.html?s=${s}`);
  await page.waitForFunction(() => document.title === 'done', null, { timeout: 120000 });
  await page.screenshot({ path: path.join(out, `${s}.png`), omitBackground: true });
  fs.writeFileSync(path.join(out, `${s}.json`), await page.textContent('#out'));
  console.log('rendered', s);
}
await browser.close(); srv.close();
