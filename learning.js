/* Evidence and scheduling are independent of display and response speed. */
(function(root){
'use strict';
const DAY=86400000;
function clean(value){
 const events=Array.isArray(value?.events)?value.events:[],lessons={};
 for(const [id,v] of Object.entries(value?.lessons||{}))if(/^p[34]-[a-z]+$/.test(id)&&v&&Number.isFinite(v.at))lessons[id]={at:v.at,passed:!!v.passed,tries:Math.max(0,Math.min(99,Number(v.tries)||0))};
 return {version:2,events:events.filter(e=>e&&typeof e.id==='string'&&typeof e.skill==='string'&&Number.isFinite(e.at)&&[1,2,3].includes(e.tier)).slice(-5000),lessons};
}
function merge(a,b){
 a=clean(a);b=clean(b);const seen=new Map(),lessons={...a.lessons};
 for(const e of [...a.events,...b.events])if(!seen.has(e.id))seen.set(e.id,e);
 for(const [id,v] of Object.entries(b.lessons))if(!lessons[id]||v.at>lessons[id].at)lessons[id]=v;
 return clean({events:[...seen.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id)),lessons});
}
// Never trust an independent flag when recorded support contradicts it.
const independent=e=>!!e.independent&&!e.hints&&!e.tries&&!e.revealed&&!e.lessonHelp&&e.correct!==false;
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
 const secure=recent.length>=6&&success>=5&&onDays>=2&&recent.filter(e=>independent(e)&&e.tier>=2).length>=3;
 const due=!!last&&now-last.at>=(independent(last)?(secure?7:2):1)*DAY;
 return {total:all.length,success,recent:recent.length,tier,secure,due,change,reteach,last,lastAt:last?.at||0,label:!last?'Not explored':secure?'Secure':success>=3?'Growing':'Practising'};
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
const api={clean,merge,evidence,plan,independent};if(typeof module==='object'&&module.exports)module.exports=api;else root.HanaLearning=api;
})(typeof window==='undefined'?globalThis:window);
