"""Copy concept-v3 into the public preview repo used by the Google Site embed.

usage: python -I tools/sync-preview.py <repo root> <preview repo>
The embed version drops the page header and the lab-name footer line (the Google Site has
its own), and leaves the preview repo's review pages (candidates/, review/) untouched.
"""
import glob, os, re, shutil, sys

src, dst = os.path.join(sys.argv[1], 'concept-v3'), sys.argv[2]
KEEP = {'.git', 'candidates', 'review', '.nojekyll'}
for name in os.listdir(dst):
    if name in KEEP: continue
    p = os.path.join(dst, name)
    shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
for name in os.listdir(src):
    if name == 'template.html': continue
    s, d = os.path.join(src, name), os.path.join(dst, name)
    shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy2(s, d)
open(os.path.join(dst, '.nojekyll'), 'w').close()
for f in [os.path.join(dst, 'index.html')] + glob.glob(os.path.join(dst, 'applications', '*.html')):
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'<header class="site-head">.*?</header>\n?', '', s, flags=re.S)
    s = s.replace('<footer class="site-foot"><p>KAIST Integrated Power Circuit Lab</p>', '<footer class="site-foot embed-foot">')
    open(f, 'w', encoding='utf-8', newline='\n').write(s)
with open(os.path.join(dst, 'concept-v2.css'), 'a', encoding='utf-8', newline='\n') as c:
    c.write('\n/* Embed version for the Google Site */\n.embed-foot { margin-top: 48px; padding: 16px; border-top: 0; }\n')
print('synced')
