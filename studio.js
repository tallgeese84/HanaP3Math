/* New learning flow; the original voice engine, rewards, handwriting model and
 * hq_* storage remain in index.html. Never derive mastery from legacy stars. */
(function(){
'use strict';
const C=HanaCurriculum,L=HanaLearning,T=HanaLessons,K=HanaCoach,$=id=>document.getElementById(id),esc=C.esc;
let learning=L.clean(null),session=null,year=3,running=false,ready=false,method='keyboard',stage='understand';
let lastTick=Date.now(),lastActivity=Date.now();
let saveChain=Promise.resolve(),liveStroke=null,savingDraft=false;
const prompts={understand:'What do you know? What must you find?',connect:'Would a bar model, a drawing or a known fact help?',solve:'Write the steps in your own way.',verify:'Check with another method. Does the answer make sense?'};
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
const current=()=>session?.current;
// This is an engagement estimate, never a score or a speed requirement.
function tick(){const now=Date.now(),c=current();if(running&&session?.phase!=='lesson'&&c&&!c.done&&!document.hidden&&!['progressDialog','mapDialog','moreDialog'].some(id=>$(id)?.open)&&now-lastActivity<60000)c.activeMs=(c.activeMs||0)+Math.min(5000,Math.max(0,now-lastTick));lastTick=now;}
setInterval(tick,5000);
for(const type of ['pointerdown','keydown','input'])document.addEventListener(type,()=>{tick();lastActivity=Date.now();},{passive:true});
function changed(){window.dispatchEvent(new Event('hana:learning-changed'));}

function readJSON(raw,fallback){try{return JSON.parse(raw)||fallback;}catch{return fallback;}}
function persist(){
 const a=JSON.stringify(learning),b=JSON.stringify(session);
 saveChain=saveChain.catch(()=>{}).then(async()=>{await store.set('hq_learning',a);await store.set('hq_session',b);await store.set('hq_year',year);});return saveChain;
}
function saveDraft(){
 if(!running||!current()||session.phase==='lesson'||savingDraft)return;
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
 const rec=L.recommend(learning,C.skills,year);$('nextPlan').textContent=rec?`Next: ${rec.name}. ${rec.reason}`:'';
 if(session)$('resumeSession').textContent=`Continue P${session.year} · ${session.index+1}/${session.queue.length}`;
 $('startDaily').disabled=!ready;$('startCheckin').disabled=!ready;
 window.HanaPlan?.renderHome();
}
function pause(){
 tick();saveDraft();running=false;stopAllAudio();clearTimeout(q.lookTimer);clearSigns();persist();renderHome();
}
function home(){pause();stopZap();stopRace();mode='home';renderBuddyHome();show('home');}
function start(kind='daily',focus=null){
 if(!ready)return;
 pause();stopZap();stopRace();
 let queue,sessionYear=year;
 if(kind==='course'){const p=HanaCourse.plan(learning,C.skills);queue=p.queue;sessionYear=C.skills.find(s=>s.id===p.focus)?.year||C.skills.find(s=>s.id===queue[0])?.year||year;}
 else queue=L.plan(learning,C.skills,year,kind,focus);
 if(!queue.length)return;
 session={id:uid(),year:sessionYear,kind,focus,repairs:{},queue,index:0,results:[],current:null,phase:'practice',taught:{},reteachFor:{}};
 running=true;audio()?.resume?.().catch(()=>{});helloOnce();makeQuestion();
}
function makeQuestion(){
 if(!session||session.index>=session.queue.length){finish();return;}
 const id=session.queue[session.index],evidence=L.evidence(learning,id),tier=evidence.tier,now=Date.now();
 const gap=now-L.exposure(learning,id),recall=evidence.total>0&&gap>=86400000;
 const application=!recall&&session.kind!=='checkin'&&evidence.success>=3&&K.hasTransfer(id)&&!session.results.some(e=>e.skill===id&&e.phase==='transfer');
 const recent=new Set(learning.events.filter(e=>e.skill===id).slice(-20).map(e=>e.signature));let spec;
 for(let i=0;i<24;i++){spec=application?K.transfer(C,id,tier):C.generate(id,tier);if(!recent.has(spec.signature))break;}
 session.current={id:uid(),spec,tries:0,hints:0,entry:'',done:false,revealed:false,started:now,elapsed:0,activeMs:0,notes:{},strokes:[],answerStrokes:[],attempts:[],confidence:'unreported',phase:recall?'recall':application?'transfer':'practice',reviewGapMs:recall?gap:0,repeated:learning.events.some(e=>e.signature===spec.signature&&now-e.at<86400000)};
 lastTick=lastActivity=now;
 stage='understand';session.phase='practice';session.taught||={};session.reteachFor||={};
 // Recall happens before a reminder. A replay remains available and marks help.
 if(!recall&&session.kind!=='checkin'&&(!session.taught[id]&&(session.index===0||!learning.lessons[id]))){openLesson('intro');return;}
 if(!recall&&session.kind!=='checkin'&&evidence.reteach&&session.reteachFor[id]!==evidence.last.id){session.reteachFor[id]=evidence.last.id;openLesson('reteach');return;}
 renderCurrent();persist();
}
function renderCurrent(){
 const c=current();if(!c)return;
 if(session.phase==='lesson'){renderLesson();return;}
 running=true;mode='num';show('quiz');stopAllAudio();clearSigns();clearTimeout(q.lookTimer);
 // Copy the persisted question, never regenerate it on reopen or reload.
 const s=c.spec;
 Object.assign(q,{ans:s.ans,ansText:s.ansText,kind:s.kind,tries:c.tries,entry:c.entry||'',money:!!s.money,dec:!!s.dec,allowDot:!!s.money||!!s.dec,choiceDefs:s.choices||null,phrase:s.phrase,fact:s.fact,help:s.help,asked:Date.now(),revealed:c.revealed});
 padLocked=c.done;
 $('skillBadge').textContent=`Primary ${s.year} · ${session.kind==='checkin'?'Starting point':s.topic}`;
 $('practicePhase').textContent=c.phase==='recall'?'Remember it · try before a reminder':c.phase==='transfer'?'Use the idea in a changed problem':'';
 $('confidenceRow').hidden=c.done||!!s.manual;document.querySelectorAll('[data-confidence]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.confidence===c.confidence));b.disabled=!!c.attempts?.length;});
 $('obstacleRow').hidden=!c.tries||c.done;document.querySelectorAll('[data-obstacle]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.obstacle===c.obstacle)));
 $('questionCount').textContent=`Question ${session.index+1} of ${session.queue.length}`;
 $('sessionProgress').max=session.queue.length;$('sessionProgress').value=session.index;
 $('topicHeading').textContent=s.title;
 $('replayLesson').hidden=c.done;
 $('replayLesson').textContent=session.kind==='checkin'?'Learn this skill':'Review the lesson';
 $('qtext').textContent=s.qtext;
 $('qvis').innerHTML=s.vis||'';$('eqline').innerHTML=s.eq||'';
 $('quizSpeech').textContent=c.done?(c.feedback||s.fact):(c.lastFeedback||'');
 $('quizSpeech').className='speech'+(c.done&&!c.revealed?' ok':'');
 $('helpBox')?.remove();if(c.hints)renderHint();
 $('hintButton').hidden=c.done||s.manual;$('revealButton').hidden=c.done||c.tries<2||s.manual;
 $('nextQuestion').hidden=!c.done;$('nextQuestion').textContent=session.index+1===session.queue.length?'Finish session →':'Next question →';
 $('listenQuestion').disabled=!soundOn||!ttsAllowed();
 answerUI();
 if(c.done){const b=$('blank');if(b)b.innerHTML=answerText();}
 renderThinking();
 lastTick=lastActivity=Date.now();
 if(!c.done&&ttsQuestions())say(s.phrase);
}
function openLesson(reason='replay'){
 const c=current();if(!c||!T.get(c.spec.skill))return;
 tick();if(reason==='replay')saveDraft();stopAllAudio();
 if(reason==='replay'&&!c.done)c.lessonHelp=true;
 session.phase='lesson';session.lesson={id:uid(),skill:c.spec.skill,slide:0,reason,checked:false,selected:null,passed:false,tries:0};
 renderLesson();persist();
}
function renderLesson(){
 const ls=session?.lesson,d=T.get(ls?.skill);if(!d)return;
 learning.exposures[ls.skill]=Date.now();persist();
 running=true;mode='home';show('lesson');stopAllAudio();clearTimeout(q.lookTimer);clearSigns();
 const skill=C.skills.find(s=>s.id===ls.skill);
 $('lessonBadge').textContent=`Primary ${skill.year} · ${skill.topic}`;
 $('lessonCount').textContent=`${ls.slide+1} of 3`;$('lessonProgress').value=ls.slide+1;
 $('lessonTitle').textContent=skill.name;
 $('lessonReason').textContent=ls.reason==='reteach'?'Let’s try the idea together':ls.reason==='replay'?'A little reminder':'Learn it, then try it';
 document.querySelectorAll('.lesson-tabs span').forEach((el,i)=>el.setAttribute('aria-current',i===ls.slide?'step':'false'));
 $('lessonHeading').textContent=ls.slide===0?d.goal:ls.slide===1?d.example:d.check.question;
 $('lessonBody').innerHTML=ls.slide===0?`<p>${esc(d.idea)}</p>`:ls.slide===1?`<ol class="lesson-steps">${d.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:'<p>Have a go. We’ll work through the answer together.</p>';
 $('lessonVisual').innerHTML=d.visual||'';
 $('lessonChoices').innerHTML=ls.slide===2?d.check.options.map((v,i)=>`<button data-check="${i}" ${ls.checked?'disabled':''} class="${ls.checked&&v===d.check.answer?'right':ls.checked&&v===ls.selected?'wrong':''}">${esc(v)}</button>`).join(''):'';
 $('lessonChoices').querySelectorAll('button').forEach(b=>b.onclick=()=>{
  if(ls.checked)return;ls.selected=d.check.options[+b.dataset.check];ls.passed=ls.selected===d.check.answer;ls.tries++;ls.checked=true;
  renderLesson();if(soundOn)playVoice(ls.passed?'first':'hint');persist();
 });
 $('lessonFeedback').textContent=ls.slide===2&&ls.checked?(ls.passed?'That’s it! ':'Let’s work it through. ')+d.check.explanation:'';
 $('lessonBack').disabled=ls.slide===0;
 $('lessonNext').disabled=ls.slide===2&&!ls.checked;
 $('lessonNext').textContent=ls.slide===0?'See an example →':ls.slide===1?'Have a go →':ls.reason==='replay'?'Back to my question →':'Practise this →';
 $('listenLesson').disabled=!soundOn||!ttsAllowed();
 $('listenLesson').title=!soundOn?'Turn sound on to listen.':!ttsAllowed()?'Turn read-aloud on in More → Mum & Dad’s voices.':'Read this page aloud';
}
function finishLesson(){
 const ls=session.lesson,c=current();if(!ls.checked)return;
 const at=Date.now(),d=T.get(ls.skill);learning=L.merge(learning,{lessons:{[ls.skill]:{at,passed:ls.passed,tries:ls.tries}},checks:[{id:ls.id||uid(),skill:ls.skill,at,passed:ls.passed,tries:ls.tries,reason:ls.reason,question:d.check.question,response:ls.selected,answer:d.check.answer}]});changed();
 session.taught||={};session.taught[ls.skill]=true;
 const e=L.evidence(learning,ls.skill);if(e.last){session.reteachFor||={};session.reteachFor[ls.skill]=e.last.id;}
 // A missed introduction check starts practice with a smaller step. A replay
 // preserves the exact question and draft, and records that it was supported.
 if(!ls.passed&&ls.reason!=='replay'){if(c.spec.tier>1)c.spec=C.generate(ls.skill,1);c.phase='practice';c.reviewGapMs=0;c.repeated=learning.events.some(e=>e.signature===c.spec.signature&&Date.now()-e.at<86400000);}
 session.phase='practice';renderCurrent();persist();schedulePush();
}
$('lessonBack').onclick=()=>{if(session.lesson.slide>0){session.lesson.slide--;renderLesson();persist();$('lessonHeading').focus();}};
$('lessonNext').onclick=()=>{if(session.lesson.slide<2){session.lesson.slide++;renderLesson();persist();$('lessonHeading').focus();}else finishLesson();};
$('listenLesson').onclick=()=>{
 if(!soundOn||!ttsAllowed())return;
 const ls=session.lesson,d=T.get(ls.skill);stopAllAudio();
 const words=ls.slide===0?d.goal+'. '+d.idea:ls.slide===1?d.example+'. '+d.steps.join(' '):d.check.question+'. '+d.check.options.join('. ')+(ls.checked?'. '+d.check.explanation:'');
 say(words);
};
$('replayLesson').onclick=()=>openLesson('replay');
function answerUI(){
 const c=current();if(!c)return;
 const oldSaving=savingDraft;savingDraft=true;
 try{
 // The shared containers outlive each question. Reconcile both the input
 // guard and visual/pointer locks for every answer type, including choices.
 padLocked=!!c.done;lockPads(padLocked);
 for(const id of ['kwrap','wwrap','pad'])$(id).style.display='none';
 $('answerForm').hidden=true;$('partsForm').hidden=true;$('manualAnswer').hidden=true;$('inputControls').hidden=q.kind!=='key';
 if(q.kind==='manual'){
  $('manualAnswer').hidden=false;$('manualChecklist').textContent=c.spec.checklist;
  $('manualDone').disabled=c.done;return;
 }
 if(q.kind==='parts'){renderParts(c);return;}
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
 }
 for(const [id,m] of [['useKeyboard','keyboard'],['useKeypad','pad'],['useWriting','write']]){
  $(id).setAttribute('aria-pressed',String(method===m));$(id).disabled=m==='write'&&!NET;
 }
 }finally{savingDraft=oldSaving;}
}
// Typed fractions, compound units, remainders and 24-hour times. Blank or
// malformed boxes get a prompt without counting as an attempt.
function partsMarkup(spec){
 const box=(k,label,cls='')=>`<input data-part="${k}" class="part-in ${cls}" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="6" aria-label="${esc(label)}">`,e=spec.expect||{};
 if(spec.layout==='fraction'||spec.layout==='mixed')return `${box('w',spec.layout==='mixed'?'Whole number':'Whole number (leave empty if none)','part-whole')}<span class="frac-in">${box('n','Numerator (top)')}<span class="frac-line" aria-hidden="true"></span>${box('d','Denominator (bottom)')}</span><small class="parts-tip">${spec.layout==='mixed'?'Whole number, then the fraction':'Leave the big box empty if there is no whole number'}</small>`;
 if(spec.layout==='units')return `${box('a',e.big)}<span class="part-unit">${esc(e.big)}</span>${box('b',e.small)}<span class="part-unit">${esc(e.small)}</span>`;
 if(spec.layout==='remainder')return `${box('q','Quotient')}<span class="part-unit">R</span>${box('r','Remainder')}`;
 if(spec.layout==='clock')return `${box('h','Hours, 24-hour clock','part-clock')}${box('m','Minutes','part-clock')}<small class="parts-tip">24-hour time, e.g. 0845 is 08 then 45</small>`;
 return '';
}
function renderParts(c){
 const spec=c.spec,host=$('partsFields');$('partsForm').hidden=false;
 if(host.dataset.question!==c.id){host.innerHTML=partsMarkup(spec);host.dataset.question=c.id;}
 const saved=readJSON(c.entry||'{}',{});
 host.querySelectorAll('[data-part]').forEach(i=>{i.value=saved[i.dataset.part]??'';i.disabled=c.done;i.oninput=()=>{const v={};host.querySelectorAll('[data-part]').forEach(x=>v[x.dataset.part]=x.value.replace(/\D/g,'').slice(0,6));c.entry=q.entry=JSON.stringify(v);if(!savingDraft)persist();};});
 $('partsForm').querySelector('button').disabled=c.done;
 if(c.done){const b=$('blank');if(b)b.innerHTML=esc(spec.ansText);}
}
$('partsForm').onsubmit=e=>{
 e.preventDefault();const c=current();if(padLocked||!c||c.done||c.spec.kind!=='parts')return;
 const v={};$('partsFields').querySelectorAll('[data-part]').forEach(x=>v[x.dataset.part]=x.value.trim());
 c.entry=q.entry=JSON.stringify(v);
 const r=C.checkParts(c.spec,v);
 if(!r.correct&&r.tag==='format'){$('quizSpeech').textContent=r.message;return;}
 answer(r.correct,null,r.display,r.correct?null:{tag:r.tag,message:r.message});
};
function setInput(m){
 saveDraft();method=m==='write'&&!NET?'keyboard':m;
 const entry=current()?.entry||'';savingDraft=true;answerUI();q.entry=entry;renderEntry();savingDraft=false;persist();
}
function answer(correct,btn,response,override=null){
 const c=current();if(!running||session.phase==='lesson'||!c||c.done)return;
 audio()?.resume?.().catch(()=>{});tick();
 const value=response??(c.spec.kind==='key'?parseEntry():null),feedback=correct?null:(override||K.feedback(c.spec,value));
 c.attempts||=[];if(c.attempts.length<30)c.attempts.push({id:uid(),at:Date.now(),response:value,display:c.spec.kind==='choice'?(c.spec.choices.find(o=>o.v===value)?.t||String(value)):c.spec.kind==='parts'?String(value):q.entry,correct,feedback:feedback?.tag||null});
 document.querySelectorAll('[data-confidence]').forEach(b=>b.disabled=true);
 if(correct){settle(!c.tries&&!c.hints&&!c.lessonHelp&&!c.repeated&&c.confidence!=='guess',false);if(btn)btn.classList.add('right');}
 else{
  c.tries++;q.tries=c.tries;padLocked=false;
  c.lastFeedback=feedback.message;$('quizSpeech').textContent=c.lastFeedback;$('obstacleRow').hidden=false;
  $('revealButton').hidden=c.tries<2;
  if(btn){btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),500);}
  sndOops();stopAllAudio();if(wrongVoice)playVoice('retry');
  persist();
 }
}
function settle(independent,revealed,manual=false){
 const c=current();if(!c||c.done)return;
 tick();c.done=true;c.revealed=revealed;padLocked=true;
 c.feedback=manual?'Saved for a grown-up’s review.':revealed?'Let’s learn from this. '+c.spec.fact:independent?'You worked it out! '+c.spec.fact:c.confidence==='guess'?'You found the answer. Let’s check why it works. '+c.spec.fact:c.repeated?'A familiar question! Let’s try another one next. '+c.spec.fact:'You got there with help. '+c.spec.fact;
 const event={id:c.id,session:session.id,skill:c.spec.skill,year:c.spec.year,tier:c.spec.tier,at:Date.now(),independent:!!independent,correct:!revealed&&!manual,manual,lessonHelp:!!c.lessonHelp,hints:c.hints,tries:c.tries,revealed,elapsedMs:c.elapsed+Math.max(0,Date.now()-c.started),signature:c.spec.signature,question:c.spec.qtext,answer:c.spec.ans,notes:c.notes,strokes:c.strokes,attempts:c.attempts||[],confidence:c.confidence||'unreported',obstacle:c.obstacle||null,phase:c.phase||'practice',reviewGapMs:Math.max(0,Math.min(c.reviewGapMs||0,c.started-L.exposure(learning,c.spec.skill))),form:K.form(c.spec),repeated:!!c.repeated,course:session.kind==='course',activeMs:c.activeMs??null,answerDisplay:answerText(),money:!!c.spec.money,updatedAt:Date.now()};
 learning=L.merge(learning,{events:[event]});session.results.push(event);
 const nextEvidence=L.evidence(learning,c.spec.skill);
 // Offer two smaller foundation steps inside a daily session. Explicit focus
 // and check-in sessions stay on the parent/learner's chosen path.
 if((session.kind==='daily'||session.kind==='course')&&nextEvidence.reteach){
  const prerequisite=C.skills.find(s=>s.id===C.skills.find(s=>s.id===c.spec.skill)?.prerequisite&&s.year===session.year&&!s.manual);
  session.repairs||={};
  if(prerequisite&&!session.repairs[c.spec.skill]&&!L.evidence(learning,prerequisite.id).secure){
   session.repairs[c.spec.skill]=true;
   for(let i=session.index+1;i<Math.min(session.queue.length,session.index+3);i++)session.queue[i]=prerequisite.id;
   c.feedback+=` Next we’ll practise ${prerequisite.name.toLowerCase()} to help with this idea.`;
  }
 }
 changed();
 if(!manual&&session.kind!=='checkin')c.feedback+=' '+(nextEvidence.reteach?'We’ll revisit the idea before the next question.':nextEvidence.change==='stretch'?'You’re ready for a little more challenge.':nextEvidence.change==='support'?'Let’s use a smaller step next.':'');
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
 const c=current();if(!running||session.phase==='lesson'||!c||c.done)return;
 c.hints++;renderHint();stopAllAudio();playVoice('hint');persist();
}
function finish(){
 running=false;stopAllAudio();mode='home';show('summary');
 const results=session.results,ind=results.filter(L.independent).length,supported=results.length-ind;
 $('summaryStats').innerHTML=`<span class="summary-stat">${ind}</span> independent ${ind===1?'answer':'answers'} <span class="muted">· ${supported} other completed</span>`;
 $('summaryList').innerHTML=results.map(e=>`<div class="result-row"><span>${esc(C.skills.find(s=>s.id===e.skill)?.name||e.skill)}</span><span>${esc(HanaReview.category(e))}</span></div>`).join('');
 session.index=session.queue.length;persist();renderHome();
}
function next(){
 if(!current()?.done)return;
 stopAllAudio();session.index++;if(session.index>=session.queue.length)finish();else makeQuestion();
}
function renderMap(){
 const pool=C.skills.filter(s=>s.year===year),topics=[...new Set(pool.map(s=>s.topic))];
 $('skillMap').innerHTML=topics.map(topic=>`<section class="skill-group"><h3>${esc(topic)}</h3><div class="skill-grid">${pool.filter(s=>s.topic===topic).map(s=>{const e=L.evidence(learning,s.id);return `<button class="skill-tile" data-skill="${s.id}" data-secure="${e.secure}">${esc(s.name)}<small>${s.manual?'Lesson + drawing · grown-up review':(learning.lessons[s.id]?'Lesson explored · ':'Learn first · ')+e.label+(e.due?' · Ready to review':'')}</small></button>`;}).join('')}</div></section>`).join('');
 $('skillMap').querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{$('mapDialog').close();start('focus',b.dataset.skill);});
}
function renderReport(){
 $('learningReport').innerHTML=[3,4].map(y=>`<strong>Primary ${y}</strong>`+C.skills.filter(s=>s.year===y).map(s=>{const e=L.evidence(learning,s.id),manual=learning.events.filter(e=>e.skill===s.id&&e.manual);return `<div class="result-row"><span>${esc(s.name)}</span><span>${s.manual?manual.length+' saved for review':(learning.lessons[s.id]?'Lesson explored · ':'')+(e.total?e.success+'/'+e.recent+' independent recently · level '+e.tier+' · '+e.label:'No practice evidence yet')}</span></div>`;}).join('')).join('<br>');
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
 const event=learning.events.find(e=>e.id===c.id);if(event){event.notes=c.notes;event.strokes=c.strokes;event.updatedAt=Date.now();changed();schedulePush();}
 persist();
}
$('answerForm').onsubmit=e=>{
 e.preventDefault();if(padLocked||!current())return;
 const text=$('typedAnswer').value.trim();
 if(!/^\d+(?:\.\d{1,3})?$/.test(text)||(q.money&&!/^\d+(?:\.\d{1,2})?$/.test(text))||(!q.allowDot&&text.includes('.'))){$('quizSpeech').textContent=q.allowDot?'Enter a number, using a decimal point if needed.':'Enter a whole number.';return;}
 q.entry=text;current().entry=text;submitEntry();
};
for(const b of document.querySelectorAll('[data-confidence]'))b.onclick=()=>{const c=current();if(!c||c.done||c.attempts?.length)return;c.confidence=b.dataset.confidence;document.querySelectorAll('[data-confidence]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));persist();};
for(const b of document.querySelectorAll('[data-obstacle]'))b.onclick=()=>{const c=current();if(!c||c.done)return;c.obstacle=b.dataset.obstacle;document.querySelectorAll('[data-obstacle]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));persist();};
$('typedAnswer').oninput=()=>{q.entry=$('typedAnswer').value;saveDraft();};
$('startDaily').onclick=()=>start('daily');$('startCheckin').onclick=()=>start('checkin');
$('resumeSession').onclick=()=>{if(!session)return;year=session.year;renderHome();renderCurrent();};
$('nextQuestion').onclick=next;$('hintButton').onclick=hint;$('revealButton').onclick=()=>settle(false,true);
$('manualDone').onclick=()=>settle(false,false,true);
$('listenQuestion').onclick=()=>{if(soundOn&&ttsAllowed()){stopAllAudio();say(q.phrase);}};
$('useKeyboard').onclick=()=>setInput('keyboard');$('useKeypad').onclick=()=>setInput('pad');$('useWriting').onclick=()=>setInput('write');
$('dockHome').onclick=home;$('summaryHome').onclick=home;$('summaryAgain').onclick=()=>start(session?.kind==='course'?'course':'daily');
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
document.addEventListener('visibilitychange',()=>{tick();if(document.hidden){saveDraft();stopAllAudio();}});
window.addEventListener('pagehide',()=>{tick();saveDraft();});
window.HanaStudio={partsMarkup,ready:()=>ready,active:()=>running&&session?.phase!=='lesson'&&!!current(),renderCurrent,answer,answerUI,setInput,hint,pause,saveDraft,renderReport,reload,getYear:()=>year,getLearning:()=>learning,mergeLearning:async other=>{await saveChain.catch(()=>{});const local=readJSON(await store.get('hq_learning'),{});learning=L.merge(L.merge(local,learning),other);await store.set('hq_learning',JSON.stringify(learning));renderHome();changed();},start,getSession:()=>session};
$('startDaily').disabled=true;$('startCheckin').disabled=true;
Promise.resolve(window.hanaBoot).then(reload).then(()=>{ready=true;renderHome();}).catch(()=>{ready=true;renderHome();});
})();
