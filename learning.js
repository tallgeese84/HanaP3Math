/* Evidence and scheduling are independent of display and response speed. */
(function(root){
'use strict';
const DAY=86400000;
const manualSkills=new Set(['p3-drawlines','p4-construct','p4-drawsymmetry']);
const skillId=id=>typeof id==='string'&&/^p[34]-[a-z]+$/.test(id)&&id.length<=40;
const validEvent=e=>e&&typeof e.id==='string'&&typeof e.skill==='string'&&Number.isFinite(e.at)&&[1,2,3].includes(e.tier);
const time=at=>Number.isFinite(at)&&at>=0&&at<=8640000000000000;
function clean(value){
 const events=Array.isArray(value?.events)?value.events:[],lessons={},exposures={};
 for(const [id,v] of Object.entries(value?.lessons||{}))if(/^p[34]-[a-z]+$/.test(id)&&v&&Number.isFinite(v.at))lessons[id]={at:v.at,passed:!!v.passed,tries:Math.max(0,Math.min(99,Number(v.tries)||0))};
 for(const [id,at] of Object.entries(value?.exposures||{}))if(/^p[34]-[a-z]+$/.test(id)&&Number.isFinite(at))exposures[id]=at;
 const checks=(Array.isArray(value?.checks)?value.checks:[]).filter(e=>e&&typeof e.id==='string'&&/^p[34]-[a-z]+$/.test(e.skill)&&Number.isFinite(e.at)).slice(-2000);
 // Checkpoint papers and the course plan travel with learning evidence (h17).
 const papers=(Array.isArray(value?.papers)?value.papers:[]).filter(p=>p&&typeof p.id==='string'&&Number.isFinite(p.at)&&Array.isArray(p.items)).sort((a,b)=>a.at-b.at).slice(-200);
 const course=value?.course&&typeof value.course==='object'&&Number.isFinite(value.course.updatedAt)?value.course:null;
 const valid=events.filter(validEvent);
 return {version:3,events:valid.slice(-5000),lessons,checks,exposures,papers,course,courseEarned:cleanEarned(value?.courseEarned)};
}
function merge(a,b){
 const incoming=[...(Array.isArray(a?.events)?a.events:[]),...(Array.isArray(b?.events)?b.events:[])].filter(validEvent);
 a=clean(a);b=clean(b);const seen=new Map(),lessons={...a.lessons},exposures={...a.exposures};
 // Merge raw legacy evidence conservatively before deriving any new credit.
 for(const e of incoming)seen.set(e.id,seen.has(e.id)?mergeEvent(seen.get(e.id),e):e);
 for(const [id,v] of Object.entries(b.lessons))if(!lessons[id]||v.at>lessons[id].at)lessons[id]=v;
 for(const [id,at] of Object.entries(b.exposures))exposures[id]=Math.max(exposures[id]||0,at);
 const checks=new Map();for(const c of [...a.checks,...b.checks])if(!checks.has(c.id))checks.set(c.id,c);
 const papers=new Map();for(const p of [...a.papers,...b.papers])if(!papers.has(p.id)||(p.updatedAt||p.at)>(papers.get(p.id).updatedAt||papers.get(p.id).at))papers.set(p.id,p);
 const course=!a.course?b.course:!b.course?a.course:(b.course.updatedAt>a.course.updatedAt?b.course:a.course);
 const courseEarned={...a.courseEarned};for(const [id,v]of Object.entries(b.courseEarned))if(!courseEarned[id]||earnedOrder(v,courseEarned[id])<0)courseEarned[id]=v;
 return captureCourseEarned({events:[...seen.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id)),lessons,exposures,checks:[...checks.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id)),papers:[...papers.values()],course,courseEarned});
}
// Never trust an independent flag when recorded support contradicts it.
const independent=e=>!!e.independent&&!e.manual&&!e.hints&&!e.tries&&!e.revealed&&!e.lessonHelp&&!e.repeated&&e.confidence!=='guess'&&e.correct!==false;
const earnedOrder=(a,b)=>a.at-b.at||JSON.stringify(a).localeCompare(JSON.stringify(b));
function uniqueEvents(events){const out=new Map();for(const e of events)out.set(e.id,out.has(e.id)?mergeEvent(out.get(e.id),e):e);return [...out.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));}
// Proofs retain only the original answer identities/levels, never questions,
// working or credentials. Ordinary later review does not undo an achievement.
function cleanEarned(value){
 const out={};
 for(const [id,v]of Object.entries(value&&typeof value==='object'&&!Array.isArray(value)?value:{}).sort().slice(0,80)){
  if(!skillId(id)||!v||!time(v.at)||!Array.isArray(v.proof))continue;
  const manual=v.rule==='manual-v1',auto=v.rule==='ready-v1';
  if(!auto&&!manual||manual!==manualSkills.has(id)||v.proof.length!==(manual?1:3))continue;
  const proof=v.proof.map(p=>p&&typeof p.id==='string'&&p.id.length>0&&p.id.length<=200&&time(p.at)&&p.at<=v.at&&[1,2,3].includes(p.tier)&&(manual?p.manual===true:independent(p))?{id:p.id,at:p.at,tier:p.tier,...(manual?{manual:true}:{independent:true})}:null);
  if(proof.some(p=>!p)||new Set(proof.map(p=>p.id)).size!==proof.length)continue;
  proof.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  if(auto&&(proof.filter(p=>p.tier>=2).length<2||v.at!==Math.max(...proof.map(p=>p.at))))continue;
  if(manual&&(!time(v.lessonAt)||v.at!==Math.max(v.lessonAt,proof[0].at)))continue;
  // This is a historical certificate, not a new current-readiness assertion.
  // Later reviews/corrections cannot erase a milestone already recorded.
  out[id]={rule:v.rule,at:v.at,proof,...(manual?{lessonAt:v.lessonAt}:{})};
 }
 return out;
}
function captureCourseEarned(value){
 const s=clean(value),events=uniqueEvents((Array.isArray(value?.events)?value.events:[]).filter(validEvent)),windows=new Map(),courseEarned={...s.courseEarned};
 for(const e of events){
  if(!skillId(e.skill)||courseEarned[e.skill]?.at<=e.at)continue;
  if(manualSkills.has(e.skill)){
   if(!e.manual)continue;
   const lessonTimes=[s.lessons[e.skill]?.at,...s.checks.filter(c=>c.skill===e.skill).map(c=>c.at)].filter(time);
   if(!lessonTimes.length)continue;const lessonAt=Math.min(...lessonTimes);
   const milestone={rule:'manual-v1',at:Math.max(e.at,lessonAt),lessonAt,proof:[{id:e.id,at:e.at,tier:e.tier,manual:true}]};
   if(!courseEarned[e.skill]||earnedOrder(milestone,courseEarned[e.skill])<0)courseEarned[e.skill]=milestone;continue;
  }
  if(e.manual)continue;
  const window=[...(windows.get(e.skill)||[]),e].slice(-8);windows.set(e.skill,window);
  const winners=window.filter(independent),strong=winners.filter(x=>x.tier>=2);
  if(winners.length<3||strong.length<2)continue;
  const chosen=[...strong.slice(0,2),winners.find(x=>!strong.slice(0,2).includes(x))].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  courseEarned[e.skill]={rule:'ready-v1',at:e.at,proof:chosen.map(x=>({id:x.id,at:x.at,tier:x.tier,independent:true}))};
 }
 // Capture before the regular 5,000-event retention cap is applied.
 return clean({...s,courseEarned});
}
function mergeEvent(a,b){
 if(JSON.stringify(a)===JSON.stringify(b))return a;
 const newer=(a.updatedAt||a.at)>(b.updatedAt||b.at)?a:(a.updatedAt||a.at)<(b.updatedAt||b.at)?b:JSON.stringify(a)>JSON.stringify(b)?a:b;
 const out={...a,...b,...newer,independent:independent(a)&&independent(b)};
 for(const k of ['hints','tries'])if(k in a||k in b)out[k]=Math.max(a[k]||0,b[k]||0);
 for(const k of ['revealed','lessonHelp','repeated','manual'])if(k in a||k in b)out[k]=!!(a[k]||b[k]);
 if(a.confidence==='guess'||b.confidence==='guess')out.confidence='guess';
 if(a.attempts||b.attempts){const attempts=new Map();for(const v of [...(a.attempts||[]),...(b.attempts||[])])if(v&&typeof v.id==='string')attempts.set(v.id,v);out.attempts=[...attempts.values()].sort((x,y)=>x.at-y.at).slice(-30);}
 return out;
}
function exposure(state,id){const s=clean(state);return Math.max(0,s.exposures[id]||0,s.lessons[id]?.at||0,...s.checks.filter(e=>e.skill===id).map(e=>e.at),...s.events.filter(e=>e.skill===id).map(e=>e.at));}
function recommend(state,skills,year,now=Date.now()){
 const id=plan(state,skills,year,'daily',null,now)[0],s=skills.find(x=>x.id===id);if(!s)return null;
 const e=evidence(state,id,now),repair=skills.find(x=>x.year===year&&x.prerequisite===id&&evidence(state,x.id,now).reteach);
 const action=repair?'foundation':e.due?'recall':e.reteach?'reteach':!e.total?'learn':e.success>=3?'apply':'practice';
 const reason=repair?`Rebuild ${s.name.toLowerCase()} before returning to ${repair.name.toLowerCase()}.`:e.due?'Check what she remembers before showing the lesson again.':e.reteach?'Recent answers needed help. Revisit the idea, then try a smaller step.':!e.total?'No practice evidence yet. Begin with the lesson and a short check.':e.success>=3?'Try a changed problem where one is available, then revisit it on another day.':'Build a few independent answers before adding more challenge.';
 const child={foundation:'A quick step back first. It makes the next topic easier.',recall:'Show what you remember!',reteach:'Let’s look at the idea again, one small step at a time.',learn:'New topic! Start with a short lesson.',apply:'Try a new twist on it.',practice:'A few more to make it strong.'}[action];
 return {skill:id,name:s.name,year,tier:e.tier,action,reason,child};
}
function evidence(state,id,now=Date.now()){
 const all=clean(state).events.filter(e=>e.skill===id&&!e.manual),recent=all.slice(-8),success=recent.filter(independent).length,last=all.at(-1);
 let tier=1,attemptTier=1,wins=0,needsHelp=0,change='';
 for(const e of all){
  // Respect the level actually attempted (including older app versions).
  if(e.tier!==attemptTier){attemptTier=e.tier;wins=0;needsHelp=0;}
  tier=e.tier;
  if(independent(e)){wins++;needsHelp=0;}else{wins=0;needsHelp++;}
  change='';
  if(wins>=3&&tier<3){tier++;change='stretch';}
  if((needsHelp>=2||e.revealed||e.tries>=2)&&tier>1){tier--;change='support';}
 }
 const reteach=!!last&&!independent(last)&&(last.revealed||last.tries>=2||recent.slice(-2).length===2&&recent.slice(-2).every(e=>!independent(e)));
 const onDays=new Set(all.filter(independent).map(e=>new Date(e.at+8*3600000).toISOString().slice(0,10))).size;
 // Lesson checks never count as practice evidence. One sitting is not secure.
 const delayed=all.filter(e=>independent(e)&&e.phase==='recall'&&e.reviewGapMs>=DAY).length;
 const transfer=all.filter(e=>independent(e)&&e.phase==='transfer').length;
 const forms=new Set(recent.filter(independent).map(e=>e.form).filter(Boolean)).size;
 const secure=recent.length>=6&&success>=5&&onDays>=2&&delayed>0&&(forms>=2||transfer>0)&&recent.filter(e=>independent(e)&&e.tier>=2).length>=3;
 const reviewAt=last?exposure(state,id)+(independent(last)?(secure?7:2):1)*DAY:0;
 const due=!!last&&now>=reviewAt;
 return {total:all.length,success,recent:recent.length,tier,secure,due,reviewAt,delayed,transfer,forms,change,reteach,last,lastAt:last?.at||0,label:!last?'Not explored':secure?'Remembered later':success>=3?'Growing':'Practising'};
}
function plan(state,skills,year,kind='daily',focus=null,now=Date.now()){
 const pool=skills.filter(s=>s.year===year&&!s.manual);
 if(focus){const s=skills.find(s=>s.id===focus&&s.year===year);return s?Array(s.manual?1:6).fill(s.id):[];}
 const ranked=pool.map((s,i)=>({s,i,e:evidence(state,s.id,now)})).sort((a,b)=>{
  const priority=x=>kind==='checkin'?(x.e.total===0?0:1):(x.e.reteach?0:x.e.due?1:x.e.total===0?2:3);
  return priority(a)-priority(b)||a.e.lastAt-b.e.lastAt||a.i-b.i;
 });
 if(kind==='checkin')return ranked.slice(0,6).map(x=>x.s.id);
 if(!ranked.length)return [];
 let focusSkill=ranked[0];
 if(focusSkill.e.reteach){const prerequisite=ranked.find(x=>x.s.id===focusSkill.s.prerequisite&&!x.e.secure);if(prerequisite)focusSkill=prerequisite;}
 const review=ranked.filter(x=>x.s.id!==focusSkill.s.id&&x.e.total>0&&!x.e.reteach).slice(0,2).map(x=>x.s.id);
 return [...Array(6-review.length).fill(focusSkill.s.id),...review];
}
const api={clean,merge,evidence,plan,independent,exposure,recommend,captureCourseEarned};if(typeof module==='object'&&module.exports)module.exports=api;else root.HanaLearning=api;
})(typeof window==='undefined'?globalThis:window);
