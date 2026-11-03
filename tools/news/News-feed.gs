/**
 * News feed for the fast static News page (IPC_Lab/news/index.html on GitHub Pages).
 *   <this web app URL>?type=news  ->  {"news":[...], "error":false}
 * Called from doGet(e) when e.parameter.type === "news". Uses readNews_() from Code.gs,
 * kept for 60 s so sheet edits appear within about a minute.
 *
 * Installed 2026-11-03 in Apps Script "IPC Lab News" as file NewsFeed.gs, with this line in doGet:
 *   if (e && e.parameter && e.parameter.type === 'news') return newsFeed_(e);
 * Deployed as version 15 of the existing web app deployment (same URL).
 */
const NEWS_CACHE_SECONDS = 60;

function newsFeed_(e) {
  const cache = CacheService.getScriptCache();
  let body = cache.get('news-json');
  if (!body) {
    try {
      body = JSON.stringify({ news: readNews_().news, error: false });
      try { cache.put('news-json', body, NEWS_CACHE_SECONDS); } catch (err) {}  // over 100 KB (images): no cache
    } catch (error) {
      console.error('IPC news feed could not be loaded.');
      body = JSON.stringify({ news: [], error: true });
    }
  }
  const cb = e && e.parameter && e.parameter.callback;
  if (cb && /^[A-Za-z_$][\w.$]*$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + body + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
