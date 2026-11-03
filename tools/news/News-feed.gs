/**
 * News feed for the fast static News page (IPC_Lab/news/index.html).
 *   <news web app URL>?type=news  →  {"news":[...]}  (the same list the News page shows)
 *
 * Setup (Apps Script "IPC Lab News"):
 *   1. Add this file (+ → Script → name it NewsFeed) and paste this code.
 *   2. In doGet(e), right next to the existing ?type=projects line, add:
 *        if (e && e.parameter && e.parameter.type === 'news') return newsFeed_(e);
 *   3. Deploy → Manage deployments → pencil → Version: New version → Deploy (keeps the same URL).
 *
 * It reuses the existing News page: it renders doGet without ?type, takes the news list out of it,
 * and keeps the result for 60 s, so sheet edits appear within about a minute.
 */
const NEWS_CACHE_SECONDS = 60;

function newsFeed_(e) {
  const cache = CacheService.getScriptCache();
  let body = cache.get('news-json');
  if (!body) {
    const html = doGet({ parameter: {} }).getContent();
    const m = html.match(/<script id="ipc-payload" type="application\/json">([\s\S]*?)<\/script>/);
    body = m ? m[1] : JSON.stringify({ news: [], error: true });
    try { cache.put('news-json', body, NEWS_CACHE_SECONDS); } catch (err) {}  // over 100 KB (images): skip caching
  }
  const cb = e && e.parameter && e.parameter.callback;
  if (cb && /^[A-Za-z_$][\w.$]*$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + body + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
