/* Hana adapter: replace at most three ordinary focus slots, keep reviews and word problems. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./nightly-priority-core.js'));else root.HanaNightly=factory(root.FamilyNightlyCore);})(typeof globalThis==='undefined'?this:globalThis,function(Core){
'use strict';
function prioritize(base,plan,state,skills,K,L,now=Date.now()){
 const out={...base,queue:[...base.queue],nightlySlots:[]};
 if(!Core.usable(plan,now))return out;
 const used=(state.events||[]).filter(e=>e.nightlyPlan?.sessionDate===plan.sessionDate).length;
 let left=Math.max(0,3-used);if(!left)return out;
 const index=K.UNITS.findIndex(u=>u.id===base.unit),allowed=new Set(K.UNITS.slice(0,index<0?K.UNITS.length:index+1).flatMap(u=>u.skills));
 const byId=id=>skills.find(s=>s.id===id),ev=id=>L.evidence(state,id,now);
 const targets=[...new Set(plan.subjects.maths.skills.filter(id=>allowed.has(id)&&byId(id)&&!byId(id).manual).map(id=>{
  const seen=new Set();let s=byId(id);
  while(s?.prerequisite&&!seen.has(s.id)&&!ev(s.prerequisite).secure){seen.add(s.id);s=byId(s.prerequisite);}
  return s?.id;
 }).filter(Boolean))];
 if(!targets.length)return out;
 const protectedIds=new Set([...(base.reviews||[]),...(base.wordProblems||[]),...(base.status?.repairs||[]).map(r=>r.skill)]);
 let n=0;
 out.queue=base.queue.map((id,i)=>{
  if(!left||id!==base.focus||protectedIds.has(id)||ev(id).due)return id;
  const chosen=targets[n++%targets.length];left--;out.nightlySlots.push(i);return chosen;
 });
 if(out.nightlySlots.length)out.nightlyPlan=Core.identity(plan);
 return out;
}
const api={prioritize};
if(typeof window!=='undefined'){
 const config=()=>{try{return JSON.parse(localStorage.getItem('hq_review_mirror_v1')||'{}');}catch(_){return {};}};
 const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
 const client=Core.create({student:'Hana',catalog:{maths:id=>HanaCurriculum.skills.some(s=>s.id===id&&!s.manual)},config,storage:localStorage,key:'hana_nightly_priorities_v1',request:(...args)=>fetch(...args),hash,online:()=>navigator.onLine!==false,onChange:paint});
 Object.assign(api,client);
 function paint(){const report=client.report(),el=document.getElementById('hanaNightlyStatus');if(el)el.textContent=report.status+(report.received?' Plan '+report.received.sessionDate+', revision '+report.received.revision+'.':'');const home=document.getElementById('hanaNightlyFocus');if(home){const p=client.plan();home.textContent=p?p.subjects.maths.focus:'Today’s session adapts to your learning.';}}
 function mount(){
  const anchor=document.getElementById('mirrorSettings');if(anchor&&!document.getElementById('hanaNightlySettings')){
   const box=document.createElement('details');box.id='hanaNightlySettings';box.innerHTML='<summary>Nightly priorities</summary><p>Uses your existing private family connection. Priorities guide the next session; saved work and scheduled review come first.</p><button type="button" class="btn" id="hanaNightlyRefresh">Check plan connection</button><p id="hanaNightlyStatus" role="status"></p>';anchor.after(box);document.getElementById('hanaNightlyRefresh').onclick=()=>client.refresh(true);
  }
  const card=document.getElementById('courseMeta');if(card&&!document.getElementById('hanaNightlyFocus')){const p=document.createElement('p');p.id='hanaNightlyFocus';p.className='muted';card.after(p);}paint();
 }
 window.addEventListener('hana:mirror-settings',()=>{client.invalidate();client.refresh(true);});
 window.addEventListener('online',()=>client.refresh(true));
 window.addEventListener('storage',e=>{if(e.key==='hq_review_mirror_v1'){client.invalidate();client.refresh(true);}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')client.refresh();});
 Promise.resolve(window.hanaBoot).then(async()=>{mount();await client.initialize();await client.refresh(true);});
}
return api;
});
