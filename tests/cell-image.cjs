const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const calls=[],warnings=[];
let mime='image/png',status=200;
const context=vm.createContext({
  SpreadsheetApp:{ValueType:{IMAGE:'IMAGE'}},
  ScriptApp:{getOAuthToken:()=> 'test-token'},
  UrlFetchApp:{fetch:(url,options)=>{
    calls.push({url,options});
    return {getResponseCode:()=>url.startsWith('https://docs.google.com/') && !options.headers?403:status,
      getBlob:()=>({getContentType:()=>mime}),getContent:()=>[137,80,78,71]};
  }},
  Utilities:{base64Encode:bytes=>Buffer.from(bytes).toString('base64')},
  console:{warn:message=>warnings.push(message)},text_:value=>String(value||'').trim()
});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../tools/publications-sheet/Cell-image.gs'),'utf8'),context);
const image=url=>({valueType:'IMAGE',getContentUrl:()=>url,getAltTextDescription:()=>'',getAltTextTitle:()=>''});
assert(context.cellImage_(image('https://docs.google.com/image'),'', 'Paper').src.startsWith('data:image/png;base64,'));
assert.equal(calls.at(-1).options.headers.Authorization,'Bearer test-token');
context.cellImage_(image('https://lh3.googleusercontent.com/image'),'','Paper');
assert.equal(calls.at(-1).options.headers.Authorization,'Bearer test-token');
context.cellImage_(image('https://docs.google.com.attacker.test/image'),'','Paper');
assert.equal(calls.at(-1).options.headers,undefined,'Do not send the token to lookalike or external hosts');
status=403;assert.equal(context.cellImage_(image('https://docs.google.com/image'),'','Paper'),null);
assert(warnings.at(-1).includes('HTTP 403'));
status=200;mime='text/html';assert.equal(context.cellImage_(image('https://docs.google.com/image'),'','Paper'),null);
assert(warnings.at(-1).includes('unsupported content type'));
assert.equal(context.cellImage_(null,'','Paper'),null);
console.log('Authenticated cell-image checks passed');
