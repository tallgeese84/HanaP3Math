/* Bounded, fading support within the existing question. Never a mastery certificate. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./learning.js'));else root.HanaWordSupport=factory(root.HanaLearning);})(typeof globalThis==='undefined'?this:globalThis,function(L){
'use strict';
const SKILL='p3-wppartwhole';
function outline(spec){
 if(spec?.skill!==SKILL||spec.sourceId||spec.manual)return null;
 const d=spec.data||{};let whole,parts,findWhole=false;
 if(['left','missing'].includes(d.type)){whole=d.total;parts=d.parts;}
 else if(d.type==='three'){whole=d.total;parts=[d.a,`${d.a} + ${d.d}`];}
 else if(d.type==='part-whole-application'){whole=d.whole;parts=d.findWhole?d.parts:d.parts?.slice(0,2);findWhole=!!d.findWhole;}
 else return null;
 if(!Number.isFinite(whole)||!Array.isArray(parts)||parts.length<2||parts.length>3||parts.some(x=>!(Number.isFinite(x)||/^\d+ \+ \d+$/.test(x))))return null;
 const all=parts.map(String),total=findWhole?'Unknown':String(whole),equation=findWhole?all.join(' + '):`${whole} − (${all.join(' + ')})`;
 return {version:1,total,parts:all,findWhole,steps:[
  {id:'whole',prompt:'Which amount is the whole?',choices:[total,findWhole?all[0]:'The amount left'],answer:0,feedback:'The whole is everything together, before any part is separated.'},
  {id:'parts',prompt:'Which known parts belong inside that whole?',choices:[findWhole?'Only the first part':'The whole and the first part',all.join(' and ')],answer:1,feedback:'Use the known parts inside the whole. Do not count the whole as another part.'},
  {id:'operation',prompt:findWhole?'How can you find the whole?':'How can you find the unknown part?',choices:findWhole?[all.join(' − '),equation]:[equation,`${whole} + (${all.join(' + ')})`],answer:findWhole?1:0,feedback:findWhole?'Combine all the parts to make the whole.':'Remove the known parts from the whole. The amount left is the unknown part.'}
 ]};
}
function choose(state,spec,{kind='daily',phase='practice'}={}){
 const model=outline(spec);if(!model||!['daily','course'].includes(kind)||phase==='recall')return null;
 const recent=L.clean(state).events.filter(e=>e.skill===SKILL&&!e.manual).slice(-8);
 // Fade after a supported question: the next changed story is a genuine unprompted check.
 if(recent.length<4||recent.filter(L.independent).length>Math.floor(recent.length/2)||recent.at(-1)?.wordSupport?.used)return null;
 return {version:1,used:true,stage:0,checks:[],model};
}
function answer(state,choice,at=Date.now()){
 if(!state?.model||state.stage>=state.model.steps.length||!Number.isInteger(choice))return false;
 const step=state.model.steps[state.stage];if(choice<0||choice>=step.choices.length)return false;
 const correct=choice===step.answer;state.checks.push({stage:step.id,choice,correct,at});state.checks=state.checks.slice(-18);state.feedback=correct?'That matches the story.':step.feedback;if(correct)state.stage++;return correct;
}
function evidence(state){if(!state?.used)return null;return {version:1,used:true,completed:state.stage>=3,checks:(state.checks||[]).slice(-18).filter(c=>['whole','parts','operation'].includes(c.stage)&&Number.isInteger(c.choice)&&Number.isFinite(c.at)&&typeof c.correct==='boolean').map(c=>({stage:c.stage,choice:c.choice,correct:c.correct,at:c.at}))};}
return {outline,choose,answer,evidence};
});
