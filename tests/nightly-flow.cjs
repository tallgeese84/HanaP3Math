// UI flow test in jsdom (no browser download needed). Runs its own local server;
// APP_URL can optionally point to an already running preview.
const {JSDOM,VirtualConsole}=require('jsdom'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const Core=require('../nightly-priority-core.js');
const now=Date.now(),today=Core.day(now),previous=new Date(Date.parse(today+'T12:00:00Z')-86400000).toISOString().slice(0,10);
let remote={schema:1,id:'hana-nightly-'+today,revision:1,student:'Hana',timeZone:'America/Chicago',reviewedDate:previous,sessionDate:today,generatedAt:new Date(now).toISOString(),sourceExportedAt:new Date(now-60000).toISOString(),subjects:{maths:{focus:'Explore number patterns.',skills:['p3-patterns']}}};
const requests=[];
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
let BASE=process.env.APP_URL;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms=8000,label='condition'){const t=Date.now();while(Date.now()-t<ms){try{const v=fn();if(v)return v;}catch{}await sleep(25);}throw new Error('Timed out: '+label);}
(async()=>{
 if(!BASE){
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{
   const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
   if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');
   fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));BASE=`http://127.0.0.1:${server.address().port}/index.html`;
 }
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented|getContext|scrollTo|HTMLMediaElement/.test(e.message))errors.push(e.message);});vc.on('error',e=>errors.push(String(e)));
 const dom=await JSDOM.fromURL(BASE,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):k==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):typeof k==='string'?(()=>{}):undefined,set:()=>true});
  w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.TextEncoder=TextEncoder;w.AbortController=AbortController;Object.defineProperty(w.crypto,'subtle',{value:webcrypto.subtle});
  w.localStorage.setItem('hq_review_mirror_v1',JSON.stringify({url:'https://script.google.com/macros/s/SYNTHETIC/exec',secret:'synthetic-secret-at-least-24-characters'}));
  w.localStorage.setItem('mochi_progress_sentinel','preserve-euna');w.localStorage.setItem('pokemath_collection_sentinel','preserve-jonah');
  w.fetch=async(u,o)=>{if(String(u).startsWith('https://script.google.com/')){const b=JSON.parse(o.body);requests.push(b);if(b.action)return {ok:true,type:'cors',text:async()=>JSON.stringify({ok:true,service:'family-learning-mirror',planApi:1,student:'Hana',plan:remote})};return {type:'opaque'};}return fetch(new URL(u,BASE),o);};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
 }});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id),click=el=>{el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
 const on=id=>$(id).classList.contains('on');
 await until(()=>w.HanaStudio&&w.HanaStudio.ready()&&w.HanaPlan,10000,'app boot');
 await until(()=>w.HanaNightly?.report().received,8000,'nightly receipt');
 assert.equal(w.HanaNightly.report().active,null,'receipt alone does not claim adoption');
 click($('startCourse'));
 const session=w.HanaStudio.getSession();
 assert.equal(session.queue[0],'p3-patterns');assert.equal(session.queue.length,10);
 assert.equal(session.current.spec.skill,'p3-patterns');assert.equal(session.phase,'lesson','untaught skill opens teaching');
 assert.equal(session.nightlyPlan.revision,1);assert.ok(w.HanaNightly.report().active.startedAt);
 const saved=JSON.stringify(session);remote={...remote,revision:2,subjects:{maths:{focus:'Explore place value.',skills:['p3-place']}}};
 await w.HanaNightly.refresh(true);
 assert.equal(JSON.stringify(w.HanaStudio.getSession()),saved,'refresh cannot replace active work');
 w.HanaStudio.pause();click($('startCourse'));
 assert.equal(w.HanaStudio.getSession().id,session.id,'main daily button resumes unfinished session');
 assert.equal(w.HanaStudio.getSession().nightlyPlan.revision,1,'new revision waits for a new session');
 for(let i=0;i<20&&on('scr-lesson');i++){if($('lessonChoices').children.length&&!$('lessonFeedback').textContent)click($('lessonChoices').children[0]);else click($('lessonNext'));await sleep(5);}
 assert.ok(on('scr-quiz'));
 const c=session.current,spec=c.spec;
 if(spec.kind==='choice'){const i=spec.choices.findIndex(o=>o.v===spec.ans);click($('pad').children[i]);}
 else{$('typedAnswer').value=String(spec.ans);$('answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}));}
 await until(()=>session.current.done,2000,'answer accepted');
 const review=w.HanaProgress.snapshot();assert.equal(review.learning.events.at(-1).nightlyPlan.revision,1);
 assert.equal(review.learning.nightlyPlanReview.received.revision,2);assert.equal(review.learning.nightlyPlanReview.active.revision,1);
 assert.ok(!JSON.stringify(review).includes('synthetic-secret'));
 assert.equal(w.localStorage.getItem('mochi_progress_sentinel'),'preserve-euna');assert.equal(w.localStorage.getItem('pokemath_collection_sentinel'),'preserve-jonah');
 // A new daily click must return to an unfinished checkpoint, not discard its answers.
 w.HanaPlan.openPaper(w.HanaPapers.build('cp1',w.HanaCurriculum.skills));click($('paperBegin'));
 const beforePaper=JSON.parse(await w.eval('store').get('hq_paper'));w.HanaStudio.start('course');
 assert.ok(on('scr-paper'));assert.equal(JSON.parse(await w.eval('store').get('hq_paper')).id,beforePaper.id);
 assert.deepEqual(errors,[],'no script errors');
 console.log('PASS: actual UI receipt → prioritised lesson/question → safe resume → exported evidence; checkpoint and sibling data preserved.');
 w.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
