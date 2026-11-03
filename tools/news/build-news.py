"""Build news/index.html: the fast static News page for the Google Site.

The page shows a copy of the news built into it (or the copy the browser saved last time) at once,
then refreshes from the Apps Script feed (<news web app>/exec?type=news) in the background.

    python -I tools/news/build-news.py <repo root>

Re-run after big news changes so first-time visitors also see them at once (optional: the page
refreshes itself from the sheet anyway). The copy comes from ?type=news; if that is not deployed
yet, it is read from the current News web app page.
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

EXEC = 'https://script.google.com/macros/s/AKfycbwNoBz6CV-hy7kZjFKRyhjerlrpG4nm5H89jLuc-ZBmju-F5C6c2HOVDi-XXwvABpcv/exec'


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf-8')


def js_unescape(t):
    out, k = [], 0
    while k < len(t):
        c = t[k]
        if c == '\\':
            n = t[k + 1]
            if n == 'x':
                out.append(chr(int(t[k + 2:k + 4], 16))); k += 4; continue
            if n == 'u':
                out.append(chr(int(t[k + 2:k + 6], 16))); k += 6; continue
            out.append({'n': '\n', 't': '\t', 'r': '\r'}.get(n, n)); k += 2; continue
        out.append(c); k += 1
    return ''.join(out)


def from_web_app_page():
    """Read the payload out of the current News web app HTML (works before ?type=news exists)."""
    s = get(EXEC)
    i = s.index('userHtml')
    q = max(s.rfind('"', 0, i), s.rfind("'", 0, i))
    quote, j = s[q], q + 1
    while s[j] != quote:
        j += 2 if s[j] == '\\' else 1
    data = json.loads(js_unescape(s[q + 1:j]))

    def find(o):
        if isinstance(o, dict):
            if 'userHtml' in o:
                return o['userHtml']
            for v in o.values():
                r = find(v)
                if r:
                    return r
        if isinstance(o, list):
            for v in o:
                r = find(v)
                if r:
                    return r
    html = find(data)
    m = re.search(r'<script id="ipc-payload" type="application/json">(.*?)</script>', html, re.S)
    return json.loads(m.group(1))


def payload():
    try:
        d = json.loads(get(EXEC + '?type=news'))
        if isinstance(d.get('news'), list) and d['news']:
            print('news from ?type=news')
            return d
    except Exception as e:  # not deployed yet, or the feed returned HTML
        print('?type=news unavailable:', type(e).__name__)
    d = from_web_app_page()
    print('news from the web app page')
    return d


def main(root):
    root = Path(root)
    src = root / 'tools' / 'news'
    d = payload()
    news = [n for n in d.get('news', []) if isinstance(n, dict)]
    # Keep the built-in copy small: images stay out (the live refresh brings them).
    for n in news:
        n.pop('image', None)
    data = json.dumps({'news': news}, ensure_ascii=False).replace('</', '<\\/')
    page = (
        '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<title>News | KAIST Integrated Power Circuit Lab</title>\n'
        '<link rel="preconnect" href="https://script.google.com">\n'
        '<link rel="preconnect" href="https://script.googleusercontent.com" crossorigin>\n'
        '<style>\n' + (src / 'style.css').read_text(encoding='utf-8') + '</style>\n</head>\n<body>\n'
        + (src / 'markup.html').read_text(encoding='utf-8')
        + '\n<script id="ipc-payload" type="application/json">' + data + '</script>\n'
        + '<script>\n' + (src / 'news.js').read_text(encoding='utf-8') + '</script>\n</body>\n</html>\n'
    )
    out = root / 'news' / 'index.html'
    out.parent.mkdir(exist_ok=True)
    out.write_text(page, encoding='utf-8', newline='\n')
    print(f'{out}: {len(news)} items, {len(page) // 1024} KB')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
