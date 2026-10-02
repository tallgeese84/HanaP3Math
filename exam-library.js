/* Large private packs live in their own IndexedDB, outside progress/cloud sync. */
(function(){
'use strict';
const $=id=>document.getElementById(id),B=HanaExamBank,esc=HanaCurriculum.esc;
let packs=[],db=null,opened=null,page=0,keys=false;
const dialog=document.createElement('dialog');dialog.id='examLibrary';dialog.className='studio-dialog';
dialog.innerHTML='<div class="dialog-head"><h2>My exam papers</h2><button class="btn" id="closeExamLibrary">Close</button></div><p>Import your Hana question packs once on each device. Verified questions join adaptive practice; the original pages are here for work on paper.</p><label class="btn">Import question packs <input id="examFiles" type="file" accept=".json,application/json" multiple disabled></label><p id="examStatus" role="status">Opening private storage…</p><div id="examList"></div><div id="examReader" hidden></div>';
document.body.append(dialog);
const btn=document.createElement('button');btn.id='openExamLibrary';btn.className='btn';btn.textContent='My exam papers';$('openProgress').after(btn);
btn.onclick=()=>{$('moreDialog').close();render();dialog.showModal();};$('closeExamLibrary').onclick=()=>{dialog.close();opened=null;$('examReader').innerHTML='';};
const practice=document.createElement('button');practice.className='btn';practice.id='startExamPractice';practice.textContent='Exam practice';practice.hidden=true;$('startDaily').after(practice);
practice.onclick=()=>{if(!B.queue(packs,HanaStudio.getLearning(),HanaStudio.getYear()).length){render();$('examStatus').textContent='Import a Primary '+HanaStudio.getYear()+' pack to practise this year.';dialog.showModal();return;}HanaStudio.start('exam');};
function transaction(mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction('packs',mode);fn(tx.objectStore('packs'));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage cancelled.'));});}
function render(){
 $('examList').innerHTML=packs.length?packs.map((p,i)=>`<section class="card"><h3>${esc(p.title)}</h3><p>${p.questions.length} verified practice questions · ${p.papers.length} original papers</p>${p.notes?.map(n=>`<p class="map-note">${esc(n)}</p>`).join('')||''}${p.papers.map((s,j)=>`<button class="btn" data-paper="${i},${j}">${esc(s.title)}</button>`).join(' ')}<p><button class="text-action" data-remove="${i}">Remove this pack from this device</button></p></section>`).join(''):'<p>No question packs imported yet.</p>';
 $('examList').querySelectorAll('[data-paper]').forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.paper.split(',').map(Number);opened=packs[i].papers[j];page=0;keys=false;reader();});
 $('examList').querySelectorAll('[data-remove]').forEach(b=>b.onclick=async()=>{const p=packs[+b.dataset.remove];if(!confirm('Remove '+p.title+' from this device? Learning progress is kept.'))return;try{await transaction('readwrite',s=>s.delete(p.id));packs=packs.filter(x=>x.id!==p.id);opened=null;$('examReader').hidden=true;render();}catch(e){$('examStatus').textContent='Could not remove the pack: '+e.message;}});
 practice.hidden=!packs.some(p=>p.questions.length);practice.disabled=!HanaStudio?.ready();
}
function reader(){
 const pages=opened.pages.map((p,i)=>({...p,n:i+1})).filter(p=>keys||!p.answerKey);page=Math.max(0,Math.min(page,pages.length-1));const pg=pages[page];
 $('examReader').hidden=false;$('examReader').innerHTML=`<h3>${esc(opened.title)}</h3><p>Original page ${pg.n} · Use paper and pencil. This viewer does not grade working or add mastery.</p><div class="session-actions"><button class="btn" id="examPrev" ${page===0?'disabled':''}>Previous page</button><button class="btn" id="examNext" ${page===pages.length-1?'disabled':''}>Next page</button><button class="btn" id="examKeys">${keys?'Hide':'Show'} answer-key pages</button></div><img class="exam-page" alt="${esc(opened.title)}, original page ${pg.n}" src="${pg.image}">`;
 $('examPrev').onclick=()=>{page--;reader();};$('examNext').onclick=()=>{page++;reader();};$('examKeys').onclick=()=>{keys=!keys;page=keys?Math.max(0,opened.pages.findIndex(p=>p.answerKey)):0;reader();};$('examReader').scrollIntoView?.({block:'start'});
}
$('examFiles').onchange=async e=>{
 const files=[...e.target.files];e.target.disabled=true;
 try{
  if(!db)throw Error('Private storage is unavailable in this browser.');
  for(const [i,f]of files.entries()){
   $('examStatus').textContent=`Importing ${i+1} of ${files.length}: ${f.name}`;
   if(f.size>40000000)throw Error('Each pack must be smaller than 40 MB.');
   const pack=B.validate(JSON.parse(await f.text()));
   await transaction('readwrite',s=>s.put(pack));packs=[...packs.filter(p=>p.id!==pack.id),pack];
  }
  $('examStatus').textContent=`Ready: ${packs.reduce((n,p)=>n+p.questions.length,0)} verified questions. Paper pages stay on this device; answers join the normal progress report.`;
 }catch(err){$('examStatus').textContent='Import stopped. Completed imports are kept. '+err.message;}
 finally{e.target.disabled=false;e.target.value='';render();}
};
window.HanaExams={select:(state,skill,tier,options)=>B.select(packs,state,skill,tier,options),queue:(state,year)=>B.queue(packs,state,year)};
Promise.resolve(window.hanaBoot).then(()=>new Promise((resolve,reject)=>{
 const r=indexedDB.open('hana-private-exams',1);r.onupgradeneeded=()=>r.result.createObjectStore('packs',{keyPath:'id'});r.onerror=()=>reject(r.error);r.onsuccess=()=>{db=r.result;const q=db.transaction('packs').objectStore('packs').getAll();q.onsuccess=()=>{packs=q.result.map(B.validate);resolve();};q.onerror=()=>reject(q.error);};
})).then(()=>{$('examFiles').disabled=false;$('examStatus').textContent='Ready to import your packs.';render();}).catch(()=>{$('examStatus').textContent='Private storage is unavailable. Normal practice still works.';});
window.addEventListener('hana:learning-changed',render);
})();
