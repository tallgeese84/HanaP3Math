'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const Core=require('../nightly-priority-core.js'),Curriculum=require('../curriculum.js');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const original=read('tools/hana-drive-mirror.gs'),reader=read('tools/hana-nightly-reader.gs');
const anchor="    if (!secret || secret.length < 24 || input.secret !== secret) return reply_('unauthorized');";
const dispatch="    if (input.action === 'readHanaNextSession') return hanaNightlyRequest_(props, input);";
assert.equal(original.split(anchor).length,2,'Expected exactly one original secret guard');
const patched=original.replace(anchor,anchor+'\n'+dispatch)+'\n'+reader;
const NOW=Date.parse('2026-10-08T12:00:00Z'),SECRET='synthetic-hana-secret-at-least-24-characters',clone=x=>JSON.parse(JSON.stringify(x));
const plan=()=>({schema:1,id:'hana-nightly-2026-10-08',revision:1,student:'Hana',timeZone:'America/Chicago',reviewedDate:'2026-10-07',sessionDate:'2026-10-08',generatedAt:'2026-10-08T05:10:00Z',sourceExportedAt:'2026-10-08T01:00:00Z',subjects:{maths:{focus:'Explore number patterns.',skills:['p3-patterns']}}});
const backup=(at=NOW-1000)=>({app:'Hana learning',schemaVersion:1,exportedAt:at,learning:{events:[{id:'synthetic-question',correct:false,help:true}],checks:[]},skills:[],next:[],periods:{},unknownLegacyField:'preserve existing upload envelope'});
function env(source=patched,options={}) {
  const values={MIRROR_SECRET:SECRET,MIRROR_FOLDER_ID:'fixture-hana-folder',HANA_NIGHTLY_PLAN_DOC_ID:'fixture-hana-plan',...options.props};
  const files=new Map(Object.entries(options.files||{}).map(([k,v])=>[k,typeof v==='string'?v:JSON.stringify(v,null,2)]));
  const writes=[],calls=[],logs=[];let held=false;
  const props={getProperty:k=>values[k]??null,setProperty:(k,v)=>{writes.push(['property',k,v]);values[k]=v;}};
  const iterator=arr=>{let i=0;return{hasNext:()=>i<arr.length,next:()=>{assert(i<arr.length);return arr[i++];}};};
  const file=name=>({getBlob:()=>({getDataAsString:()=>files.get(name)}),setContent:content=>{writes.push(['file',name,content]);files.set(name,content);}});
  class FixedDate extends Date{constructor(...args){super(...(args.length?args:[NOW]));}static now(){return NOW;}}
  const context=vm.createContext({Date:FixedDate,console:{log:s=>logs.push(s)},PropertiesService:{getScriptProperties:()=>props},
    LockService:{getScriptLock:()=>{calls.push('getLock');return{waitLock:()=>{calls.push('waitLock');if(options.busy)throw Error('Busy');held=true;},hasLock:()=>held,releaseLock:()=>{calls.push('releaseLock');held=false;}};}},
    MimeType:{PLAIN_TEXT:'text',GOOGLE_DOCS:'document'},
    DriveApp:{Access:{PRIVATE:'PRIVATE'},getFolderById:id=>{calls.push('folder:'+id);if(id!=='fixture-hana-folder'||options.folderError)throw Error('Wrong folder');return{
      getFilesByName:name=>{calls.push('file:'+name);return iterator(files.has(name)?[file(name)]:[]);},
      createFile:(name,content)=>{writes.push(['create',name,content]);files.set(name,content);return file(name);}};},
      getFileById:id=>{calls.push('planfile:'+id);if(id!=='fixture-hana-plan'||options.fileError)throw Error('No document');return{
        isTrashed:()=>!!options.trashed,getMimeType:()=>options.mime||'document',getSharingAccess:()=>options.sharing||'PRIVATE'};}},
    DocumentApp:{openById:id=>{calls.push('document:'+id);if(options.docsError)throw Error('Denied');return{getBody:()=>({getText:()=>options.text===undefined?JSON.stringify(plan()):options.text})};}},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({getContent:()=>text,setMimeType:()=>({getContent:()=>text})})}
  });
  vm.runInContext(source,context,{timeout:1000});
  return {context,values,files,writes,calls,logs,request:body=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(body)}}).getContent()),
    raw:text=>JSON.parse(context.doPost({postData:{contents:text}}).getContent()),
    snapshot:()=>({values:clone(values),files:Object.fromEntries([...files].sort()),writes:clone(writes),calls:[...calls]})};
}
const upload=(e,b=backup())=>e.request({secret:SECRET,backup:b});
const getPlan=(e,extra={})=>e.request({action:'readHanaNextSession',secret:SECRET,...extra});

test('standalone upload source stays pinned; integration adds exactly one dispatch line and no replacement handler',()=>{
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'cc2b698b3b65c91aa51f8764e296d4a412a4153787c2eeb87120fc79776293c2');
  assert.equal(patched.slice(0,-reader.length-1).replace('\n'+dispatch,''),original);
  assert(!/function\s+(doPost|doGet|initialiseHanaMirror)\s*\(/.test(reader));
});
for(const [name,options,body] of [
  ['first upload',{},backup()],
  ['older export',{props:{LAST_EXPORT_AT:String(NOW)}},backup(NOW-2000)],
  ['equal export',{props:{LAST_EXPORT_AT:String(NOW-1000)}},backup()],
  ['newer export',{props:{LAST_EXPORT_AT:String(NOW-2000)}},backup()],
  ['daily UTC name near Chicago midnight',{},backup(Date.parse('2026-10-08T00:15:00Z'))],
  ['retained earlier daily snapshots',{files:{'hana-learning-2026-10-06.json':backup(NOW-2*86400000),'hana-learning-2026-10-07.json':backup(NOW-86400000)}},backup()],
  ['busy lock',{busy:true},backup()],
  ['missing folder',{folderError:true},backup()],
  ['invalid future export',{},backup(NOW+300001)],
  ['another child',{}, {...backup(),app:'PokéMath learning'}]
])test('existing Hana upload behavior is identical: '+name,()=>{
  const before=env(original,options),after=env(patched,options);
  assert.deepEqual(upload(after,body),upload(before,body));
  assert.deepEqual(after.snapshot(),before.snapshot());
  if(name==='daily UTC name near Chicago midnight')assert(after.files.has('hana-learning-2026-10-08.json'));
});
test('a plan read returns the h20 protocol without upload lock, folder reads or writes',()=>{
  const e=env(),before=clone(e.values),r=getPlan(e);
  assert.deepEqual(r,{service:'family-learning-mirror',planApi:1,student:'Hana',ok:true,plan:plan()});
  assert.deepEqual(Core.validate(r.plan,'Hana',{maths:id=>Curriculum.skills.some(s=>s.id===id&&!s.manual)},NOW),plan());
  assert.equal(e.writes.length,0);assert.deepEqual(e.values,before);
  assert.deepEqual(e.calls,['getLock','planfile:fixture-hana-plan','document:fixture-hana-plan']);
});
test('the real h20 receiver can fetch and adopt a plan served by the patched standalone relay',async()=>{
  const e=env(),cache=new Map();
  const client=Core.create({student:'Hana',catalog:{maths:id=>Curriculum.skills.some(s=>s.id===id&&!s.manual)},
    config:()=>({url:'https://script.google.com/macros/s/SYNTHETIC/exec',secret:SECRET}),
    storage:{getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)},key:'synthetic-test',now:()=>NOW,online:()=>true,
    hash:async s=>crypto.createHash('sha256').update(s).digest('hex'),
    request:async(_url,opts)=>({ok:true,type:'cors',text:async()=>JSON.stringify(e.request(JSON.parse(opts.body)))})});
  await client.initialize();assert.equal(await client.refresh(true),true);
  assert.equal(client.report().received.planId,plan().id);assert.equal(client.plan(),null);
  assert.equal(client.adopt().id,plan().id);assert.equal(e.writes.length,0);
  const b=backup();b.learning.nightlyPlanReview=client.report();assert.equal(upload(e,b).status,'saved');
  assert.deepEqual(JSON.parse(e.files.get('hana-learning-latest.json')).learning.nightlyPlanReview,b.learning.nightlyPlanReview);
});
for(const text of ['','  ','null'])test('empty private plan is successful and read-only: '+JSON.stringify(text),()=>{
  const e=env(patched,{text});assert.deepEqual(getPlan(e).plan,null);assert.equal(getPlan(e).ok,true);assert.equal(e.writes.length,0);
});
for(const [name,options] of Object.entries({missing:{props:{HANA_NIGHTLY_PLAN_DOC_ID:''}},crossedId:{props:{HANA_NIGHTLY_PLAN_DOC_ID:'fixture-euna-plan'}},
  public:{sharing:'ANYONE'},trashed:{trashed:true},wrongMime:{mime:'text'},denied:{docsError:true},malformed:{text:'{'},oversize:{text:'x'.repeat(20001)}}))
test('failed '+name+' plan read cannot change history or prevent a later ordinary upload',()=>{
  const e=env(patched,options),before=clone(e.values);assert.equal(getPlan(e).ok,false);assert.equal(e.writes.length,0);assert.deepEqual(e.values,before);
  assert.equal(upload(e).status,'saved');
});
for(const [name,mutate] of Object.entries({wrongChild:p=>p.student='Jonah',script:p=>p.script='x',html:p=>p.subjects.maths.focus='<b>x</b>',
  extraSubject:p=>p.subjects.reading={},invalidDay:p=>p.sessionDate='2026-02-30',sameDay:p=>p.reviewedDate=p.sessionDate,
  duplicate:p=>p.subjects.maths.skills.push('p3-patterns'),tooMany:p=>p.subjects.maths.skills=['a','b','c','d'],missingMaths:p=>delete p.subjects.maths,
  laterSource:p=>p.sourceExportedAt='2026-10-09T00:00:00Z'}))test('reject unsafe priority plan: '+name,()=>{
  const p=plan();mutate(p);const e=env(patched,{text:JSON.stringify(p)});assert.equal(getPlan(e).ok,false);assert.equal(e.writes.length,0);
});
for(const extra of [{secret:'wrong'},{backup:backup()},{student:'Euna'},{docId:'fixture-euna-plan'}])test('invalid read request never reads a document or writes a backup: '+Object.keys(extra)[0],()=>{
  const e=env();const r=getPlan(e,extra);assert(r.ok===false||r.status==='unauthorized');assert.equal(e.writes.length,0);assert.deepEqual(e.calls,['getLock']);
});
test('plan reads remain available while an unrelated upload owns the lock',()=>{
  const e=env(patched,{busy:true});assert.equal(getPlan(e).ok,true);assert.equal(e.writes.length,0);assert(!e.calls.includes('waitLock'));
});
test('interleaved real-protocol reads preserve the original multi-day upload results and timestamp ordering',()=>{
  const a=env(original),b=env();
  for(const at of [NOW-2*86400000,NOW-86400000,NOW-1000,NOW-86400000]){
    assert(getPlan(b).ok);assert.deepEqual(upload(b,backup(at)),upload(a,backup(at)));
  }
  assert.deepEqual(Object.fromEntries(b.files),Object.fromEntries(a.files));assert.deepEqual(b.values,a.values);assert.deepEqual(b.writes,a.writes);
  assert.equal(b.files.size,4);
});
test('owner check distinguishes empty plan from error, preserves marker and files, and omits private data',()=>{
  const e=env(patched,{text:'null',props:{LAST_EXPORT_AT:String(NOW-1000)},files:{'hana-learning-latest.json':backup()}}),before=clone(e.values);
  const r=clone(e.context.checkHanaNightlyReadOnly());assert.equal(r.planReadOk,true);assert.equal(r.planState,'empty');assert.equal(r.deploymentVerified,false);
  assert.equal(r.uploadMarkerPresent,true);assert.match(r.upload,/recognised/);assert.equal(e.writes.length,0);assert.deepEqual(e.values,before);
  const log=e.logs.join('');for(const privateValue of [SECRET,'fixture-hana-folder','fixture-hana-plan','synthetic-question'])assert(!log.includes(privateValue));
  const failed=env(patched,{docsError:true});assert.equal(failed.context.checkHanaNightlyReadOnly().planState,'unavailable');assert.equal(failed.writes.length,0);
});
test('missing latest file never causes the diagnostic to reset an existing export timestamp',()=>{
  const e=env(patched,{props:{LAST_EXPORT_AT:String(NOW)}});const r=e.context.checkHanaNightlyReadOnly();assert.match(r.upload,/No latest/);
  assert.equal(e.values.LAST_EXPORT_AT,String(NOW));assert.equal(e.writes.length,0);
});
