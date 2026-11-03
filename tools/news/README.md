# Fast News page

`news/index.html` is the News block for the Google Site (Insert → Embed → By URL:
https://hoonjoon0501.github.io/IPC_Lab/news/). It shows news at once and refreshes from the sheet.

- Data: Google Sheet "IPC Lab 뉴스 관리", tab 뉴스관리 (unchanged). Apps Script "IPC Lab News" serves it as JSON at `?type=news` (`News-feed.gs`).
- Load order: the list this browser saw last time (localStorage), else the copy built into the page; then the live list from `?type=news` (about 2 s) replaces it unless the reader has already clicked.
- Rebuild the built-in copy (optional, for first-time visitors): `python -I tools/news/build-news.py .` then commit.
- Look and behaviour: `style.css`, `markup.html`, `news.js` (copied from the Apps Script News page, 2026-11-03).
