(function(root){
  'use strict';
  const CACHE='ipc-publication-images-v1',TTL=300000;
  const validImage=value=>/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(value||'');
  function createImageLoader(feed,options={}){
    const request=options.fetch||root.fetch.bind(root),now=options.now||Date.now;
    let storage;
    try{storage=options.storage===undefined?root.caches:options.storage;}catch(error){/* Storage can be blocked in an iframe. */}
    const base=options.base||root.location.href;
    const memory=new Map(),pending=new Map(),freshKeys=new Set();
    let generation=0;
    const cacheURL=key=>new URL('./.image-cache/'+key,base).href;
    const fresh=record=>record && validImage(record.image) && Number(record.expiresAt)>now();
    async function load(ref){
      if(!Number.isInteger(ref.row)||ref.row<2||!/^[a-f0-9]{64}$/.test(ref.key))throw new Error('Invalid image reference');
      const key=ref.key,epoch=generation;
      if(fresh(memory.get(key)))return memory.get(key).image;
      if(pending.has(key))return pending.get(key);
      const work=(async()=>{
        const force=freshKeys.has(key);
        if(!force){
          try {
            const hit=await (await storage.open(CACHE)).match(cacheURL(key));
            const record=hit && await hit.json();
            if(fresh(record)){if(epoch===generation)memory.set(key,record);return record.image;}
          }catch(error){/* Browser storage is optional, including in embedded pages. */}
        }
        const url=new URL(feed);url.searchParams.set('imageRow',ref.row);url.searchParams.set('key',key);
        if(force)url.searchParams.set('fresh','1');
        url.searchParams.set('_',now());
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
        let record;
        try {
          const response=await request(url.href,{cache:'no-store',signal:controller.signal});
          if(!response.ok)throw new Error('Image request failed');
          record=await response.json();
          if(record.error||!validImage(record.image))throw new Error('Image unavailable');
          record.expiresAt=Math.min(Number(record.expiresAt)||now(),now()+TTL);
        }finally{clearTimeout(timer);}
        if(epoch===generation){
          memory.set(key,record);freshKeys.delete(key);
          if(memory.size>100)memory.delete(memory.keys().next().value);
          try {
            const cache=await storage.open(CACHE);
            await cache.put(cacheURL(key),new Response(JSON.stringify(record),{headers:{'Content-Type':'application/json'}}));
            const keys=await cache.keys();
            await Promise.all(keys.slice(0,Math.max(0,keys.length-100)).map(k=>cache.delete(k)));
          }catch(error){/* A quota or privacy setting must not hide a loaded image. */}
        }
        return record.image;
      })();
      pending.set(key,work);
      try{return await work;}finally{if(pending.get(key)===work)pending.delete(key);}
    }
    function invalidate(refs){
      generation++;memory.clear();pending.clear();
      refs.forEach(ref=>{if(ref.imageKey)freshKeys.add(ref.imageKey);});
    }
    return {load,invalidate};
  }
  if(typeof module==='object' && module.exports)module.exports={createImageLoader};
  else root.PublicationImages={createImageLoader};
})(typeof globalThis==='object'?globalThis:this);
