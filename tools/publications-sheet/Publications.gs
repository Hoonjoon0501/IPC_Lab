/** Read-only publications feed. Add the type=publications route to the existing doGet(e). */
const PUB_SHEET_ = 'Publications';
const PUB_HEADERS_ = ['공개상태','구분','연도','제목','저자','게재지·특허정보','권호·쪽·발행일','논문링크','특별표기','특별표기설명','그림','그림설명','정렬','내부메모','출처ID'];

function publicationsFeed_(e) {
  let payload;
  try {
    const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PUB_SHEET_);
    if(!sheet)throw new Error('Publications sheet is missing');
    const rows=sheet.getRange(1,1,Math.max(1,sheet.getLastRow()),PUB_HEADERS_.length).getValues();
    payload={publications:pubParse_(rows),updated:new Date().toISOString(),error:false};
  } catch(error) {
    console.error('Publications feed: '+error.message);
    payload={publications:[],error:true};
  }
  const body=JSON.stringify(payload).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function pubParse_(rows) {
  if(!rows.length || PUB_HEADERS_.some((h,i)=>rows[0][i]!==h))throw new Error('Publication headers have changed');
  const text=v=>v===undefined||v===null?'':String(v).trim();
  const result=[];
  for(let i=1;i<rows.length;i++){
    const r=rows[i];
    if(text(r[0])!=='공개' || !['저널','학회','특허'].includes(text(r[1])) || !text(r[3]))continue;
    const year=text(r[2]);
    if(year && !/^(19|20)\d{2}$/.test(year))continue;
    const item={id:text(r[14]),kind:text(r[1]),year:year,title:text(r[3]),authors:text(r[4]),venue:text(r[5]),details:text(r[6]),link:pubHttpUrl_(text(r[7])),badges:text(r[8]).split('|').map(s=>s.trim()).filter(Boolean),recognition:text(r[9]),image:'',imageAlt:text(r[11]),order:Number(r[12])||0};
    // Only public rows reach image conversion. Internal notes are never serialized.
    if(r[10] && r[10].valueType===SpreadsheetApp.ValueType.IMAGE){const image=cellImage_(r[10],item.imageAlt,item.title);if(image){item.image=image.src;item.imageAlt=image.alt;}}
    else if(/^https:\/\//i.test(text(r[10])))item.image=pubHttpUrl_(text(r[10]));
    result.push(item);
  }
  return result;
}
function pubHttpUrl_(value){return /^https?:\/\/[^\s<>"\\]+$/i.test(value)?value:'';}
