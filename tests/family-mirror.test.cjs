const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../curriculum.js'),R=require('../learning-review.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const secret='unit-test-secret-never-used-in-production',url='https://script.google.com/macros/s/UNIT_TEST_ONLY/exec';
function relay(properties={}){
 const files=new Map(),access=[],props={MIRROR_SECRET:secret,MIRROR_FOLDER_ID:'family',...properties};let released=0;
 const file=key=>({setContent:text=>files.set(key,text),getBlob:()=>({getDataAsString:()=>files.get(key)})});
 const ctx={PropertiesService:{getScriptProperties:()=>({getProperty:key=>props[key]})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released++})},DriveApp:{getFolderById:id=>{access.push(id);return {getFilesByName:name=>{const key=id+'/'+name;return {hasNext:()=>files.has(key),next:()=>file(key)};},createFile:(name,text)=>files.set(id+'/'+name,text)};}},MimeType:{PLAIN_TEXT:'text/plain'},ContentService:{MimeType:{JSON:'application/json'},createTextOutput:text=>({setMimeType:()=>text})},Utilities:{formatDate:date=>date.toISOString().slice(0,10)}};
 vm.createContext(ctx);vm.runInContext(read('tools/family-drive-mirror.gs'),ctx);
 return {ctx,files,access,get released(){return released;},post:(backup,key=secret)=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify({secret:key,backup})}}))};
}
const hana=at=>R.build({events:[{id:'hana-answer',skill:'p3-place',at,correct:true,tier:1,year:3}],checks:[]},C.skills,{now:at,timeZone:'America/Chicago'});
const jonah=(at,id,rev)=>({app:'PokéMath learning',version:1,build:66,exportedAt:new Date(at).toISOString(),sessions:{[id]:{id,rev,days:{},questions:{q:{correct:true}}}}});
test('one family endpoint keeps all three report schemas and filenames separate',()=>{
 const r=relay(),now=Date.now(),euna={app:'Mochi learning',version:1,exported:new Date(now).toISOString(),science:{kept:true}};
 assert.equal(r.post(euna).ok,true);assert.equal(r.post(jonah(now,'jonah-session',2)).ok,true);assert.equal(r.post(hana(now)).ok,true);
 assert.deepEqual(JSON.parse(r.files.get('family/euna-mochi-latest.json')),euna);
 const h=JSON.parse(r.files.get('family/hana-learning-latest.json'));
 assert.equal(h.app,'Hana learning');assert.equal(h.learning.events[0].id,'hana-answer');assert.ok(h.receivedAt);assert.equal(h.learning.checks.length,0);
 assert.equal(JSON.parse(r.files.get('family/jonah-pokemath-latest.json')).sessions['jonah-session'].rev,2);
 assert.equal(r.files.size,6);assert.equal(r.released,3);
 const health=JSON.parse(r.ctx.doGet());assert.deepEqual(health.apps,['Mochi learning','PokéMath learning','Hana learning']);assert.equal(health.writeOnly,true);assert.ok(!JSON.stringify(health).includes(secret));
});
test('authentication and invalid Hana payloads cannot write to Drive',()=>{
 const r=relay(),b=hana(Date.now());
 for(const invalid of [{...b,schemaVersion:2},{...b,exportedAt:Date.now()+600000},{...b,learning:{events:[]}},{...b,app:'unknown'}])assert.equal(r.post(invalid).ok,false);
 assert.equal(r.post(b,'wrong-secret').ok,false);assert.equal(r.files.size,0);assert.equal(r.access.length,0);
});
test('Hana rejects older exports and preserves files with an unexpected schema',()=>{
 const r=relay(),now=Date.now();assert.equal(r.post(hana(now)).ok,true);const before=r.files.get('family/hana-learning-latest.json');
 assert.equal(r.post(hana(now-1000)).status,'older snapshot skipped');assert.equal(r.files.get('family/hana-learning-latest.json'),before);
 r.files.set('family/hana-learning-latest.json',JSON.stringify({app:'Mochi learning',exportedAt:0}));assert.equal(r.post(hana(now+1)).ok,false);assert.equal(JSON.parse(r.files.get('family/hana-learning-latest.json')).app,'Mochi learning');
});
test('Hana optional folder and envelope allowlist do not affect other children',()=>{
 const r=relay({HANA_FOLDER_ID:'hana-private'}),b=hana(Date.now());b.secret='must-not-export';b.connection={url:'must-not-export'};
 assert.equal(r.post(b).ok,true);assert.ok(!r.files.get('hana-private/hana-learning-latest.json').includes('must-not-export'));
 assert.equal(r.post(jonah(Date.now(),'jonah-session',1)).ok,true);assert.ok(r.files.has('family/jonah-pokemath-latest.json'));
});
test('Jonah still merges concurrent and late device sessions by revision',()=>{
 const r=relay(),now=Date.now();r.post(jonah(now,'a',3));r.post(jonah(now-5000,'b',2));r.post(jonah(now-10000,'a',1));
 const b=JSON.parse(r.files.get('family/jonah-pokemath-latest.json'));assert.equal(b.sessions.a.rev,3);assert.equal(b.sessions.b.rev,2);assert.equal(b.exportedAt,new Date(now).toISOString());
});
function client(initial={}){
 const values=new Map(Object.entries(initial)),elements={},requests=[];
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const ctx={document:{getElementById:id=>elements[id]??=( {value:'',textContent:''} )},localStorage:storage,navigator:{onLine:true},window:{addEventListener(){}},HanaProgress:{snapshot:()=>hana(Date.now())},setTimeout:()=>1,clearTimeout(){},AbortController,fetch:async(u,o)=>{requests.push({url:u,body:JSON.parse(o.body)});return {};}};
 vm.createContext(ctx);vm.runInContext(read('drive-mirror.js'),ctx);
 return {values,elements,requests};
}
test('copying Euna settings only fills Hana fields; saving is the upload opt-in',async()=>{
 const c=client({mochi_drive_mirror_url_v1:url,mochi_drive_mirror_secret_v1:secret});c.elements.reuseFamilyMirror.onclick();
 assert.equal(c.elements.mirrorURL.value,url);assert.equal(c.elements.mirrorSecret.value,secret);assert.equal(c.requests.length,0);assert.equal(c.values.has('hq_review_mirror_v1'),false);
 c.elements.saveMirror.onclick();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(c.requests.length,1);assert.equal(c.requests[0].body.backup.app,'Hana learning');assert.ok(!JSON.stringify(c.requests[0].body.backup).includes(secret));assert.equal(c.values.get('mochi_drive_mirror_secret_v1'),secret);
 c.elements.clearMirror.onclick();assert.equal(c.values.has('hq_review_mirror_v1'),false);assert.equal(c.values.get('mochi_drive_mirror_url_v1'),url);
});
test('copying falls back to Jonah and leaves existing Hana config alone when unavailable',()=>{
 const config=JSON.stringify({url,secret,enabled:true}),c=client({pokemath_drive_mirror_v1:config});c.elements.reuseFamilyMirror.onclick();assert.equal(c.elements.mirrorURL.value,url);assert.equal(c.values.get('pokemath_drive_mirror_v1'),config);assert.equal(c.requests.length,0);
 const missing=client({hq_review_mirror_v1:config,pokemath_drive_mirror_v1:'malformed'});missing.elements.reuseFamilyMirror.onclick();assert.match(missing.elements.mirrorStatus.textContent,/No family connection/);assert.equal(missing.values.get('hq_review_mirror_v1'),config);assert.equal(missing.requests.length,0);
});
