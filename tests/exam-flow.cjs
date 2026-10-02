/* DOM integration test: real handlers + IndexedDB implementation, no live data.
 * EXAM_PACK_DIR optionally validates private packs without checking them in. */
const {JSDOM,VirtualConsole}=require('jsdom'),{indexedDB}=require('fake-indexeddb');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<400;i++){if(fn())return;await sleep(25);}throw Error('Timed out: '+label);}
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`,errors=[];let dom;
 async function boot(){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented|HTMLMediaElement/.test(e.message))errors.push(e.message);});
  const d=await JSDOM.fromURL(url,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.indexedDB=indexedDB;w.fetch=(u,o)=>fetch(new URL(u,url),o);w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};}});
  await until(()=>d.window.HanaStudio?.ready()&&d.window.HanaExams,'boot');return d;
 }
 try{
  dom=await boot();let w=dom.window,$=id=>w.document.getElementById(id);
  $('openExamLibrary').click();
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
  const fixture={format:'hana-exam-pack',version:1,id:'test',title:'Test only',notes:['Original fixture note'],papers:[{id:'paper',title:'Fixture paper',year:3,pages:[{image},{image,answerKey:true}]}],questions:[{id:'fixture-q',paper:'paper',number:'1',page:1,skill:'p3-addsub',tier:1,qtext:'Find 14 + 23.',answer:37,kind:'key',help:'Add tens and ones.',solution:'10 + 20 + 4 + 3 = 37.'}]};
  async function upload(objects){Object.defineProperty($('examFiles'),'files',{configurable:true,value:objects.map(([name,text])=>({name,size:Buffer.byteLength(text),text:async()=>text}))});await $('examFiles').onchange({target:$('examFiles')});}
  await until(()=>!$('examFiles').disabled,'storage ready');
  await upload([['test.json',JSON.stringify(fixture)]]);assert.match($('examStatus').textContent,/Ready: 1 verified/);assert.match($('examList').textContent,/Original fixture note/);
  $('examList').querySelector('[data-paper]').click();assert.match($('examReader').textContent,/Original page 1/);assert.equal($('examNext').disabled,true);
  $('examKeys').click();assert.match($('examReader').textContent,/Original page 2/);$('examKeys').click();assert.match($('examReader').textContent,/Original page 1/);
  await upload([['bad.json','{}']]);assert.match($('examStatus').textContent,/Import stopped/);assert.match($('examList').textContent,/Fixture paper/);
  $('closeExamLibrary').click();$('startExamPractice').click();
  for(let i=0;i<10&&w.document.getElementById('scr-lesson').classList.contains('on');i++){
   if($('lessonChoices').children.length&&!$('lessonFeedback').textContent){const skill=w.HanaStudio.getSession().lesson.skill,d=w.HanaLessons.get(skill);$('lessonChoices').children[d.check.options.indexOf(d.check.answer)].click();}else $('lessonNext').click();
  }
  assert.match($('qtext').textContent,/14 \+ 23/);assert.match($('practicePhase').textContent,/Fixture paper/);
  $('typedAnswer').value='36';$('answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(w.HanaStudio.getSession().current.tries,1);
  $('typedAnswer').value='37';$('answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(w.HanaStudio.getSession().current.done,true);
  const e=w.HanaStudio.getLearning().events.at(-1);assert.equal(e.sourceId,'fixture-q');assert.equal(e.independent,false);assert.equal(e.attempts.length,2);
  assert.equal(w.HanaReview.build(w.HanaStudio.getLearning(),w.HanaCurriculum.skills).learning.events.at(-1).sourcePaper,'Fixture paper');
  $('nextQuestion').click();assert.notEqual(w.HanaStudio.getSession().current.spec.sourceId,'fixture-q','same paper item is not reused inside the session');
  w.HanaStudio.pause();dom.window.close();dom=await boot();w=dom.window;$=id=>w.document.getElementById(id);
  await until(()=>$('examList').textContent.includes('Fixture paper'),'pack survives reload');
  if(process.env.EXAM_PACK_DIR){
   $('openExamLibrary').click();const files=fs.readdirSync(process.env.EXAM_PACK_DIR).filter(f=>f.endsWith('.json'));
   await upload(files.map(f=>[f,fs.readFileSync(path.join(process.env.EXAM_PACK_DIR,f),'utf8')]));assert.match($('examStatus').textContent,/Ready: 61 verified/);
   for(const b of $('examList').querySelectorAll('[data-paper]')){b.click();assert.ok($('examReader').querySelector('img').src.startsWith('data:image/png;base64,'));}
   assert.equal($('examList').querySelectorAll('[data-paper]').length,16);
   console.log('All 15 private source papers and 60 questions imported through the app handler.');
  }
  assert.deepEqual(errors,[]);console.log('EXAM FLOW PASSED: import, keys, rejection, answers, support, export, repeat prevention and persistent storage.');
 }finally{dom?.window.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
