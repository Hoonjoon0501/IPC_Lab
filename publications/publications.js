(function () {
  'use strict';
  const FEED = 'https://script.google.com/macros/s/AKfycbwNoBz6CV-hy7kZjFKRyhjerlrpG4nm5H89jLuc-ZBmju-F5C6c2HOVDi-XXwvABpcv/exec?type=publications';
  const TYPE_LABELS = {'저널':'Journal','학회':'Conference'};
  function safeLink(value) { try { const u=new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
  function safeImage(value) { return /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(value||'') ? value : (safeLink(value).startsWith('https://') ? safeLink(value) : ''); }
  const YEAR_OPTIONS = [['','All years'],...['2026','2025','2024','2023','2022'].map(y=>[y,y]),['archive','2015–2021']];
  function venueGroup(value) {
    if(/ECCE[ -]Asia/i.test(value))return 'ECCE-Asia';
    if(/Applied Power Electronics Conference|\bAPEC\b/i.test(value))return 'APEC';
    if(/Energy Conversion Congress|\bECCE\b/i.test(value))return 'ECCE';
    for(const name of ['COMPEL','OCP','ECTC'])if(value.includes(name))return name;
    if(/Transportation Electrification Conference/i.test(value))return 'ITEC';
    return value;
  }
  function authorKey(value){return value.replace(/\band\s+/gi,'').replace(/[.*†‡\s-]/g,'').toLowerCase();}
  const VERIFIED_ALIASES = ['J. Baek','Jaeil Baek','Jae-Il Baek','Chaeyoung Moon','C. Moon','C. Y. Moon','Doyeon Eom','D. Eom','D. Y. Eom'];
  function isLabAuthor(value, names){return names.has(authorKey(value));}
  function filterItems(items, type, year, query, highlighted, venue='') {
    const search=query.trim().toLowerCase();
    return items.filter(p=>p.kind===type && (!year || (year==='archive' ? +p.year>=2015 && +p.year<=2021 : String(p.year)===year)) && (!venue || venueGroup(p.venue)===venue) && (!highlighted || p.badges.length) && (!search || [p.title,p.authors,p.venue,...p.badges].join(' ').toLowerCase().includes(search)))
      .sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)||(Number(b.order)||0)-(Number(a.order)||0));
  }
  if(typeof module==='object' && module.exports){module.exports={safeLink,safeImage,filterItems,venueGroup,authorKey,isLabAuthor,YEAR_OPTIONS};return;}
  const $=id=>document.getElementById(id);
  let items=[],type='저널',year='',pending=false,lastContent='';
  const labAuthors=new Set(VERIFIED_ALIASES.map(authorKey));
  function element(tag, className, text) {const e=document.createElement(tag); if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
  function card(p) {
    const article=element('article','paper-card');
    const src=safeImage(p.image);
    if(src){article.classList.add('has-image');const figure=element('figure','paper-figure'),img=element('img');img.alt=p.title;img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{figure.remove();article.classList.remove('has-image');},{once:true});img.src=src;figure.append(img);article.append(figure);}
    const body=element('div','paper-content');if(p.id)body.append(element('div','paper-label',p.id));
    const heading=element('h3'),link=safeLink(p.link);
    if(link){const a=element('a','',p.title);a.href=link;a.target='_blank';a.rel='noopener noreferrer';heading.append(a);}else heading.textContent=p.title;
    body.append(heading);
    const authors=element('p','authors');
    p.authors.split(/(,\s*|;\s*|\s+and\s+)/).forEach(part=>{
      const lead=part.match(/^\s*and\s+/i)?.[0]||'';
      if(lead)authors.append(document.createTextNode(lead));
      const name=part.slice(lead.length);
      authors.append(isLabAuthor(name,labAuthors)?element('strong','',name):document.createTextNode(name));
    });body.append(authors,element('p','venue',p.venue));
    if(p.badges.length){const badges=element('div','badges');p.badges.forEach(b=>badges.append(element('span','badge'+(/highlight/i.test(b)?' highlight':''),b)));body.append(badges);}
    if(link){const actions=element('div','paper-actions'),a=element('a','paper-link','Paper link ↗');a.href=link;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','Open paper: '+p.title);actions.append(a);body.append(actions);}
    article.append(body);return article;
  }
  function renderYears(){
    $('years').replaceChildren();
    YEAR_OPTIONS.forEach(([value,label])=>{const button=element('button','',label);button.type='button';button.dataset.year=value;button.setAttribute('aria-pressed',String(value===year));$('years').append(button);});
  }
  function renderVenues(){
    $('venue-label').textContent=type==='학회'?'Conference':'Journal';
    const previous=$('venue').value,values=[...new Set(items.filter(p=>p.kind===type).map(p=>venueGroup(p.venue)).filter(Boolean))].sort();
    $('venue').replaceChildren();
    [['',type==='학회'?'All conferences':'All journals'],...values.map(v=>[v,v])].forEach(([value,label])=>{const option=element('option','',label);option.value=value;$('venue').append(option);});
    $('venue').value=values.includes(previous)?previous:'';
  }
  function render(){
    const selected=filterItems(items,type,year,$('search').value,$('highlights').checked,$('venue').value);
    document.querySelectorAll('[data-type]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.type===type));button.querySelector('span').textContent=items.filter(p=>p.kind===button.dataset.type).length;});
    $('result-count').textContent=selected.length+' '+(selected.length===1?'publication':'publications');
    const fragment=document.createDocumentFragment();let current=null,list=null;
    selected.forEach(p=>{const key=String(p.year||'');if(key!==current){current=key;const group=element('section','year-group');group.append(element('h2','',key));list=element('div','cards');group.append(list);fragment.append(group);}list.append(card(p));});
    if(!selected.length)fragment.append(element('p','empty','No publications match these filters.'));
    $('results').replaceChildren(fragment);$('results').setAttribute('aria-busy','false');
  }
  async function refresh(){
    if(pending)return;pending=true;$('refresh').disabled=true;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch(FEED+'&_='+Date.now(),{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('Request failed');const data=await response.json();
      if(data.error || !Array.isArray(data.publications))throw new Error('Feed unavailable');
      const signature=JSON.stringify(data.publications);
      if(signature!==lastContent){items=data.publications.filter(p=>TYPE_LABELS[p.kind] && typeof p.title==='string').map(p=>({...p,authors:String(p.authors||''),badges:Array.isArray(p.badges)?p.badges:[]}));lastContent=signature;renderYears();renderVenues();render();}
      $('connection').textContent='';$('updated').textContent='Updated '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    }catch(error){$('connection').textContent='Publications could not be refreshed. Please try Refresh.';$('results').setAttribute('aria-busy','false');if(!lastContent)$('result-count').textContent='Connection unavailable';}
    finally{clearTimeout(timer);pending=false;$('refresh').disabled=false;}
  }
  document.querySelector('.types').addEventListener('click',event=>{const b=event.target.closest('[data-type]');if(!b)return;type=b.dataset.type;year='';$('venue').value='';renderYears();renderVenues();render();});
  $('years').addEventListener('click',event=>{const b=event.target.closest('[data-year]');if(!b)return;year=b.dataset.year;renderYears();render();});
  $('search').addEventListener('input',render);$('highlights').addEventListener('change',render);$('venue').addEventListener('change',render);$('refresh').addEventListener('click',refresh);
  fetch('../members/researchers/',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error();return r.text();}).then(html=>{
    const roster=new DOMParser().parseFromString(html,'text/html');
    roster.querySelectorAll('.member-name').forEach(e=>labAuthors.add(authorKey(e.textContent.trim())));
    if(items.length)render();
  }).catch(()=>{});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(()=>{if(!document.hidden)refresh();},30000);refresh();
})();
