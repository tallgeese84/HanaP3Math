/* New learning flow; the original voice engine, rewards, handwriting model and
 * hq_* storage remain in index.html. Never derive mastery from legacy stars. */
(function(){
'use strict';
const C=HanaCurriculum,L=HanaLearning,$=id=>document.getElementById(id),esc=C.esc;
let learning=L.clean(null),session=null,year=3,running=false,ready=false,method='keyboard',stage='understand';
let saveChain=Promise.resolve(),liveStroke=null,savingDraft=false;
const prompts={understand:'What do you know? What must you find?',connect:'Would a bar model, a drawing or a known fact help?',solve:'Write the steps in your own way.',verify:'Check with another method. Does the answer make sense?'};
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
const current=()=>session?.current;
function readJSON(raw,fallback){try{return JSON.parse(raw)||fallback;}catch{return fallback;}}
function persist(){
 const a=JSON.stringify(learning),b=JSON.stringify(session);
 saveChain=saveChain.catch(()=>{}).then(async()=>{await store.set('hq_learning',a);await store.set('hq_session',b);await store.set('hq_year',year);});return saveChain;
}
function saveDraft(){
 if(!running||!current()||savingDraft)return;
 current().entry=q.entry||'';
 if(method==='write'&&wpad.strokes.length)current().answerStrokes=wpad.strokes;
 persist();
}
async function reload(){
 learning=L.clean(readJSON(await store.get('hq_learning'),{}));
 const raw=readJSON(await store.get('hq_session'),null);
 session=raw&&Array.isArray(raw.queue)&&raw.queue.every(id=>C.skills.some(s=>s.id===id))&&Number.isInteger(raw.index)&&raw.index>=0&&raw.index<=raw.queue.length&&[3,4].includes(raw.year)?raw:null;
 if(session&&(!Array.isArray(session.results)||!session.current?.spec))session=null;
 year=Number(await store.get('hq_year'))===4?4:3;
 running=false;renderHome();renderMap();
}
function renderHome(){
 document.querySelectorAll('[data-year]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.year===year)));
 const pool=C.skills.filter(s=>s.year===year&&!s.manual),done=pool.filter(s=>L.evidence(learning,s.id).total>0).length,secure=pool.filter(s=>L.evidence(learning,s.id).secure).length;
 $('homeProgress').textContent=`Primary ${year} · ${done} of ${pool.length} skills explored${secure?' · '+secure+' secure':''}`;
 $('resumeSession').hidden=!session||session.index>=session.queue.length;
 if(session)$('resumeSession').textContent=`Continue P${session.year} · ${session.index+1}/${session.queue.length}`;
 $('startDaily').disabled=!ready;$('startCheckin').disabled=!ready;
}
function pause(){
 saveDraft();running=false;stopAllAudio();clearTimeout(q.lookTimer);clearSigns();persist();renderHome();
}
function home(){pause();stopZap();stopRace();mode='home';renderBuddyHome();show('home');}
function start(kind='daily',focus=null){
 if(!ready)return;
 pause();stopZap();stopRace();
 const sk=C.skills.find(s=>s.id===focus);
 const queue=sk?.manual?[focus]:L.plan(learning,C.skills,year,kind,focus);
 if(!queue.length)return;
 session={id:uid(),year,kind,queue,index:0,results:[],current:null};
 running=true;audio()?.resume?.().catch(()=>{});helloOnce();makeQuestion();
}
function makeQuestion(){
 if(!session||session.index>=session.queue.length){finish();return;}
 const id=session.queue[session.index],tier=L.evidence(learning,id).tier;
 const recent=new Set(learning.events.filter(e=>e.skill===id).slice(-20).map(e=>e.signature));let spec;
 for(let i=0;i<24;i++){spec=C.generate(id,tier);if(!recent.has(spec.signature))break;}
 session.current={id:uid(),spec,tries:0,hints:0,entry:'',done:false,revealed:false,started:Date.now(),elapsed:0,notes:{},strokes:[],answerStrokes:[]};
 stage='understand';renderCurrent();persist();
}
function renderCurrent(){
 const c=current();if(!c)return;
 running=true;mode='num';show('quiz');stopAllAudio();clearSigns();clearTimeout(q.lookTimer);
 // Copy the persisted question, never regenerate it on reopen or reload.
 const s=c.spec;
 Object.assign(q,{ans:s.ans,kind:s.kind,tries:c.tries,entry:c.entry||'',money:!!s.money,dec:!!s.dec,allowDot:!!s.money||!!s.dec,choiceDefs:s.choices||null,phrase:s.phrase,fact:s.fact,help:s.help,asked:Date.now(),revealed:c.revealed});
 padLocked=c.done;
 $('skillBadge').textContent=`Primary ${s.year} · ${session.kind==='checkin'?'Starting point':s.topic}`;
 $('questionCount').textContent=`Question ${session.index+1} of ${session.queue.length}`;
 $('sessionProgress').max=session.queue.length;$('sessionProgress').value=session.index;
 $('topicHeading').textContent=s.title;
 $('qtext').textContent=s.qtext;
 $('qvis').innerHTML=s.vis||'';$('eqline').innerHTML=s.eq||'';
 $('quizSpeech').textContent=c.done?(c.feedback||s.fact):'';
 $('quizSpeech').className='speech'+(c.done&&!c.revealed?' ok':'');
 $('helpBox')?.remove();if(c.hints)renderHint();
 $('hintButton').hidden=c.done||s.manual;$('revealButton').hidden=c.done||c.tries<2||s.manual;
 $('nextQuestion').hidden=!c.done;$('nextQuestion').textContent=session.index+1===session.queue.length?'Finish session →':'Next question →';
 $('listenQuestion').disabled=!soundOn||!ttsAllowed();
 answerUI();
 if(c.done){const b=$('blank');if(b)b.innerHTML=answerText();}
 renderThinking();
 if(!c.done&&ttsQuestions())say(s.phrase);
}
function answerUI(){
 const c=current();if(!c)return;
 const oldSaving=savingDraft;savingDraft=true;
 try{
 for(const id of ['kwrap','wwrap','pad'])$(id).style.display='none';
 $('answerForm').hidden=true;$('manualAnswer').hidden=true;$('inputControls').hidden=q.kind!=='key';
 if(q.kind==='manual'){
  $('manualAnswer').hidden=false;$('manualChecklist').textContent=c.spec.checklist;
  $('manualDone').disabled=c.done;return;
 }
 if(q.kind==='choice'){
  legacyAnswerUI();
  $('pad').querySelectorAll('button').forEach((b,i)=>{b.disabled=c.done;if(c.done&&q.choiceDefs[i].v===q.ans)b.classList.add('right');});
 }else if(method==='keyboard'){
  $('answerForm').hidden=false;$('typedAnswer').value=c.entry||'';
  $('typedAnswer').inputMode=q.allowDot?'decimal':'numeric';$('answerPrefix').textContent=q.money?'$':'';
  $('typedAnswer').disabled=c.done;$('answerForm').querySelector('button').disabled=c.done;
 }else{
  inputMode=method==='write'&&NET?'write':'pad';legacyAnswerUI();
  if(inputMode==='write'){
   wpad.strokes=c.answerStrokes||[];requestAnimationFrame(wpDraw);
   // wpClear in the legacy renderer clears q.entry; restore the recognised draft.
   q.entry=c.entry||'';renderEntry();
  }
  lockPads(c.done);
 }
 for(const [id,m] of [['useKeyboard','keyboard'],['useKeypad','pad'],['useWriting','write']]){
  $(id).setAttribute('aria-pressed',String(method===m));$(id).disabled=m==='write'&&!NET;
 }
 }finally{savingDraft=oldSaving;}
}
function setInput(m){
 saveDraft();method=m==='write'&&!NET?'keyboard':m;
 const entry=current()?.entry||'';savingDraft=true;answerUI();q.entry=entry;renderEntry();savingDraft=false;persist();
}
function answer(correct,btn){
 const c=current();if(!running||!c||c.done)return;
 audio()?.resume?.().catch(()=>{});
 if(correct){settle(!c.tries&&!c.hints,false);if(btn)btn.classList.add('right');}
 else{
  c.tries++;q.tries=c.tries;padLocked=false;
  $('quizSpeech').textContent='Have another look. You can change your answer or ask for a hint.';
  $('revealButton').hidden=c.tries<2;
  if(btn){btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),500);}
  sndOops();stopAllAudio();if(wrongVoice)playVoice('retry');
  persist();
 }
}
function settle(independent,revealed,manual=false){
 const c=current();if(!c||c.done)return;
 c.done=true;c.revealed=revealed;padLocked=true;
 c.feedback=manual?'Saved for a grown-up’s review.':revealed?'Let’s learn from this. '+c.spec.fact:independent?'You worked it out! '+c.spec.fact:'You got there with help. '+c.spec.fact;
 const event={id:c.id,session:session.id,skill:c.spec.skill,year:c.spec.year,tier:c.spec.tier,at:Date.now(),independent:!!independent,correct:!revealed&&!manual,manual,hints:c.hints,tries:c.tries,revealed,elapsedMs:c.elapsed+Math.max(0,Date.now()-c.started),signature:c.spec.signature,question:c.spec.qtext,answer:c.spec.ans,notes:c.notes,strokes:c.strokes};
 learning=L.merge(learning,{events:[event]});session.results.push(event);
 const fact=c.spec.fact;
 renderCurrent();
 if(!manual){
  if(!revealed){sndGood();addStar(independent?2:1);bumpStreak(independent);}
  else bumpStreak(false);
  voiceThen(revealed?'hint':independent?'first':'recover',revealed?'Let’s try it together.':'Good thinking, Hana.',fact);
 }
 persist();schedulePush();renderHome();
}
function renderHint(){
 const c=current();if(!c)return;
 let box=$('helpBox');if(!box){box=document.createElement('div');box.id='helpBox';box.className='helpbox';$('qvis').after(box);}
 box.textContent=c.spec.help;
}
function hint(){
 const c=current();if(!running||!c||c.done)return;
 c.hints++;renderHint();stopAllAudio();playVoice('hint');persist();
}
function finish(){
 running=false;stopAllAudio();mode='home';show('summary');
 const results=session.results,ind=results.filter(e=>e.independent).length,supported=results.filter(e=>e.correct&&!e.independent).length;
 $('summaryStats').innerHTML=`<span class="summary-stat">${ind}</span> independent ${ind===1?'answer':'answers'} <span class="muted">· ${supported} with help</span>`;
 $('summaryList').innerHTML=results.map(e=>`<div class="result-row"><span>${esc(C.skills.find(s=>s.id===e.skill)?.name||e.skill)}</span><span>${e.manual?'Grown-up review':e.independent?'On my own':e.correct?'With help':'Solution explored'}</span></div>`).join('');
 session.index=session.queue.length;persist();renderHome();
}
function next(){
 if(!current()?.done)return;
 stopAllAudio();session.index++;if(session.index>=session.queue.length)finish();else makeQuestion();
}
function renderMap(){
 const pool=C.skills.filter(s=>s.year===year),topics=[...new Set(pool.map(s=>s.topic))];
 $('skillMap').innerHTML=topics.map(topic=>`<section class="skill-group"><h3>${esc(topic)}</h3><div class="skill-grid">${pool.filter(s=>s.topic===topic).map(s=>{const e=L.evidence(learning,s.id);return `<button class="skill-tile" data-skill="${s.id}" data-secure="${e.secure}">${esc(s.name)}<small>${s.manual?'Draw · grown-up review':e.label+(e.due?' · Ready to review':'')}</small></button>`;}).join('')}</div></section>`).join('');
 $('skillMap').querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{$('mapDialog').close();start('focus',b.dataset.skill);});
}
function renderReport(){
 $('learningReport').innerHTML=[3,4].map(y=>`<strong>Primary ${y}</strong>`+C.skills.filter(s=>s.year===y).map(s=>{const e=L.evidence(learning,s.id),manual=learning.events.filter(e=>e.skill===s.id&&e.manual);return `<div class="result-row"><span>${esc(s.name)}</span><span>${s.manual?manual.length+' saved for review':e.total?e.success+'/'+e.recent+' independent recently · '+e.label:'No evidence yet'}</span></div>`;}).join('')).join('<br>');
}
function openDialog(id,trigger){
 $(id).showModal();$(trigger).setAttribute('aria-expanded','true');
 if(id==='thinkDialog'){renderThinking();requestAnimationFrame(drawScratch);}
 if(id==='mapDialog')renderMap();
}
function renderThinking(){
 const c=current();
 $('thinkPrompt').textContent=running?prompts[stage]:'Start or continue a question to save your working with it.';
 $('workingText').value=c?.notes?.[stage]||'';$('workingText').disabled=!running;
 document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.stage===stage)));
 drawScratch();
}
function drawScratch(){
 const canvas=$('scratchPad'),ctx=canvas.getContext('2d'),r=canvas.getBoundingClientRect();if(!r.width)return;
 const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.scale(dpr,dpr);ctx.clearRect(0,0,r.width,r.height);ctx.lineWidth=2.5;ctx.strokeStyle='#55317e';ctx.lineCap='round';ctx.lineJoin='round';
 const strokes=[...(current()?.strokes||[]),...(liveStroke?[liveStroke]:[])];
 for(const stroke of strokes){ctx.beginPath();stroke.forEach(([x,y],i)=>i?ctx.lineTo(x*r.width,y*r.height):ctx.moveTo(x*r.width,y*r.height));ctx.stroke();}
}
function commitWorking(){
 const c=current();if(!c)return;
 // Edits after answering remain attached to the same event, without changing correctness.
 const event=learning.events.find(e=>e.id===c.id);if(event){event.notes=c.notes;event.strokes=c.strokes;}
 persist();
}
$('answerForm').onsubmit=e=>{
 e.preventDefault();if(padLocked||!current())return;
 const text=$('typedAnswer').value.trim();
 if(!/^\d+(?:\.\d{1,3})?$/.test(text)||(q.money&&!/^\d+(?:\.\d{1,2})?$/.test(text))||(!q.allowDot&&text.includes('.'))){$('quizSpeech').textContent=q.allowDot?'Enter a number, using a decimal point if needed.':'Enter a whole number.';return;}
 q.entry=text;current().entry=text;submitEntry();
};
$('typedAnswer').oninput=()=>{q.entry=$('typedAnswer').value;saveDraft();};
$('startDaily').onclick=()=>start('daily');$('startCheckin').onclick=()=>start('checkin');
$('resumeSession').onclick=()=>{if(!session)return;year=session.year;renderHome();renderCurrent();};
$('nextQuestion').onclick=next;$('hintButton').onclick=hint;$('revealButton').onclick=()=>settle(false,true);
$('manualDone').onclick=()=>settle(false,false,true);
$('listenQuestion').onclick=()=>{if(soundOn&&ttsAllowed()){stopAllAudio();say(q.phrase);}};
$('useKeyboard').onclick=()=>setInput('keyboard');$('useKeypad').onclick=()=>setInput('pad');$('useWriting').onclick=()=>setInput('write');
$('dockHome').onclick=home;$('summaryHome').onclick=home;$('summaryAgain').onclick=()=>start('daily');
$('dockMap').onclick=()=>openDialog('mapDialog','dockMap');$('dockThink').onclick=()=>openDialog('thinkDialog','dockThink');$('dockMore').onclick=()=>openDialog('moreDialog','dockMore');
for(const [id,trigger] of [['thinkDialog','dockThink'],['mapDialog','dockMap'],['moreDialog','dockMore']]){
 $(id).querySelector('[data-close]').onclick=()=>$(id).close();
 $(id).addEventListener('close',()=>$(trigger).setAttribute('aria-expanded','false'));
}
$('openFamilySettings').onclick=()=>{$('moreDialog').close();$('cloudBtn').click();};
$('openCollection').onclick=()=>{$('moreDialog').close();pause();$('teamBtn').click();};
$('teamBtn').addEventListener('click',()=>pause());
// Existing game listeners run after this capture handler; prevent an active quiz from leaking into them.
for(const b of document.querySelectorAll('.mode'))b.addEventListener('click',()=>pause(),true);
for(const b of document.querySelectorAll('[data-year]'))b.onclick=()=>{year=+b.dataset.year;persist();renderHome();renderMap();};
for(const b of document.querySelectorAll('[data-stage]'))b.onclick=()=>{stage=b.dataset.stage;renderThinking();};
$('workingText').oninput=()=>{if(running&&current()){current().notes[stage]=$('workingText').value;commitWorking();}};
const canvas=$('scratchPad');
const pt=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
canvas.onpointerdown=e=>{if(!running||!current())return;e.preventDefault();canvas.setPointerCapture(e.pointerId);liveStroke=[pt(e)];};
canvas.onpointermove=e=>{if(!liveStroke)return;e.preventDefault();if(liveStroke.length<1000)liveStroke.push(pt(e));drawScratch();};
canvas.onpointerup=canvas.onpointercancel=()=>{if(liveStroke&&current()){if(current().strokes.length<100)current().strokes.push(liveStroke);liveStroke=null;commitWorking();drawScratch();}};
$('scratchUndo').onclick=()=>{if(running&&current()){current().strokes.pop();commitWorking();drawScratch();}};
$('scratchClear').onclick=()=>{if(running&&current()){current().strokes=[];commitWorking();drawScratch();}};
window.addEventListener('resize',()=>{if($('thinkDialog').open)drawScratch();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){saveDraft();stopAllAudio();}});
window.addEventListener('pagehide',saveDraft);
window.HanaStudio={active:()=>running&&!!current(),renderCurrent,answer,answerUI,setInput,hint,pause,saveDraft,renderReport,reload,getLearning:()=>learning,mergeLearning:async other=>{const local=readJSON(await store.get('hq_learning'),{});learning=L.merge(L.merge(local,learning),other);await store.set('hq_learning',JSON.stringify(learning));renderHome();},start,getSession:()=>session};
$('startDaily').disabled=true;$('startCheckin').disabled=true;
Promise.resolve(window.hanaBoot).then(reload).then(()=>{ready=true;renderHome();}).catch(()=>{ready=true;renderHome();});
})();
