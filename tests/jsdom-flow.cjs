// UI flow test in jsdom (no browser download needed). Run with a static server:
//   python3 -m http.server 8765 & node tests/jsdom-flow.cjs
// Requires: npm install --no-save jsdom
const {JSDOM,VirtualConsole}=require('jsdom'),assert=require('node:assert/strict');
const BASE=process.env.APP_URL||'http://localhost:8765/index.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms=8000,label='condition'){const t=Date.now();while(Date.now()-t<ms){try{const v=fn();if(v)return v;}catch{}await sleep(25);}throw new Error('Timed out: '+label);}
(async()=>{
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
 click($('openProgress'));
 assert.match($('planPanel').textContent,/June plan/);assert.match($('planPanel').textContent,/Checkpoint 1 · P3 numbers & operations/);
 assert.match($('planPanel').textContent,/35\/35/);
 $('planTarget').value='2027-06-25';$('planWeek').value='6';click($('planSave'));
 await until(()=>w.HanaCourse.settings(w.HanaStudio.getLearning()).target==='2027-06-25',3000,'settings saved');
 const review=w.HanaReview.build(w.HanaStudio.getLearning(),w.HanaCurriculum.skills);assert.equal(review.papers.length,1);assert.equal(review.course.settings.perWeek,6);
 console.log('parent plan ok');
 assert.deepEqual(errors,[],'no script errors');
 console.log('ALL FLOW CHECKS PASSED');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
