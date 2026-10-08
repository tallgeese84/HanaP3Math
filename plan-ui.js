/* Course card on the home screen, checkpoint papers and the parent's June plan.
 * Child-facing views stay positive: pace warnings appear only in the parent view. */
(function(){
'use strict';
const $=id=>document.getElementById(id),C=HanaCurriculum,K=HanaCourse,P=HanaPapers,esc=C.esc;
const DAY=86400000;
const learning=()=>HanaStudio.getLearning();
const fmtDate=t=>new Date(t).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'});
const shortDate=t=>new Date(t).toLocaleDateString('en-SG',{day:'numeric',month:'short'});
let paper=null,paperTimer=null,lastTick=0,stroke=null;

/* ---------- home ---------- */
const card=document.createElement('section');card.className='course-card';card.id='courseCard';card.setAttribute('aria-labelledby','courseTitle');
card.innerHTML=`<div class="course-top"><span class="eyebrow">Road to Singapore P4</span><span class="course-week" id="courseWeek"></span></div><h3 id="courseTitle">Your learning path</h3><div class="course-bar" aria-hidden="true"><span id="courseFill"></span></div><p class="course-meta" id="courseMeta"></p><div class="home-actions"><button class="btn primary" id="startCourse">Today’s session →</button><button class="btn" id="resumePaper" hidden>Continue checkpoint</button><button class="btn" id="startPaper" hidden></button></div>`;
const actions=document.querySelector('#scr-home .home-actions');actions.before(card);
$('startDaily').classList.remove('primary');$('startDaily').textContent='Free practice';
const note=actions.nextElementSibling;if(note&&note.classList.contains('muted'))note.textContent='Today’s session: about 20 minutes · lessons, word problems and review · No timer';
$('startCourse').onclick=()=>HanaStudio.start('course');
$('startPaper').onclick=()=>{const st=K.status(learning(),C.skills);if(st.nextCheckpoint)openPaper(P.build(st.nextCheckpoint.id,C.skills));};
$('resumePaper').onclick=()=>resumePaper();

function renderHome(){
 if(!window.HanaStudio)return;
 const st=K.status(learning(),C.skills),u=st.current,idx=u?K.UNITS.findIndex(x=>x.id===u.id)+1:K.UNITS.length;
 $('courseTitle').textContent=u?`Unit ${idx} of ${K.UNITS.length} · ${u.title}`:'Every unit explored. Keep reviewing!';
 $('courseFill').style.width=Math.round(st.progressPct*100)+'%';
 const next=u?u.list.find(x=>x.status!=='ready'&&x.status!=='secure'):null;
 $('courseMeta').textContent=`${Math.round(st.progressPct*100)}% of the path${next?` · Next: ${next.name}`:''}`;
 $('courseWeek').textContent=st.weekSessions?'This week '+'★'.repeat(Math.min(st.weekSessions,10)):'';
 const cp=st.nextCheckpoint;$('startPaper').hidden=!cp||!!pendingPaper;
 if(cp)$('startPaper').textContent=`${cp.title.split(' · ')[0]} →`;
 $('resumePaper').hidden=!pendingPaper;
 $('startCourse').disabled=!HanaStudio.ready();
}

/* ---------- checkpoint paper ---------- */
const screen=document.createElement('main');screen.className='screen';screen.id='scr-paper';screen.setAttribute('aria-labelledby','paperTitle');
screen.innerHTML=`<div class="practice-meta"><span id="paperBadge">Checkpoint</span><span id="paperCount"></span></div><progress id="paperProgress" value="0" max="1" aria-label="Checkpoint progress"></progress><h2 id="paperTitle" tabindex="-1"></h2><div id="paperBody"></div>`;
$('scr-summary').after(screen);screens.paper='scr-paper';
let pendingPaper=null;
async function loadPending(){try{const raw=JSON.parse(await store.get('hq_paper')||'null');pendingPaper=raw&&Array.isArray(raw.items)&&!raw.complete?raw:null;}catch{pendingPaper=null;}renderHome();}
function savePaper(){if(paper&&!paper.complete){pendingPaper=paper;store.set('hq_paper',JSON.stringify(paper));}}
function tickPaper(){const now=Date.now();if(paper&&!paper.complete&&$('scr-paper').classList.contains('on')&&!document.hidden&&paper.view==='question')paper.elapsedMs=(paper.elapsedMs||0)+Math.min(5000,now-lastTick);lastTick=now;const t=$('paperTime');if(t)t.textContent=Math.floor((paper?.elapsedMs||0)/60000)+' min';}
function openPaper(p){HanaStudio.pause();paper={...p,view:'intro',index:0,elapsedMs:0};savePaper();mode='paper';show('paper');render();}
function resumePaper(){if(!pendingPaper)return;HanaStudio.pause();paper=pendingPaper;if(paper.view==='results')paper.view='question';mode='paper';show('paper');render();}
function leavePaper(){savePaper();clearInterval(paperTimer);paperTimer=null;}
function render(){
 clearInterval(paperTimer);lastTick=Date.now();paperTimer=setInterval(tickPaper,5000);
 $('paperBadge').textContent=paper.style||'Checkpoint';
 if(paper.view==='intro')return renderIntro();
 if(paper.view==='results')return renderResults();
 renderQuestion();
}
function renderIntro(){
 const counts=['A','B','C'].map(s=>paper.items.filter(i=>i.section===s));
 $('paperTitle').textContent=paper.title;$('paperCount').textContent=`${paper.max} marks`;$('paperProgress').value=0;
 $('paperBody').innerHTML=`<article class="card paper-intro"><p>This is a practice checkpoint inspired by Singapore school papers. It shows us what you know and what to practise next. It’s fine not to know everything yet.</p><ul><li><strong>Section A</strong> · ${counts[0].length} multiple-choice questions</li><li><strong>Section B</strong> · ${counts[1].length} short questions, 2 marks each</li><li><strong>Section C</strong> · ${counts[2].length} word problems. Draw a model and show your working.</li></ul><p class="muted">This is an answer-check score. Written method marks need a grown-up’s review. No hints or lessons during the checkpoint. You can skip a question and come back. Suggested practice time: ${paper.minutes} minutes; take the time you need. You can stop and continue later.</p></article><div class="session-actions"><button class="btn" id="paperLater">Not now</button><button class="btn primary" id="paperBegin">Begin →</button></div>`;
 $('paperLater').onclick=()=>{leavePaper();HanaStudio.pause();mode='home';show('home');renderHome();};
 $('paperBegin').onclick=()=>{paper.view='question';paper.startedAt=paper.startedAt||Date.now();savePaper();render();};
}
const sectionName={A:'Section A · Multiple choice',B:'Section B · Short answer',C:'Section C · Word problems'};
function renderQuestion(){
 const it=paper.items[paper.index],s=it.spec,n=paper.items.length;
 $('paperTitle').textContent=sectionName[it.section];
 $('paperCount').innerHTML=`Question ${paper.index+1} of ${n} · ${it.marks} mark${it.marks>1?'s':''} · <span id="paperTime">${Math.floor((paper.elapsedMs||0)/60000)} min</span>`;
 $('paperProgress').max=n;$('paperProgress').value=paper.items.filter(i=>answered(i)).length;
 let answer='';
 if(s.kind==='choice')answer=`<div class="choices paper-choices">${s.choices.map((c,i)=>`<button data-opt="${i}" aria-pressed="${it.response===c.v}">(${i+1}) ${esc(c.t)}</button>`).join('')}</div>`;
 else if(s.kind==='key')answer=`<form class="answer-form" id="paperKey"><label for="paperInput">${s.money?'$':''}</label><input id="paperInput" inputmode="${s.money||s.dec?'decimal':'numeric'}" autocomplete="off" placeholder="Your answer…" value="${esc(it.response??'')}">${s.unit&&!s.money?`<span class="part-unit">${esc(s.unit)}</span>`:''}</form>`;
 else if(s.kind==='parts')answer=`<form class="parts-form" id="paperParts"><div class="parts-fields">${HanaStudio.partsMarkup(s)}</div></form>`;
 const working=it.section==='C'?`<div class="paper-working"><div class="working-head"><strong>Working</strong><span class="muted">Draw your bar model and steps here</span><button type="button" class="text-action" id="workUndo">Undo</button><button type="button" class="text-action" id="workClear">Clear</button></div><canvas id="workPad" aria-label="Working space"></canvas></div>`:'';
 $('paperBody').innerHTML=`<article class="card"><div class="qtext">${esc(s.qtext)}</div><div class="paper-vis">${s.vis||''}</div></article>${working}<div class="card paper-answer"><p class="session-context">${it.section==='C'?'Answer':'Your answer'}${s.kind==='key'&&s.money?' (in dollars and cents)':''}</p>${answer}</div><div class="paper-nav">${paper.items.map((x,i)=>`<button data-go="${i}" class="${answered(x)?'done':''}" aria-current="${i===paper.index}" aria-label="Question ${i+1}${answered(x)?', answered':''}">${i+1}</button>`).join('')}</div><div class="session-actions"><button class="btn" id="paperPause">Stop for now</button><button class="btn" id="paperPrev" ${paper.index?'':'disabled'}>← Back</button>${paper.index<n-1?'<button class="btn primary" id="paperNext">Next →</button>':'<button class="btn primary" id="paperFinish">Finish checkpoint</button>'}</div>`;
 const set=v=>{it.response=v;savePaper();};
 $('paperBody').querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{set(s.choices[+b.dataset.opt].v);$('paperBody').querySelectorAll('[data-opt]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));refreshNav();});
 if($('paperInput')){$('paperInput').oninput=e=>{set(e.target.value.trim());refreshNav();};$('paperKey').onsubmit=e=>{e.preventDefault();move(1);};}
 if($('paperParts')){const saved=it.response||{};$('paperParts').querySelectorAll('[data-part]').forEach(i=>{i.value=saved[i.dataset.part]??'';i.oninput=()=>{const v={};$('paperParts').querySelectorAll('[data-part]').forEach(x=>v[x.dataset.part]=x.value.replace(/\D/g,'').slice(0,6));set(Object.values(v).some(Boolean)?v:null);refreshNav();};});$('paperParts').onsubmit=e=>{e.preventDefault();move(1);};}
 $('paperBody').querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{paper.index=+b.dataset.go;savePaper();renderQuestion();});
 $('paperPause').onclick=()=>{leavePaper();HanaStudio.pause();mode='home';show('home');renderHome();};
 if($('paperPrev'))$('paperPrev').onclick=()=>move(-1);if($('paperNext'))$('paperNext').onclick=()=>move(1);if($('paperFinish'))$('paperFinish').onclick=finishPaper;
 if(it.section==='C')setupWorking(it);
}
function refreshNav(){const it=paper.items[paper.index];const b=$('paperBody').querySelector(`[data-go="${paper.index}"]`);if(b)b.classList.toggle('done',answered(it));$('paperProgress').value=paper.items.filter(i=>answered(i)).length;}
function answered(it){const r=it.response;return r!=null&&r!==''&&!(typeof r==='object'&&!Object.values(r).some(Boolean));}
function move(d){paper.index=Math.max(0,Math.min(paper.items.length-1,paper.index+d));savePaper();renderQuestion();$('paperTitle').focus();}
function setupWorking(it){
 const cv=$('workPad'),draw=()=>{const r=cv.getBoundingClientRect();if(!r.width)return;const dpr=Math.min(2,devicePixelRatio||1);cv.width=r.width*dpr;cv.height=r.height*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);x.lineWidth=2.5;x.lineCap=x.lineJoin='round';x.strokeStyle='#55317e';for(const st of [...(it.working||[]),...(stroke?[stroke]:[])]){x.beginPath();st.forEach(([a,b],i)=>i?x.lineTo(a*r.width,b*r.height):x.moveTo(a*r.width,b*r.height));x.stroke();}};
 const pt=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
 cv.onpointerdown=e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);stroke=[pt(e)];};
 cv.onpointermove=e=>{if(!stroke)return;e.preventDefault();if(stroke.length<800)stroke.push(pt(e));draw();};
 cv.onpointerup=cv.onpointercancel=()=>{if(!stroke)return;it.working=[...(it.working||[]),stroke].slice(-80);stroke=null;savePaper();draw();};
 $('workUndo').onclick=()=>{(it.working||[]).pop();savePaper();draw();};$('workClear').onclick=()=>{it.working=[];savePaper();draw();};
 requestAnimationFrame(draw);
}
async function finishPaper(){
 const blank=paper.items.filter(i=>!answered(i)).length;
 if(blank&&!confirm(`${blank} question${blank>1?'s are':' is'} not answered yet. Finish anyway?`))return;
 tickPaper();
 const scored=P.score({...paper,items:paper.items.map(i=>({...i,response:i.response??null}))},C.skills),rec=P.record(scored);
 rec.items.forEach((x,i)=>x.working=paper.items[i].working||null);
 await HanaStudio.mergeLearning({papers:[rec]});
 if(typeof schedulePush==='function')schedulePush();
 paper={...paper,complete:true,view:'results',result:rec};pendingPaper=null;await store.set('hq_paper','null');
 if(soundOn&&typeof sndGood==='function')sndGood();
 render();renderHome();
}
function renderResults(){
 const r=paper.result,pct=Math.round(r.pct*100);
 $('paperTitle').textContent='Checkpoint complete. Well done for finishing!';$('paperCount').textContent=r.title;$('paperProgress').value=$('paperProgress').max;
 $('paperBody').innerHTML=`<article class="card paper-score"><div class="score-big">${r.score}<small> / ${r.max}</small></div><p>${esc(r.band)} · ${pct}% of answer-check points</p><p class="map-note">Working is saved for a grown-up. Method marks are not graded automatically; this is not a school exam grade.</p>${r.sections.map(s=>`<div class="section-bar"><span>Section ${s.id}</span><div><i style="width:${s.max?Math.round(100*s.earned/s.max):0}%"></i></div><b>${s.earned}/${s.max}</b></div>`).join('')}</article><details class="card"><summary>See each question</summary>${r.items.map((i,k)=>`<div class="paper-review ${i.earned===i.marks?'ok':''}"><strong>${k+1}. ${esc(i.qtext)}</strong><span>Your answer: ${esc(i.response||'(none)')} · Answer: ${esc(String(i.answer))} · ${i.earned}/${i.marks}</span>${i.earned<i.marks?`<small>${esc(i.solution||'')}</small>`:''}</div>`).join('')}</details><p class="muted">Your next sessions will practise the questions that were tricky. A grown-up can see the full report in More → Hana’s progress.</p><div class="session-actions"><button class="btn primary" id="paperDone">Back to my studio</button></div>`;
 $('paperDone').onclick=()=>{paper=null;clearInterval(paperTimer);mode='home';show('home');renderHome();};
}
for(const id of ['dockHome','backBtn'])$(id).addEventListener('click',()=>{if(paper&&!paper.complete)leavePaper();},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){tickPaper();savePaper();}});

/* ---------- parent plan ---------- */
const panel=document.createElement('section');panel.id='planPanel';panel.className='plan-panel';
$('progressBody').before(panel);
$('openProgress').addEventListener('click',renderPanel);
const stateLabel={'not-started':'Starts soon','on-track':'On track','slightly-behind':'Slightly behind','behind':'Behind plan'};
function renderPanel(){
 const st=K.status(learning(),C.skills),s=st.settings,papers=learning().papers||[];
 const unitRows=st.units.map((u,i)=>`<tr class="${u.done?'done':u===st.current?'now':''}"><td>${i+1}. ${esc(u.title)}<small>P${u.year}</small></td><td>${shortDate(u.from)} – ${shortDate(u.due)}</td><td>${u.ready}/${u.skills.length}</td></tr>`).join('');
 const cpRows=st.checkpoints.map(cp=>{const p=cp.last;return `<li><strong>${esc(cp.title)}</strong> <span class="muted">· planned ${shortDate(cp.plannedFor)}</span><br>${p?`${p.score}/${p.max} (${Math.round(p.pct*100)}%, ${esc(p.band)}) on ${fmtDate(p.at)}`:cp.due?'<em>Ready to take now</em>':'Not yet'}${p?`<details><summary>Topics &amp; recommendations</summary><ul>${p.recs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><table class="mini-table">${p.topics.map(t=>`<tr><td>${esc(t.topic)}</td><td>${t.earned}/${t.max}</td></tr>`).join('')}</table></details>`:''}</li>`;}).join('');
 const practice=papers.filter(p=>!K.CHECKPOINTS.some(c=>c.id===p.cp));
 panel.innerHTML=`<h3>June plan · Road to Singapore P4</h3>
 <div class="plan-status" data-state="${st.state}"><strong>${stateLabel[st.state]}</strong><span>${Math.round(st.progressPct*100)}% done · plan expects ${Math.round(st.expectedPct*100)}% today · target ${fmtDate(K.date(s.target))} (${st.daysLeft} days)</span></div>
 <ul class="plan-advice">${[...st.advice,...st.adjust.notes].map(a=>`<li>${esc(a)}</li>`).join('')||'<li>No changes needed.</li>'}${st.repairs.length?`<li>Repairing after the last checkpoint: ${esc(st.repairs.map(r=>C.skills.find(k=>k.id===r.skill)?.name).join(', '))}.</li>`:''}</ul>
 <details open><summary>Units and dates</summary><table class="mini-table plan-units"><thead><tr><th>Unit</th><th>Planned</th><th>Skills ready</th></tr></thead><tbody>${unitRows}</tbody></table><p class="map-note">A skill is ready after three recent independent answers, including two at level 2 or 3. Final ${s.consolidationWeeks} weeks before the target are kept for review and Checkpoint 5.</p></details>
 <details open><summary>Checkpoints</summary><ol class="plan-cps">${cpRows}</ol>${practice.length?`<p class="map-note">Practice checkpoints: ${practice.map(p=>`${p.score}/${p.max} on ${shortDate(p.at)}`).join(' · ')}</p>`:''}<div class="report-actions"><button class="btn" id="practicePaper">Start a practice checkpoint (everything so far)</button></div></details>
 <details><summary>Plan settings</summary><div class="plan-settings"><label>Start date <input type="date" id="planStart" value="${s.start}"></label><label>Target date <input type="date" id="planTarget" value="${s.target}"></label><label>Sessions per week <input type="number" id="planWeek" min="2" max="14" value="${s.perWeek}"></label><button class="btn" id="planSave">Save plan</button><p id="planSaved" role="status" class="map-note"></p></div><p class="map-note">Singapore Term 3 starts in late June. A target in early June leaves time to settle in.</p></details>`;
 $('practicePaper').onclick=()=>{const units=st.units.filter(u=>u.started).map(u=>u.id);if(!units.length){alert('Start the first unit before a practice checkpoint.');return;}$('progressDialog').close();openPaper(P.build('practice',C.skills,{units,title:'Practice checkpoint',size:'short'}));};
 $('planSave').onclick=async()=>{const start=$('planStart').value,target=$('planTarget').value,perWeek=parseInt($('planWeek').value,10);
  if(!start||!target||K.date(target)<=K.date(start)+28*DAY){$('planSaved').textContent='The target must be at least four weeks after the start.';return;}
  await HanaStudio.mergeLearning({course:{start,target,perWeek:Math.max(2,Math.min(14,perWeek||5)),updatedAt:Date.now()}});if(typeof schedulePush==='function')schedulePush();$('planSaved').textContent='Saved.';renderPanel();renderHome();};
}
window.addEventListener('hana:learning-changed',()=>renderHome());
window.HanaPlan={hasPendingPaper:()=>!!pendingPaper,resumePaper,renderHome,renderPanel,openPaper,status:()=>K.status(learning(),C.skills)};
Promise.resolve(window.hanaBoot).then(loadPending).catch(loadPending);
})();
