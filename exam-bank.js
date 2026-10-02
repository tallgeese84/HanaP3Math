/* Private, parent-imported exam packs. No purchased content ships with the app. */
(function(root){
'use strict';
const node=typeof module==='object'&&module.exports,C=node?require('./curriculum.js'):root.HanaCurriculum,L=node?require('./learning.js'):root.HanaLearning;
if(node)require('./problems.js');
const text=(v,max=4000)=>typeof v==='string'&&v.length>0&&v.length<=max;
function validate(raw){
 if(raw?.format!=='hana-exam-pack'||raw.version!==1||!text(raw.id,100)||!text(raw.title,200)||!Array.isArray(raw.papers)||!Array.isArray(raw.questions)||raw.papers.length>30||raw.questions.length>1500)throw Error('This is not a supported Hana exam pack.');
 const ids=new Set();
 const papers=raw.papers.map(p=>{
  if(!text(p.id,100)||ids.has(p.id)||!text(p.title,200)||![3,4].includes(p.year)||!Array.isArray(p.pages)||!p.pages.length||p.pages.length>100)throw Error('Invalid paper details.');ids.add(p.id);
  const pages=p.pages.map(pg=>{if(!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(pg.image)||pg.image.length>6000000)throw Error('Invalid paper image.');return {image:pg.image,answerKey:pg.answerKey===true};});
  if(!pages.some(p=>!p.answerKey))throw Error('A paper needs question pages.');
  return {id:p.id,title:p.title,year:p.year,pages};
 });
 const questionIds=new Set();
 const questions=raw.questions.map(q=>{
  const paper=papers.find(p=>p.id===q.paper),skill=C.skills.find(s=>s.id===q.skill&&!s.manual);
  if(!text(q.id,150)||questionIds.has(q.id)||!paper||!skill||skill.year!==paper.year||![1,2,3].includes(q.tier)||!text(q.qtext)||!text(q.help)||!text(q.solution)||!text(q.number,30)||!Number.isInteger(q.page)||q.page<1||q.page>paper.pages.length||paper.pages[q.page-1].answerKey)throw Error('A question has invalid source or skill details.');
  questionIds.add(q.id);
  const v={id:q.id,paper:q.paper,skill:q.skill,tier:q.tier,qtext:q.qtext,help:q.help,solution:q.solution,number:q.number,page:q.page,unit:text(q.unit,40)?q.unit:'',money:q.money===true,dec:q.dec===true};
  if(q.kind==='parts'&&['fraction','mixed'].includes(q.layout)&&Number.isSafeInteger(q.expect?.N)&&q.expect.N>=0&&Number.isSafeInteger(q.expect?.D)&&q.expect.D>0){v.kind='parts';v.layout=q.layout;v.expect={N:q.expect.N,D:q.expect.D,form:'simplest'};v.answer=C.mixedText(q.expect.N,q.expect.D);}
  else if(q.kind==='key'&&Number.isFinite(q.answer)&&q.answer>=0&&q.answer<=1e9&&(!v.money||Number.isInteger(q.answer))){v.kind='key';v.answer=q.answer;}
  else throw Error('An answer cannot be checked safely.');
  return v;
 });
 return {format:raw.format,version:1,id:raw.id,title:raw.title,papers,questions,notes:(Array.isArray(raw.notes)?raw.notes:[]).filter(n=>text(n,2000)).slice(0,20)};
}
function spec(q,paper){
 const sk=C.skills.find(s=>s.id===q.skill),ansText=q.kind==='parts'?q.answer:q.money?'$'+(q.answer/100).toFixed(2):String(q.answer)+(q.unit?' '+q.unit:'');
 return {skill:q.skill,year:sk.year,topic:sk.topic,title:sk.name,tier:q.tier,kind:q.kind,ans:q.answer,ansText,layout:q.layout,expect:q.expect,money:q.money,dec:q.dec,unit:q.unit,qtext:q.qtext,phrase:q.qtext,help:q.help,fact:q.solution,vis:'',eq:'<span class="blank" id="blank">?</span>',signature:'exam:'+q.id,sourceId:q.id,sourcePaper:paper.title,sourceQuestion:q.number,sourcePage:q.page,form:'exam'};
}
// Prefer unseen questions at the learner's current level. Never use a harder
// paper question merely because the bank is thin; generated practice fills gaps.
function select(packs,state,skill,tier,{used=[],now=Date.now()}={}){
 const s=L.clean(state),all=packs.flatMap(p=>p.questions.map(q=>({q,paper:p.papers.find(x=>x.id===q.paper)}))),last=new Map();
 for(const e of s.events)if(e.sourceId)last.set(e.sourceId,Math.max(last.get(e.sourceId)||0,e.at));
 const pool=all.filter(x=>x.q.skill===skill&&x.q.tier===tier&&!used.includes(x.q.id)&&(now-(last.get(x.q.id)||0)>=86400000));
 pool.sort((a,b)=>(last.has(a.q.id)-last.has(b.q.id))||(tier-a.q.tier)-(tier-b.q.tier)||(last.get(a.q.id)||0)-(last.get(b.q.id)||0)||a.q.id.localeCompare(b.q.id));
 return pool[0]?spec(pool[0].q,pool[0].paper):null;
}
function queue(packs,state,year,now=Date.now()){
 const ids=[...new Set(packs.flatMap(p=>p.questions).filter(q=>C.skills.find(s=>s.id===q.skill)?.year===year).map(q=>q.skill))];
 const ranked=ids.map(id=>({id,e:L.evidence(state,id,now)})).sort((a,b)=>(b.e.reteach-a.e.reteach)||(b.e.due-a.e.due)||a.e.lastAt-b.e.lastAt);
 // Repeated skills allow level adjustment within a short six-question session.
 return ranked.slice(0,3).flatMap(x=>[x.id,x.id]);
}
const api={validate,spec,select,queue};if(node)module.exports=api;else root.HanaExamBank=api;
})(typeof window==='undefined'?globalThis:window);
