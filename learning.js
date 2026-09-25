/* Evidence and scheduling are independent of display and response speed. */
(function(root){
'use strict';
const DAY=86400000;
function clean(value){
 const events=Array.isArray(value?.events)?value.events:[];
 return {version:1,events:events.filter(e=>e&&typeof e.id==='string'&&typeof e.skill==='string'&&Number.isFinite(e.at)&&[1,2,3].includes(e.tier)).slice(-5000)};
}
function merge(a,b){const seen=new Map();for(const e of [...clean(a).events,...clean(b).events])if(!seen.has(e.id))seen.set(e.id,e);return clean({events:[...seen.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))});}
function evidence(state,id,now=Date.now()){
 const all=clean(state).events.filter(e=>e.skill===id&&!e.manual),recent=all.slice(-8),success=recent.filter(e=>e.independent).length,last=all.at(-1);
 let tier=1;const one=all.filter(e=>e.tier===1).slice(-4),two=all.filter(e=>e.tier===2).slice(-4);
 if(one.length>=4&&one.filter(e=>e.independent).length>=3)tier=2;
 if(tier===2&&two.length>=4&&two.filter(e=>e.independent).length>=3)tier=3;
 if(recent.length>=2&&recent.slice(-2).every(e=>!e.independent))tier=Math.max(1,tier-1);
 const onDays=new Set(all.filter(e=>e.independent).map(e=>new Date(e.at).toISOString().slice(0,10))).size;
 // "Secure" requires success on different days; a single sitting is insufficient.
 const secure=recent.length>=6&&success>=5&&onDays>=2&&recent.filter(e=>e.independent&&e.tier>=2).length>=3;
 const due=!!last&&now-last.at>=(last.independent?(secure?7:2):1)*DAY;
 return {total:all.length,success,recent:last?recent.length:0,tier,secure,due,last,lastAt:last?.at||0,label:!last?'Not explored':secure?'Secure':success>=3?'Growing':'Practising'};
}
function plan(state,skills,year,kind='daily',focus=null,now=Date.now()){
 const pool=skills.filter(s=>s.year===year&&!s.manual);
 if(focus){const s=skills.find(s=>s.id===focus&&s.year===year);return s?Array(6).fill(s.id):[];}
 const ranked=pool.map(s=>({s,e:evidence(state,s.id,now)})).sort((a,b)=>{
  const priority=x=>kind==='checkin'?(x.e.total===0?0:1):(x.e.due?0:x.e.total===0?1:2);
  return priority(a)-priority(b)||a.e.lastAt-b.e.lastAt||a.s.id.localeCompare(b.s.id);
 });
 const result=ranked.slice(0,6).map(x=>x.s.id);
 // Repair a within-year prerequisite after two supported/unsuccessful attempts.
 if(kind==='daily'){
  const weak=ranked.find(x=>x.s.prerequisite&&state.events.filter(e=>e.skill===x.s.id&&!e.manual).slice(-2).length===2&&state.events.filter(e=>e.skill===x.s.id&&!e.manual).slice(-2).every(e=>!e.independent));
  if(weak&&pool.some(s=>s.id===weak.s.prerequisite)&&!result.includes(weak.s.prerequisite))result[result.length-1]=weak.s.prerequisite;
 }
 return result;
}
const api={clean,merge,evidence,plan};if(typeof module==='object'&&module.exports)module.exports=api;else root.HanaLearning=api;
})(typeof window==='undefined'?globalThis:window);
