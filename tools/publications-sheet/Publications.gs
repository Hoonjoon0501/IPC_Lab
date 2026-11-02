/** Read-only publications feed. Add the type=publications route to the existing doGet(e). */
const PUB_SHEET_ = 'Publications';
const PUB_HEADERS_ = ['공개상태','구분','연도','제목','저자','게재지·특허정보','논문링크','특별표기','그림','정렬','내부메모','출처ID'];

function publicationsFeed_(e) {
  let payload;
  const params=(e && e.parameter)||{};
  try {
    const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PUB_SHEET_);
    if(!sheet)throw new Error('Publications sheet is missing');
    const rows=sheet.getRange(1,1,Math.max(1,sheet.getLastRow()),sheet.getLastColumn()).getValues();
    payload=params.imageRow!==undefined ? pubImageResponse_(rows,params) : {publications:pubParse_(rows,params.images==='deferred'),updated:new Date().toISOString(),error:false};
  } catch(error) {
    console.error('Publications feed: '+error.message);
    payload={publications:[],error:true};
  }
  const body=JSON.stringify(payload).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function pubParse_(rows,deferred) {
  if(!rows.length || PUB_HEADERS_.some(h=>!rows[0].includes(h)))throw new Error('Publication headers have changed');
  const columns=Object.fromEntries(rows[0].map((name,index)=>[name,index]));
  const text=v=>v===undefined||v===null?'':String(v).trim();
  const result=[];
  for(let i=1;i<rows.length;i++){
    const r=PUB_HEADERS_.map(name=>rows[i][columns[name]]);
    if(text(r[0])!=='공개' || !['저널','학회'].includes(text(r[1])) || !text(r[3]))continue;
    const year=text(r[2]);
    if(year && !/^(19|20)\d{2}$/.test(year))continue;
    const item={id:text(r[11]),kind:text(r[1]),year:year,title:text(r[3]),authors:text(r[4]),venue:text(r[5]),link:pubHttpUrl_(text(r[6])),badges:text(r[7]).split('|').map(s=>s.trim()).filter(Boolean),image:'',order:Number(r[9])||0};
    // Only public rows reach image conversion. Internal notes are never serialized.
    if(r[8] && r[8].valueType===SpreadsheetApp.ValueType.IMAGE){
      if(deferred){item.imageRow=i+1;item.imageKey=pubImageKey_(i+1,item.id,item.title);}
      else {const image=cellImage_(r[8],'',item.title);if(image)item.image=image.src;}
    }
    else if(/^https:\/\//i.test(text(r[8])))item.image=pubHttpUrl_(text(r[8]));
    result.push(item);
  }
  return result;
}
function pubHttpUrl_(value){return /^https?:\/\/[^\s<>"\\]+$/i.test(value)?value:'';}

function pubImageKey_(row,id,title){
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify([row,id,title]))
    .map(b=>((b+256)%256).toString(16).padStart(2,'0')).join('');
}

function pubImageResponse_(rows,params){
  const row=Number(params.imageRow);
  if(!Number.isInteger(row) || row<2 || row>rows.length)return {image:'',error:true};
  // Recheck public status and identity before consulting the image cache.
  const item=pubParse_(rows,true).find(p=>p.imageRow===row && p.imageKey===params.key);
  if(!item)return {image:'',error:true};
  const key='pub-image-v1:'+item.imageKey;
  let cache;
  try {
    cache=CacheService.getScriptCache();
    const manifest=params.fresh==='1'?null:JSON.parse(cache.get(key)||'null');
    if(manifest && manifest.expiresAt>Date.now()){
      const keys=Array.from({length:manifest.parts},(_,i)=>key+':'+manifest.generation+':'+i);
      const parts=cache.getAll(keys);
      if(keys.every(k=>typeof parts[k]==='string'))return {image:keys.map(k=>parts[k]).join(''),expiresAt:manifest.expiresAt,error:false};
    }
  }catch(error){/* Cache failure must not prevent an image from loading. */}
  const image=cellImage_(rows[row-1][rows[0].indexOf('그림')],'',item.title);
  if(!image)return {image:'',error:true};
  const expiresAt=Date.now()+300000;
  try {
    if(cache){
      const generation=Utilities.getUuid(),parts={};let count=0;
      // CacheService limits each value to 100 KB. Publish the manifest last.
      for(let offset=0;offset<image.src.length;offset+=80000)parts[key+':'+generation+':'+count++]=image.src.slice(offset,offset+80000);
      cache.putAll(parts,300);
      cache.put(key,JSON.stringify({generation:generation,parts:count,expiresAt:expiresAt}),300);
    }
  }catch(error){/* Return the image even if cache storage is unavailable. */}
  return {image:image.src,expiresAt:expiresAt,error:false};
}
