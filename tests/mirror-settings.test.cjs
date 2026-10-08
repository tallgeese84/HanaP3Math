const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(require('node:path').join(__dirname,'../drive-mirror.js'),'utf8');
const url='https://script.google.com/macros/s/TEST_ONLY/exec',secret='synthetic-test-secret-at-least-24-characters';
function page(t,{saved={},draft={},blocked=false}={}){
 const dom=new JSDOM('<input id="mirrorURL"><input id="mirrorSecret" type="password"><p id="mirrorStatus"></p><button id="saveMirror"></button><button id="reuseFamilyMirror"></button><button id="clearMirror"></button>',{url:'https://family.example/HanaP3Math/',runScripts:'outside-only'});
 t.after(()=>dom.window.close());const w=dom.window,$=id=>w.document.getElementById(id),requests=[];
 for(const [k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
 for(const [k,v]of Object.entries(draft))w.sessionStorage.setItem(k,v);
 if(blocked)Object.defineProperty(w,'sessionStorage',{get(){throw Error('Unavailable');}});
 w.hanaBoot=new Promise(()=>{});w.HanaProgress={snapshot:()=>({app:'Hana learning',learning:{events:[]}})};
 w.AbortController=AbortController;w.fetch=async(u,o)=>{requests.push({url:u,body:JSON.parse(o.body)});return {type:'opaque'};};
 w.eval(source);w.HanaMirror.showSettings();
 const type=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 return {w,$,requests,type};
}
test('progress refresh and upload completion preserve unfinished connection fields',async t=>{
 const saved={hq_review_mirror_v1:JSON.stringify({url,secret}),hq_learning:'keep-progress',mochi_drive_mirror_secret_v1:'keep-euna'};
 const p=page(t,{saved});p.$('saveMirror').click();
 const edited=url.replace('TEST_ONLY','ANOTHER_TEST');p.type('mirrorURL',edited);p.type('mirrorSecret','unfinished');
 p.w.HanaMirror.showSettings();await new Promise(r=>setImmediate(r));
 assert.equal(p.$('mirrorURL').value,edited);assert.equal(p.$('mirrorSecret').value,'unfinished');
 assert.equal(p.w.localStorage.getItem('hq_review_mirror_v1'),saved.hq_review_mirror_v1);
 assert.equal(p.requests.length,1);assert.equal(p.requests[0].url,url);
 assert.equal(p.w.localStorage.getItem('hq_learning'),'keep-progress');assert.equal(p.w.localStorage.getItem('mochi_drive_mirror_secret_v1'),'keep-euna');
});
test('unfinished URL survives a tab reload without saving or sending an unfinished secret',t=>{
 const first=page(t);first.type('mirrorURL',url);first.type('mirrorSecret',secret);
 first.w.HanaMirror.showSettings();assert.equal(first.$('mirrorURL').value,url);
 const draft=Object.fromEntries(Object.entries(first.w.sessionStorage));
 assert.ok(!JSON.stringify(draft).includes(secret));assert.equal(first.w.localStorage.length,0);assert.equal(first.requests.length,0);
 const reloaded=page(t,{draft});assert.equal(reloaded.$('mirrorURL').value,url);assert.equal(reloaded.$('mirrorSecret').value,'');assert.equal(reloaded.requests.length,0);
});
test('successful save and explicit disconnect clear the URL draft only',async t=>{
 const p=page(t);p.type('mirrorURL',url);p.type('mirrorSecret','short');p.$('saveMirror').click();
 assert.equal(p.w.localStorage.length,0);assert.equal(p.requests.length,0);assert.ok(p.w.sessionStorage.length);
 p.type('mirrorSecret',secret);p.$('saveMirror').click();await new Promise(r=>setImmediate(r));
 assert.deepEqual(JSON.parse(p.w.localStorage.getItem('hq_review_mirror_v1')),{url,secret});assert.equal(p.w.sessionStorage.length,0);
 p.type('mirrorURL',url+'-draft');p.$('clearMirror').click();p.w.HanaMirror.showSettings();
 assert.equal(p.$('mirrorURL').value,'');assert.equal(p.$('mirrorSecret').value,'');assert.equal(p.w.sessionStorage.length,0);assert.equal(p.w.localStorage.getItem('hq_review_mirror_v1'),null);
});
test('blocked session storage does not erase edits or prevent an explicit save',async t=>{
 const p=page(t,{blocked:true});p.type('mirrorURL',url);p.type('mirrorSecret',secret);p.w.HanaMirror.showSettings();
 assert.equal(p.$('mirrorURL').value,url);assert.equal(p.$('mirrorSecret').value,secret);p.$('saveMirror').click();await new Promise(r=>setImmediate(r));assert.equal(p.requests.length,1);
});
