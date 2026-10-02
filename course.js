/* The road to Singapore P4: a fixed sequence of units from P3 into P4, paced to a
 * target date, with daily sessions that mix new learning, word problems and review.
 * Pure functions (no DOM) so the schedule and plans can be tested in Node.
 * Checkpoint results (papers.js) feed back into each session: missed skills are
 * repaired first and a weak word-problem section adds word problems. */
(function(root){
'use strict';
const node=typeof module==='object'&&module.exports;
const L=node?require('./learning.js'):root.HanaLearning;
const DAY=86400000,WEEK=7*DAY;
const UNITS=[
 {id:'u1',year:3,title:'Numbers to 10 000',skills:['p3-place','p3-patterns'],weeks:1.5},
 {id:'u2',year:3,title:'Add & subtract with stories',skills:['p3-addsub','p3-wppartwhole','p3-wpcompare'],weeks:2},
 {id:'u3',year:3,title:'Multiply & divide',skills:['p3-tables','p3-muldiv','p3-remainder','p3-wpgroups','p3-wptimes'],weeks:3},
 {id:'u4',year:3,title:'Money & metric measures',skills:['p3-money','p3-measure','p3-wpmoney'],weeks:2},
 {id:'u5',year:3,title:'Fractions',skills:['p3-equivalent','p3-fraccompare','p3-fracops'],weeks:2},
 {id:'u6',year:3,title:'Time & the 24-hour clock',skills:['p3-time'],weeks:1},
 {id:'u7',year:3,title:'Shapes, lines & bar graphs',skills:['p3-area','p3-angles','p3-lines','p3-drawlines','p3-bars','p3-story'],weeks:2},
 {id:'u8',year:4,title:'Numbers to 100 000',skills:['p4-place','p4-patterns','p4-round'],weeks:1.5},
 {id:'u9',year:4,title:'Factors & multiples',skills:['p4-factors'],weeks:1},
 {id:'u10',year:4,title:'Multiply & divide larger numbers',skills:['p4-multiply','p4-divide','p4-remainder','p4-wpgroups'],weeks:2.5},
 {id:'u11',year:4,title:'Model drawing: units, before & after',skills:['p4-wpunits','p4-wpbeforeafter'],weeks:2},
 {id:'u12',year:4,title:'Fractions',skills:['p4-mixed','p4-fracset','p4-fracops','p4-wpfraction'],weeks:3},
 {id:'u13',year:4,title:'Angles, rectangles & squares',skills:['p4-angles','p4-properties','p4-construct','p4-dimension','p4-composite','p4-wparea'],weeks:2.5},
 {id:'u14',year:4,title:'Tables & graphs',skills:['p4-tables','p4-linegraphs','p4-piecharts'],weeks:1},
 {id:'u15',year:4,title:'Decimals',skills:['p4-decimalplace','p4-decimalfraction','p4-decimalops','p4-decimalquotient','p4-wpdecimal'],weeks:3},
 {id:'u16',year:4,title:'Symmetry & nets',skills:['p4-symmetry','p4-drawsymmetry','p4-nets'],weeks:1}
];
const CHECKPOINTS=[
 {id:'cp1',after:'u3',title:'Checkpoint 1 · P3 numbers & operations',units:['u1','u2','u3'],size:'short',style:'Like a P3 weighted assessment'},
 {id:'cp2',after:'u7',title:'Checkpoint 2 · Primary 3 review',units:['u1','u2','u3','u4','u5','u6','u7'],size:'full',style:'Like a P3 end-of-year paper'},
 {id:'cp3',after:'u11',title:'Checkpoint 3 · P4 numbers & model drawing',units:['u8','u9','u10','u11'],review:['u2','u3','u4'],size:'short',style:'Like a P4 weighted assessment 1'},
 {id:'cp4',after:'u13',title:'Checkpoint 4 · P4 fractions & angles',units:['u8','u9','u10','u11','u12','u13'],review:['u4','u5','u6'],size:'full',style:'Like a P4 weighted assessment 2'},
 {id:'cp5',after:'u16',title:'Checkpoint 5 · Ready for Singapore P4',units:['u8','u9','u10','u11','u12','u13','u14','u15','u16'],review:['u3','u4','u5','u7'],size:'full',style:'P4 mixed-topic review'}
];
const TOTAL=UNITS.reduce((n,u)=>n+u.weeks,0);
const DEFAULTS={start:'2026-10-05',target:'2027-06-04',perWeek:5,questions:10,consolidationWeeks:3};
const date=s=>Date.parse(s+'T00:00:00');
const iso=t=>{const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const okDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(date(s));
function settings(state){
 const c=L.clean(state).course||{};
 const out={...DEFAULTS};
 if(okDate(c.start))out.start=c.start;
 if(okDate(c.target)&&date(c.target)>date(out.start)+4*WEEK)out.target=c.target;
 if(date(out.target)<=date(out.start)+4*WEEK)out.start=DEFAULTS.start;
 if(Number.isInteger(c.perWeek)&&c.perWeek>=2&&c.perWeek<=14)out.perWeek=c.perWeek;
 out.updatedAt=c.updatedAt||0;
 return out;
}
// Planned dates: units share the time between start and target, leaving
// consolidation weeks at the end for review and the final checkpoint.
function schedule(state){
 const s=settings(state),start=date(s.start),end=date(s.target)-s.consolidationWeeks*WEEK;
 const scale=(end-start)/WEEK/TOTAL;let acc=0;
 return UNITS.map(u=>{const from=start+acc*scale*WEEK;acc+=u.weeks;return {...u,from,due:start+acc*scale*WEEK};});
}
function skillStatus(state,id,skills,now=Date.now()){
 const s=L.clean(state),skill=skills.find(x=>x.id===id);
 if(!skill)return {status:'missing'};
 if(skill.manual){const saved=s.events.filter(e=>e.skill===id&&e.manual).length;return {status:saved&&s.lessons[id]?'ready':saved||s.lessons[id]?'started':'new',manual:true,saved};}
 const e=L.evidence(s,id,now),recent=s.events.filter(x=>x.skill===id&&!x.manual).slice(-8),strong=recent.filter(x=>L.independent(x)&&x.tier>=2).length;
 const status=e.secure?'secure':e.success>=3&&strong>=2?'ready':e.total||s.lessons[id]?'started':'new';
 return {status,evidence:e,attempts:e.total,strong};
}
const READY=new Set(['ready','secure']);
// Most recent checkpoint result per checkpoint; each missed skill needs two
// independent answers after the paper before it leaves the repair list.
function repairs(state,skills,now=Date.now()){
 const s=L.clean(state),latest=new Map(),out=new Map();
 // A retake clears a missed skill only if it actually reassesses that skill.
 // Several questions may share a skill; every one must be correct to clear it.
 for(const p of s.papers){
  if(p.complete===false)continue;
  const assessed=new Map();
  for(const it of p.items||[])if(it.skill)assessed.set(it.skill,!!assessed.get(it.skill)||it.earned<it.marks);
  for(const [skill,missed]of assessed)latest.set((p.cp||p.id)+'|'+skill,{p,skill,missed});
 }
 for(const {p,skill,missed}of latest.values())if(missed){
  const later=s.events.filter(e=>e.skill===skill&&e.at>p.at&&L.independent(e)).length;
  if(later<2&&skills.some(k=>k.id===skill))out.set(skill,{skill,paper:p.id,at:p.at,later});
 }
 return [...out.values()];
}
// Adjustments are recalculated from the latest checkpoint, never stored, so
// every family device reaches the same plan after a sync.
function adjustments(state){
 const p=L.clean(state).papers.filter(p=>p.complete!==false).at(-1);
 const out={wordProblems:2,review:3,notes:[]};
 if(!p)return out;
 const pc=k=>{const sec=(p.sections||[]).find(x=>x.id===k);return sec&&sec.max?sec.earned/sec.max:null;};
 const total=p.max?p.score/p.max:0,c=pc('C'),ab=(()=>{const a=(p.sections||[]).filter(x=>x.id!=='C');const m=a.reduce((n,x)=>n+x.max,0);return m?a.reduce((n,x)=>n+x.earned,0)/m:null;})();
 if(c!==null&&c<.6){out.wordProblems=3;out.notes.push('Word problems scored below 60% on the last checkpoint, so each session now includes 3 word problems.');}
 if(total<.5){out.review=4;out.notes.push('The last checkpoint was below 50%, so sessions add more review of earlier units before moving on.');}
 if(ab!==null&&ab<.7&&c!==null&&c>=.6)out.notes.push('Calculation questions (Sections A and B) need more accuracy: review questions now favour the skills missed on the paper.');
 if(total>=.85&&(c===null||c>=.75))out.notes.push('Strong checkpoint result: keep the planned pace.');
 return out;
}
function status(state,skills,now=Date.now()){
 const sched=schedule(state),s=settings(state),start=date(s.start);
 let progress=0;const units=sched.map(u=>{
  const list=u.skills.map(id=>({id,name:skills.find(k=>k.id===id)?.name||id,...skillStatus(state,id,skills,now)}));
  const ready=list.filter(x=>READY.has(x.status)).length;progress+=u.weeks*ready/u.skills.length;
  return {...u,list,ready,done:ready===u.skills.length,started:list.some(x=>x.status!=='new')};
 });
 const current=units.find(u=>!u.done)||null;
 // Expected progress follows the schedule; the gap is shown in weeks.
 let expected=0;for(const u of sched){if(now>=u.due)expected+=u.weeks;else if(now>u.from)expected+=u.weeks*(now-u.from)/(u.due-u.from);}
 const scale=(sched.at(-1).due-start)/WEEK/TOTAL,gapWeeks=(progress-expected)*scale;
 const state_=now<start?'not-started':gapWeeks>=-1?'on-track':gapWeeks>=-3?'slightly-behind':'behind';
 const weekStart=(()=>{const d=new Date(now);d.setHours(0,0,0,0);const dow=(d.getDay()+6)%7;return d.getTime()-dow*DAY;})();
 const clean=L.clean(state);
 const sessions=new Map();for(const e of clean.events)if(e.course&&e.at>=weekStart&&e.session)sessions.set(e.session,(sessions.get(e.session)||0)+1);
 const weekSessions=[...sessions.values()].filter(n=>n>=6).length;
 const cps=CHECKPOINTS.map(cp=>{
  const after=units.find(u=>u.id===cp.after),taken=clean.papers.filter(p=>p.cp===cp.id&&p.complete!==false);
  const due=!taken.length&&(after.done||now>after.due+WEEK);
  return {...cp,due,taken:taken.length,last:taken.at(-1)||null,plannedFor:after.due};
 });
 const daysLeft=Math.max(0,Math.ceil((date(s.target)-now)/DAY));
 const remaining=units.filter(u=>!u.done).reduce((n,u)=>n+u.weeks*(1-u.ready/u.skills.length),0);
 let advice=[];
 if(state_==='slightly-behind')advice.push(`About ${Math.round(-gapWeeks)} week${Math.round(-gapWeeks)===1?'':'s'} behind plan. One extra session a week would close the gap.`);
 if(state_==='behind')advice.push(`About ${Math.round(-gapWeeks)} weeks behind plan. Consider ${Math.min(14,s.perWeek+2)} sessions a week, or a later target date.`);
 if(weekSessions<s.perWeek&&now>=start)advice.push(`${weekSessions} of ${s.perWeek} sessions done this week.`);
 const stuck=current?.list.find(x=>x.status==='started'&&(x.attempts||0)>=24);
 if(stuck)advice.push(`${stuck.name} has had ${stuck.attempts} questions without becoming secure. Sitting with Hana for one session, or explaining it at the table, may help.`);
 return {settings:s,units,current,progress,expected,progressPct:progress/TOTAL,expectedPct:expected/TOTAL,gapWeeks,state:state_,weekSessions,checkpoints:cps,nextCheckpoint:cps.find(c=>c.due)||null,daysLeft,remainingWeeks:remaining*scale,advice,adjust:adjustments(state),repairs:repairs(state,skills,now)};
}
// One course session: new learning, word problems, then mixed review.
function plan(state,skills,now=Date.now()){
 const st=status(state,skills,now),adj=st.adjust,size=DEFAULTS.questions;
 const byId=id=>skills.find(s=>s.id===id),isReady=id=>READY.has(skillStatus(state,id,skills,now).status);
 const unitIndex=st.current?UNITS.findIndex(u=>u.id===st.current.id):UNITS.length-1;
 const unlocked=UNITS.slice(0,unitIndex+1).flatMap(u=>u.skills).filter(id=>byId(id));
 const current=st.current?st.current.list.filter(x=>!READY.has(x.status)):[];
 let focus=current.find(x=>!byId(x.id).manual&&x.status==='started')||current[0]||null;
 const focusIds=[];
 if(focus){
  if(byId(focus.id).manual)focusIds.push(focus.id);
  else{
   const n=size-adj.wordProblems-adj.review;
   // A skill that is taking a long time shares the session with the next one.
   const second=(focus.attempts||0)>=24?current.find(x=>x.id!==focus.id&&!byId(x.id).manual):null;
   for(let i=0;i<n;i++)focusIds.push(second&&i%2?second.id:focus.id);
  }
 }
 const ev=id=>L.evidence(state,id,now);
 const wpPool=unlocked.filter(id=>byId(id).wordProblem&&!focusIds.includes(id)&&ev(id).total>0);
 const wpNew=unlocked.filter(id=>byId(id).wordProblem&&!focusIds.includes(id));
 const rankWp=ids=>ids.map(id=>({id,e:ev(id),r:skillStatus(state,id,skills,now)})).sort((a,b)=>(a.r.status==='secure')-(b.r.status==='secure')||(b.e.due-a.e.due)||a.e.lastAt-b.e.lastAt).map(x=>x.id);
 let wps=rankWp(wpPool.length?wpPool:wpNew).slice(0,adj.wordProblems);
 const repairIds=st.repairs.map(r=>r.skill).filter(id=>byId(id)&&!byId(id).manual&&!focusIds.includes(id));
 const reviewPool=unlocked.filter(id=>!byId(id).manual&&!focusIds.includes(id)&&!wps.includes(id)&&ev(id).total>0);
 const ranked=reviewPool.map(id=>({id,e:ev(id)})).sort((a,b)=>(b.e.reteach-a.e.reteach)||(b.e.due-a.e.due)||a.e.lastAt-b.e.lastAt).map(x=>x.id);
 let reviews=[...new Set([...repairIds,...ranked])].slice(0,size-focusIds.length-wps.length);
 // Early in the course there may be too little to review: preview the next
 // skill in the unit (it opens with its lesson), then give the rest to the focus.
 let fill=size-focusIds.length-wps.length-reviews.length;
 const nextNew=current.find(x=>focus&&x.id!==focus.id&&!byId(x.id).manual&&!focusIds.includes(x.id));
 if(fill>0&&nextNew&&focusIds.length>=4){const n=Math.min(3,fill);for(let i=0;i<n;i++)reviews.push(nextNew.id);fill-=n;}
 if(fill>0&&focus&&!byId(focus.id).manual)for(let i=0;i<fill;i++)focusIds.push(focus.id);
 // Interleave: start with the new idea, then alternate.
 const q=[],F=[...focusIds],W=[...wps],R=[...reviews];
 const pattern=['F','F','F','W','R','F','W','R','F','R','R','W','F','R'];
 for(const p of pattern){const src=p==='F'?F:p==='W'?W:R;if(src.length)q.push(src.shift());}
 q.push(...F,...W,...R);
 return {queue:q.slice(0,Math.max(1,q.length)),focus:focus?.id||null,unit:st.current?.id||null,wordProblems:wps,reviews,status:st};
}
function setSettings(state,patch,now=Date.now()){
 const cur=settings(state),next={start:cur.start,target:cur.target,perWeek:cur.perWeek,...patch,updatedAt:now};
 return L.merge(state,{course:next});
}
const api={UNITS,CHECKPOINTS,DEFAULTS,TOTAL,settings,schedule,skillStatus,status,plan,repairs,adjustments,setSettings,iso,date};
if(node)module.exports=api;else root.HanaCourse=api;
})(typeof window==='undefined'?globalThis:window);
