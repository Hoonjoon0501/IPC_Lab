const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const model=require('../publications/publications.js');
let imageReads=0;
const context=vm.createContext({SpreadsheetApp:{ValueType:{IMAGE:'IMAGE'}},cellImage_:()=>{imageReads++;return {src:'data:image/png;base64,iVBORw==',alt:'Circuit'};}});
const source=fs.readFileSync(path.join(__dirname,'../tools/publications-sheet/Publications.gs'),'utf8');
vm.runInContext(source,context);
const headers=['공개상태','구분','연도','제목','저자','게재지·특허정보','권호·쪽·발행일','논문링크','특별표기','특별표기설명','그림','그림설명','정렬','내부메모','출처ID'];
const row=['공개','저널','2022','<img onerror=alert(1)>','J. Baek','IEEE TPEL','vol. 37','https://doi.org/10.1109/test','1st Prize | Highlighted Paper','Verified CV annotation',{valueType:'IMAGE'},'',24,'PRIVATE NOTE','J24'];
const draft=[...row];draft[0]='작성 중';
const patent=[...row];patent[1]='특허';patent[2]='';patent[10]='';
const parsed=context.pubParse_([headers,row,draft,patent]);
assert.equal(parsed.length,1,'Patents must not be included in the public feed');assert.equal(imageReads,1,'Draft images must not be read');
assert.equal(parsed[0].badges.length,2);assert.ok(!JSON.stringify(parsed).includes('PRIVATE NOTE'));
assert.equal(parsed[0].title,row[3]);
assert.equal(parsed[0].details,undefined);assert.equal(parsed[0].recognition,undefined);assert.equal(parsed[0].imageAlt,undefined);
const removed=[6,9,11],compactHeaders=headers.filter((_,i)=>!removed.includes(i));
const compactRow=row.filter((_,i)=>!removed.includes(i));
assert.equal(context.pubParse_([compactHeaders,compactRow])[0].id,'J24','Column removal must preserve IDs and images');
assert.equal(context.pubHttpUrl_('javascript:alert(1)'), '');assert.equal(context.pubHttpUrl_('https://good.test/" onerror="x'), '');
assert.throws(()=>context.pubParse_([['wrong']]));
assert.equal(model.safeLink('javascript:alert(1)'), '');assert.equal(model.safeImage('data:image/svg+xml,<svg/>'),'');
const items=JSON.parse(JSON.stringify(parsed));
assert.equal(model.filterItems(items,'저널','2022','baek',true).length,1);
assert.equal(model.filterItems(items,'학회','','',false).length,0);
assert.equal(model.filterItems(items,'특허','','',false).length,0);
const monthly=[{...items[0],kind:'학회',year:'2026',id:'C44',order:202605},{...items[0],kind:'학회',year:'2026',id:'C41',order:202610}];
assert.equal(model.filterItems(monthly,'학회','','',false)[0].id,'C41','Month order takes precedence over citation ID');
const numbered=model.numberPublications(monthly);
assert.deepEqual(numbered.map(p=>[p.id,p.displayId]),[['C41','C2'],['C44','C1']]);
const mixed=model.numberPublications([
  {...items[0],id:'J24',year:'2022',order:202206,venue:'A'},
  {...items[0],id:'J23',year:'2022',order:202208,venue:'B'},
  {...items[0],id:'J1',year:'2015',order:201509,venue:'A'},
  ...monthly
]);
assert.deepEqual(mixed.filter(p=>p.kind==='저널').map(p=>[p.id,p.displayId]),[['J23','J3'],['J24','J2'],['J1','J1']]);
assert.deepEqual(model.filterItems(mixed,'저널','','',false,'A').map(p=>p.displayId),['J2','J1'],'Venue filtering must not renumber cards');
assert.equal(model.filterItems(mixed,'저널','2015','',false)[0].displayId,'J1');
assert.equal(monthly[0].displayId,undefined,'Do not overwrite source records');
assert.equal(model.filterItems(items,'저널','archive','',false).length,0);
assert.equal(model.filterItems([{...items[0],year:'2021'}],'저널','archive','',false).length,1);
assert.equal(model.filterItems([{...items[0],year:'2014'}],'저널','archive','',false).length,0);
assert.equal(model.venueGroup('IEEE Applied Power Electronics Conference and Exposition (APEC)'),'APEC');
assert.equal(model.venueGroup('IEEE International Conference on Power Electronics and ECCE Asia (ECCE-Asia)'),'ECCE-Asia');
assert.equal(model.filterItems(items,'저널','','',false,'Wrong venue').length,0);
assert.deepEqual(model.YEAR_OPTIONS.map(x=>x[1]),['All years','2026','2025','2024','2023','2022','2015–2021']);
const members=new Set(['Jaeil Baek','Chaeyoung Moon','Doyeon Eom','Hoonjoon Lee'].map(model.authorKey));
assert(model.isLabAuthor('Chaeyoung Moon*',members));assert(model.isLabAuthor('Doyeon Eom',members));
assert(!model.isLabAuthor('Other Moon',members));assert(!model.isLabAuthor('J. Lee',members));
const normalized=source.replace(/\r\n/g,'\n').trim();let hash=0;for(let i=0;i<normalized.length;i++)hash=(Math.imul(hash,31)+normalized.charCodeAt(i))>>>0;
console.log(JSON.stringify({tests:'passed',backendLength:normalized.length,backendHash:hash}));
