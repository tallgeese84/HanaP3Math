// UI flow test in jsdom (no browser download needed). Runs its own local server;
// APP_URL can optionally point to an already running preview.
const {JSDOM,VirtualConsole}=require('jsdom'),assert=require('node:assert/strict');
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
  w.fetch=(u,o)=>fetch(new URL(u,BASE),o);
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
 }});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id),click=el=>{el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
 const on=id=>$(id).classList.contains('on');
 await until(()=>w.HanaStudio&&w.HanaStudio.ready()&&w.HanaPlan,10000,'app boot');
 assert.match($('courseTitle').textContent,/Unit 1 of 16/);
 assert.equal($('startDaily').textContent,'Free practice');

 // ---- one full course session ----
 click($('startCourse'));
 let answered=0,lessons=0,kinds=new Set();
 for(let guard=0;guard<80&&!on('scr-summary');guard++){
  await sleep(10);
  if(on('scr-lesson')){
   if($('lessonChoices').children.length&&!$('lessonFeedback').textContent){click($('lessonChoices').children[0]);continue;}
   if($('lessonNext').textContent.includes('Practise')||$('lessonNext').textContent.includes('Back to'))lessons++;
   click($('lessonNext'));continue;
  }
  if(on('scr-quiz')){
   const s=w.HanaStudio.getSession(),c=s.current;
   if(c.done){click($('nextQuestion'));continue;}
   const spec=c.spec;kinds.add(spec.kind);
   if(spec.kind==='choice'){const i=spec.choices.findIndex(o=>o.v===spec.ans);click($('pad').children[i]);}
   else if(spec.kind==='parts'){
    const e=spec.expect,set=(k,v)=>{const el=$('partsFields').querySelector(`[data-part="${k}"]`);el.value=String(v);el.dispatchEvent(new w.Event('input'));};
    if(spec.layout==='units'){set('a',e.a);set('b',e.b);}else if(spec.layout==='remainder'){set('q',e.q);set('r',e.r);}else if(spec.layout==='clock'){set('h',e.h);set('m',e.m);}else{const W=Math.floor(e.N/e.D),r=e.N%e.D;if(W)set('w',W);if(r){set('n',r);set('d',e.D);}}
    $('partsForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
   }else if(spec.kind==='manual'){click($('manualDone'));}
   else{$('typedAnswer').value=spec.money?(spec.ans/100).toFixed(2):String(spec.ans);$('answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}));}
   await until(()=>w.HanaStudio.getSession().current.done,2000,'answer accepted: '+spec.qtext);answered++;
   continue;
  }
 }
 assert.ok(on('scr-summary'),'session reached the summary');
 assert.equal(answered,10,'ten questions in a course session');
 assert.ok(lessons>=1,'the first new skill opens with its lesson');
 const ev=w.HanaStudio.getLearning().events;assert.equal(ev.length,10);assert.ok(ev.every(e=>e.course===true));
 console.log('course session ok · lessons',lessons,'· kinds',[...kinds].join(','));

 // ---- typed fraction with feedback, through the real form ----
 w.HanaStudio.start('focus','p3-equivalent');
 for(let g=0;g<10&&on('scr-lesson');g++){if($('lessonChoices').children.length&&!$('lessonFeedback').textContent)click($('lessonChoices').children[0]);else click($('lessonNext'));await sleep(5);}
 // Force a simplest-form question to exercise the checker in the UI.
 const s=w.HanaStudio.getSession();s.current.spec=w.HanaCurriculum.generate('p3-equivalent',3);s.current.entry='';w.HanaStudio.renderCurrent();
 const e=s.current.spec.expect,set=(k,v)=>{const el=$('partsFields').querySelector(`[data-part="${k}"]`);el.value=String(v);el.dispatchEvent(new w.Event('input'));};
 assert.equal($('partsForm').hidden,false);assert.equal($('answerForm').hidden,true);
 set('n',e.N*2);set('d',e.D*2);$('partsForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
 assert.match($('quizSpeech').textContent,/simplest form/);assert.equal(s.current.done,false);assert.equal(s.current.tries,1);
 set('n',e.N);set('d',e.D);$('partsForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
 assert.equal(s.current.done,true);assert.equal(s.current.attempts.length,2);
 console.log('typed fraction feedback ok');
 w.HanaStudio.pause();

 // ---- checkpoint paper ----
 w.HanaPlan.openPaper(w.HanaPapers.build('cp1',w.HanaCurriculum.skills));
 assert.ok(on('scr-paper'));click($('paperBegin'));
 for(let i=0;i<40;i++){
  const t=$('paperTitle').textContent;if(!/Section/.test(t))break;
  const n=+$('paperCount').textContent.match(/Question (\d+)/)[1]-1;
  const raw=await w.eval('store').get('hq_paper');const p=JSON.parse(raw),it=p.items[n],sp=it.spec;
  if(sp.kind==='choice'){const k=sp.choices.findIndex(o=>o.v===sp.ans);click($('paperBody').querySelector(`[data-opt="${k}"]`));}
  else if(sp.kind==='key'){$('paperInput').value=sp.money?(sp.ans/100).toFixed(2):String(sp.ans);$('paperInput').dispatchEvent(new w.Event('input'));}
  else{const e=sp.expect,set=(k,v)=>{const el=$('paperParts').querySelector(`[data-part="${k}"]`);el.value=String(v);el.dispatchEvent(new w.Event('input'));};
   if(sp.layout==='units'){set('a',e.a);set('b',e.b);}else if(sp.layout==='remainder'){set('q',e.q);set('r',e.r);}else if(sp.layout==='clock'){set('h',e.h);set('m',e.m);}else{const W=Math.floor(e.N/e.D),r=e.N%e.D;if(W)set('w',W);if(r){set('n',r);set('d',e.D);}}}
  if(it.section==='C')assert.ok($('workPad'),'Section C has a working canvas');
  await sleep(5);
  if($('paperFinish')){click($('paperFinish'));break;}
  click($('paperNext'));
 }
 await until(()=>/Checkpoint complete/.test($('paperTitle').textContent),4000,'results');
 assert.match($('paperBody').textContent,/35\s*\/ 35/);
 const papers=w.HanaStudio.getLearning().papers;assert.equal(papers.length,1);assert.equal(papers[0].score,35);
 console.log('checkpoint ok',papers[0].score+'/'+papers[0].max);
 click($('paperDone'));assert.ok(on('scr-home'));

 // ---- parent plan ----
 w.grownupGate.unlock(3600000);
 click($('openProgress'));
 assert.match($('planPanel').textContent,/June plan/);assert.match($('planPanel').textContent,/Checkpoint 1 · P3 numbers & operations/);
 assert.match($('planPanel').textContent,/35\/35/);
 $('planTarget').value='2027-06-25';$('planWeek').value='6';click($('planSave'));
 await until(()=>w.HanaCourse.settings(w.HanaStudio.getLearning()).target==='2027-06-25',3000,'settings saved');
 const review=w.HanaReview.build(w.HanaStudio.getLearning(),w.HanaCurriculum.skills);assert.equal(review.learning.papers.length,1);assert.equal(review.learning.course.settings.perWeek,6);
 console.log('parent plan ok');

 // Every new family through the real question render, answer forms and report.
 // This is an isolated DOM test profile; it never posts child learning data.
 $('progressDialog').close();
 for(const family of w.HanaExamStyle.families){
  const id=family.skills[0],tier=family.tiers.at(-1);
  // Explicitly choose the year just as the UI does before a focus session.
  const yearButton=d.querySelector(`[data-year="${id[1]}"]`);if(yearButton)click(yearButton);
  w.HanaStudio.start('focus',id);
  const session=w.HanaStudio.getSession();session.phase='practice';
  session.current.spec=w.HanaExamStyle.generate(id,tier,Math.random,family.id);session.current.entry='';
  const spec=session.current.spec;w.HanaStudio.renderCurrent();
  assert.equal($('qtext').textContent,spec.qtext);
  if(spec.essentialVisual)assert.ok($('qvis').querySelector('svg,table'),'required diagram shown');
  if(spec.kind==='key'){
   assert.equal($('typedAnswer').disabled,false);assert.equal($('answerForm').hidden,false);
   $('typedAnswer').value=String((spec.money?spec.ans/100:spec.ans)+1);
   $('answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
   assert.equal(session.current.done,false);assert.equal(session.current.tries,1);
   $('typedAnswer').value=spec.money?(spec.ans/100).toFixed(2):String(spec.ans);
   $('answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
  }else{
   assert.equal($('partsForm').hidden,false);assert.equal($('partsForm').querySelector('button').disabled,false);
   const e=spec.expect,set=(k,v)=>{const input=$('partsFields').querySelector(`[data-part="${k}"]`);input.value=String(v);input.dispatchEvent(new w.Event('input'));};
   if(spec.layout==='clock'){set('h',e.h);set('m',e.m);}else{const whole=Math.floor(e.N/e.D),n=e.N%e.D;if(whole)set('w',whole);if(n){set('n',n);set('d',e.D);}}
   $('partsForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
  }
  assert.equal(session.current.done,true,family.id+' accepted');
  const record=w.HanaReview.build(w.HanaStudio.getLearning(),w.HanaCurriculum.skills).learning.events.at(-1);
  assert.equal(record.family,family.id);assert.equal(record.bankRevision,'h19');
  assert.ok($('quizSpeech').textContent.includes(spec.steps[0]),'worked solution is visible');
 }
 console.log('all 29 exam-style families: input enabled, grading, worked solutions and report provenance ok');
 assert.deepEqual(errors,[],'no script errors');
 console.log('ALL FLOW CHECKS PASSED');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
