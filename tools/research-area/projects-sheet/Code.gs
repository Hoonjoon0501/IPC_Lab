/**
 * IPC Lab research-area projects: JSON feed for the web page.
 *
 * Sheet tab "Projects" (row 1 = column names):
 *   status | app | area | title | partner | partner_short | logo | start | end | order | visible | note
 * Logos: upload the image to the Drive folder named LOGO_FOLDER and write its file name in "logo".
 *   A file name that is not in that folder is passed through (logos already on the website),
 *   and a full https:// URL is used as-is.
 *
 * First time: run setup() once from the editor (formats the sheet, adds the guide tab and
 * the logo folder). Then Deploy → New deployment → Web app → Execute as: Me, Access: Anyone.
 * Query: ?app=ai|ev|humanoids|rf|wpt (one application), ?callback=fn (JSONP).
 */
const SHEET_NAME = 'Projects';
const GUIDE_NAME = '사용법';
const LOGO_FOLDER = 'IPC_Homepage_Logos';
const CACHE_SECONDS = 60;
const COLUMNS = ['status', 'app', 'area', 'title', 'partner', 'partner_short', 'logo', 'start', 'end', 'order', 'visible', 'note'];

function doGet(e) {
  const p = (e && e.parameter) || {};
  const app = (p.app || '').trim();
  const cache = CacheService.getScriptCache();
  const key = 'projects:' + app;
  let rows = cache.get(key);
  rows = rows ? JSON.parse(rows) : readProjects_(app);
  if (!cache.get(key)) cache.put(key, JSON.stringify(rows), CACHE_SECONDS);
  const projects = rows.map(x => ({ ...x, logo: resolveLogo_(x.logo) }));
  const body = JSON.stringify({ updated: new Date().toISOString(), projects });
  const cb = p.callback;
  if (cb && /^[A-Za-z_$][\w.$]*$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + body + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function readProjects_(app) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const range = sheet.getDataRange();
  const rows = range.getDisplayValues();
  const raw = range.getValues();
  const head = rows.shift().map(h => String(h).trim());
  raw.shift();
  const logoCol = head.indexOf('logo');
  // "2025.10" typed into a number cell shows as "2025.1"; months are always two digits here.
  const month = v => /^\d{4}\.\d$/.test(v) ? v + '0' : v;
  return rows
    .map((r, k) => {
      const x = Object.fromEntries(head.map((h, i) => [h, String(r[i]).trim()]));
      const img = logoCol >= 0 ? cellImageKey_(raw[k][logoCol]) : '';
      if (img) x.logo = img;
      return x;
    })
    .filter(x => x.title && (x.visible || 'Y').toUpperCase() !== 'N')
    .filter(x => !app || x.app === app)
    .map(x => ({ ...x, start: month(x.start || ''), end: month(x.end || ''),
                 status: (x.status || '').toLowerCase() === 'completed' ? 'completed' : 'ongoing', order: Number(x.order) || 999 }))
    .sort((a, b) => a.order - b.order);
}

/** Image placed in the logo cell (Insert → Image → In cell): cache it as a data URL, return its key. */
function cellImageKey_(value) {
  if (!value || value.valueType !== SpreadsheetApp.ValueType.IMAGE) return '';
  try {
    const src = value.getContentUrl();
    if (typeof src !== 'string' || !src.startsWith('https://')) return '';
    const key = 'cell:' + Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, src).map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
    const cache = CacheService.getScriptCache();
    if (!cache.get('logo:' + key)) {
      const blob = UrlFetchApp.fetch(src, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob();
      const uri = 'data:' + (blob.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(blob.getBytes());
      cache.put('logo:' + key, uri.length < 95000 ? uri : '', 600);
    }
    return key;
  } catch (err) {
    console.error('logo image could not be read: ' + err);
    return '';
  }
}

/** Logo value → image source: in-cell image, Drive logo folder (as a data URL), full URL, or a site file name. */
function resolveLogo_(name) {
  if (!name || /^https?:\/\//.test(name) || /^data:/.test(name)) return name || '';
  const cache = CacheService.getScriptCache();
  if (name.startsWith('cell:')) return cache.get('logo:' + name) || '';
  const hit = cache.get('logo:' + name);
  if (hit) return hit === '-' ? name : hit;
  const folders = DriveApp.getFoldersByName(LOGO_FOLDER);
  if (folders.hasNext()) {
    const files = folders.next().getFilesByName(name);
    if (files.hasNext()) {
      const blob = files.next().getBlob();
      const uri = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
      if (uri.length < 95000) cache.put('logo:' + name, uri, 600);
      return uri;
    }
  }
  cache.put('logo:' + name, '-', 600);
  return name;
}

/** Run once from the editor: dropdowns, plain-text dates, header style, guide tab, logo folder. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0].setName(SHEET_NAME);
  const last = Math.max(sh.getMaxRows(), 200);
  const col = name => COLUMNS.indexOf(name) + 1;
  sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]).setFontWeight('bold').setBackground('#0b1a30').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  const list = (name, values, help) => sh.getRange(2, col(name), last - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).setHelpText(help).build());
  list('status', ['ongoing', 'completed'], 'ongoing = 진행 중, completed = 종료 (페이지에서 "Completed projects" 아래로 들어갑니다)');
  list('app', ['ai', 'ev', 'humanoids', 'rf', 'wpt'], '응용 분야. 비워 두면 메인 페이지에만 표시됩니다.');
  list('visible', ['Y', 'N'], 'N이면 페이지에서 숨깁니다 (행은 지우지 않음).');
  for (const name of ['start', 'end']) {
    const r = sh.getRange(2, col(name), last - 1, 1);
    const v = r.getDisplayValues().map(([x]) => [/^\d{4}\.\d$/.test(x) ? x + '0' : x]);
    r.setNumberFormat('@').setValues(v);
  }
  const notes = { status: 'ongoing / completed', app: 'ai, ev, humanoids, rf, wpt 또는 빈칸', area: 'app이 빈칸일 때 메인에 표시할 분야 이름 (예: Aerospace)',
    title: '과제명 (영문)', partner: '기관/기업 이름 (페이지 표시용)', partner_short: '짧은 이름 (로고가 없을 때 표시)',
    logo: `로고: 이 칸에 그림을 바로 넣으세요 (삽입 → 이미지 → 셀에 이미지 삽입). 파일 이름(samsung.png 등)이나 https:// 주소를 적어도 됩니다.`,
    start: '시작 연월 2025.10 형식', end: '종료 연월. 진행 중이면 비워 두세요.', order: '표시 순서 (작을수록 위)', visible: 'Y = 표시, N = 숨김', note: '메모 (페이지에 표시 안 됨)' };
  COLUMNS.forEach((c, i) => sh.getRange(1, i + 1).setNote(notes[c]));
  [90, 90, 110, 380, 300, 110, 150, 80, 80, 60, 60, 200].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(2, col('title'), last - 1, 2).setWrap(true);
  const all = sh.getRange(2, 1, last - 1, COLUMNS.length);
  sh.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$A2="completed"').setBackground('#eef1f5').setFontColor('#7a889b').setRanges([all]).build()]);

  if (!DriveApp.getFoldersByName(LOGO_FOLDER).hasNext()) DriveApp.createFolder(LOGO_FOLDER);
  const g = ss.getSheetByName(GUIDE_NAME) || ss.insertSheet(GUIDE_NAME);
  g.clear();
  const lines = [
    ['IPC Lab 홈페이지 프로젝트 목록 사용법'], [''],
    ['1. 새 과제 추가: Projects 탭 맨 아래 빈 줄에 한 줄을 적습니다. 회색 메모(머리글에 마우스를 올리면 보임)에 각 칸 설명이 있습니다.'],
    ['2. 진행 중 / 종료: status 칸에서 ongoing 또는 completed를 고릅니다. completed는 페이지의 "Completed projects ▸"를 누르면 보입니다.'],
    ['3. 분야: app 칸에서 ai(AI Datacenter), ev(Electric Vehicles), humanoids, rf(RF Systems), wpt(Wireless Power Transfer) 중 고릅니다. 비우면 메인 페이지에만 나옵니다.'],
    ['4. 날짜: start, end는 2025.10처럼 적습니다. 진행 중이면 end를 비웁니다.'],
    [`5. 로고: logo 칸을 클릭하고 삽입 → 이미지 → "셀에 이미지 삽입"으로 로고 그림을 넣으면 됩니다. 또는 드라이브 "${LOGO_FOLDER}" 폴더에 올린 파일 이름, 인터넷 이미지 주소(https://…)를 적어도 됩니다.`],
    ['6. 숨기기: 지우지 않고 잠시 빼려면 visible을 N으로 바꿉니다.'],
    ['7. 반영: 저장하면 약 1분 안에 홈페이지에 반영됩니다. 순서는 order 숫자가 작은 것부터입니다.'],
  ];
  g.getRange(1, 1, lines.length, 1).setValues(lines).setWrap(true);
  g.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  g.setColumnWidth(1, 900);
  ss.setActiveSheet(g); ss.moveActiveSheet(1);
  ss.setActiveSheet(sh);
  clearCache();
}

/** Run after editing if you want the page to update before the one-minute cache expires. */
function clearCache() {
  CacheService.getScriptCache().removeAll(['projects:', 'projects:ai', 'projects:ev', 'projects:humanoids', 'projects:rf', 'projects:wpt']);
}
