const assert=require('node:assert/strict');
const {createImageLoader}=require('../publications/publication-images.js');
async function main(){
  let clock=1000,calls=0,fail=false,source='data:image/png;base64,AAAA';
  const requests=[],entries=new Map();
  const storage={open:async()=>({
    match:async key=>entries.has(key)?new Response(entries.get(key)):undefined,
    put:async(key,response)=>entries.set(key,await response.text()),
    keys:async()=>[...entries.keys()],delete:async key=>entries.delete(key)
  })};
  const fetch=async url=>{
    calls++;requests.push(new URL(url));
    if(fail)throw new Error('Offline');
    return new Response(JSON.stringify({image:source,expiresAt:clock+300000,error:false}));
  };
  const options={fetch,storage,now:()=>clock,base:'https://example.test/publications/'};
  const feed='https://example.test/feed?type=publications&images=deferred';
  const ref={row:2,key:'a'.repeat(64)},loader=createImageLoader(feed,options);
  assert.deepEqual(await Promise.all([loader.load(ref),loader.load(ref)]),[source,source]);
  assert.equal(calls,1,'Concurrent requests for the same image must be deduplicated');
  await loader.load(ref);assert.equal(calls,1,'Filters must reuse the in-memory image');
  const reloaded=createImageLoader(feed,options);
  await reloaded.load(ref);assert.equal(calls,1,'A new page must reuse the persistent browser cache');
  clock+=300001;await reloaded.load(ref);assert.equal(calls,2,'Expired images must be refreshed');
  source='data:image/jpeg;base64,BBBB';
  reloaded.invalidate([{imageKey:ref.key}]);
  assert.equal(await reloaded.load(ref),source);assert.equal(calls,3);
  assert.equal(requests.at(-1).searchParams.get('fresh'),'1','Manual Refresh must bypass both cache layers');
  await reloaded.load(ref);assert.equal(calls,3);
  fail=true;clock+=300001;await assert.rejects(()=>reloaded.load(ref));
  fail=false;await reloaded.load(ref);assert.equal(calls,5,'Failed loads must remain retryable');
  const blocked=createImageLoader(feed,{...options,storage:{open:async()=>{throw new Error('Storage denied');}}});
  assert.equal(await blocked.load(ref),source);await blocked.load(ref);assert.equal(calls,6);
  await assert.rejects(()=>loader.load({...ref,key:'invalid'}));assert.equal(calls,6);
  assert.equal(requests[0].searchParams.get('imageRow'),'2');
  assert.equal(requests[0].searchParams.get('key'),ref.key);
  console.log('Publication image cache checks passed');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
