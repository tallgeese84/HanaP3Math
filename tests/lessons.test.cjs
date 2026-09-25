const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../curriculum.js'),L=require('../learning.js'),T=require('../lessons.js');
const rng=n=>()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/2**32;};
test('every mapped skill has an introduction, diagram, worked example and unambiguous learning check',()=>{
 assert.equal(Object.keys(T.lessons).length,43);
 for(const s of C.skills){const d=T.get(s.id);assert.ok(d&&d.goal&&d.idea&&d.example&&d.visual,s.id);assert.ok(d.steps.length>=3);assert.equal(d.check.options.filter(o=>o===d.check.answer).length,1);assert.ok(d.check.explanation);assert.equal(new Set(d.check.options).size,d.check.options.length);}
});
test('each automatically checked skill changes its question content at every difficulty boundary',()=>{
 for(const s of C.skills.filter(s=>!s.manual))for(const tier of [1,2]){
  let changed=0;
  for(let seed=1;seed<=100;seed++){
   const a=C.generate(s.id,tier,rng(seed*31)),b=C.generate(s.id,tier+1,rng(seed*31));
   if(a.qtext!==b.qtext||a.vis!==b.vis||a.ans!==b.ans)changed++;
  }
  assert.ok(changed>=50,`${s.id} boundary ${tier}: only ${changed} changed`);
 }
});
test('three independent answers raise a level; support lowers it and the lower level persists',()=>{
 const id='p3-addsub',state=L.clean(null);let at=100;
 const submit=extra=>{const tier=L.evidence(state,id).tier;state.events.push({id:String(at),skill:id,tier,at:at++,independent:true,...extra});return L.evidence(state,id);};
 assert.equal(submit({}).tier,1);assert.equal(submit({}).tier,1);assert.equal(submit({}).tier,2);
 assert.equal(submit({independent:false,hints:1}).tier,2,'one supported answer is not a drop');
 assert.equal(submit({independent:false,tries:1}).tier,1);
 assert.equal(L.evidence(state,id).reteach,true);
 assert.equal(submit({}).tier,1);assert.equal(submit({}).tier,1);assert.equal(submit({}).tier,2);
 assert.equal(submit({tries:2}).tier,1,'repeated mistakes override an incorrect independent flag');
 assert.equal(submit({}).tier,1);
});
test('revealed answers and lesson replays are never independent; response speed is irrelevant',()=>{
 const state=L.clean(null),id='p4-multiply';
 for(let i=0;i<6;i++){const e=L.evidence(state,id);state.events.push({id:String(i),skill:id,tier:e.tier,at:i,independent:true,elapsedMs:3600000});}
 assert.equal(L.evidence(state,id).tier,3);
 state.events.push({id:'reveal',skill:id,tier:3,at:7,independent:true,revealed:true});
 assert.equal(L.evidence(state,id).tier,2);assert.equal(L.evidence(state,id).reteach,true);
 assert.equal(L.independent({independent:true,lessonHelp:true}),false);
});
test('lesson completion merges across devices without manufacturing practice or dropping old evidence',()=>{
 const id='p3-place',a={events:[{id:'old',skill:id,tier:1,at:1}],lessons:{[id]:{at:4,passed:false,tries:1}}};
 const b={lessons:{[id]:{at:6,passed:true,tries:1},'p4-place':{at:5,passed:true,tries:1}}};
 const merged=L.merge(a,b);assert.equal(merged.events.length,1);assert.equal(merged.lessons[id].passed,true);
 assert.deepEqual(L.merge(merged,{events:[]}),merged);assert.deepEqual(L.merge(b,a),merged);
 assert.equal(L.evidence(merged,'p4-place').total,0);assert.equal(L.evidence(merged,'p4-place').secure,false);
});
test('daily sessions teach one skill repeatedly, then review at most two previously attempted skills',()=>{
 for(const year of [3,4]){
  const state=L.clean(null),queue=L.plan(state,C.skills,year);
  assert.equal(queue.length,6);assert.equal(new Set(queue).size,1);assert.equal(queue[0],`p${year}-place`);
  state.events.push({id:'known',skill:queue[0],tier:1,at:Date.now(),independent:true});
  const next=L.plan(state,C.skills,year);assert.equal(next.filter(id=>id===next[0]).length,5);assert.equal(next.at(-1),queue[0]);
  assert.ok(next.every(id=>id.startsWith(`p${year}-`)));
 }
});
test('repeated struggle schedules a within-year prerequisite without silently changing school year',()=>{
 const events=[1,2].map(i=>({id:String(i),skill:'p3-muldiv',tier:1,at:i,independent:false,hints:1}));
 assert.equal(L.plan({events},C.skills,3)[0],'p3-tables');
 const p4=events.map(e=>({...e,skill:'p4-multiply'}));
 assert.equal(L.plan({events:p4},C.skills,4)[0],'p4-multiply');
});
test('inverse fraction-of-a-set and money change questions have independently calculated answers',()=>{
 for(let seed=1;seed<=500;seed++){
  const q=C.generate('p4-fracset',3,rng(seed));const [,part,n,d]=q.qtext.match(/(\d+) blue beads make up (\d+)\/(\d+)/);assert.equal(q.ans,+part/+n*+d);
  const m=C.generate('p3-money',3,rng(seed));const prices=[...m.qtext.matchAll(/\$(\d+\.\d{2})/g)].map(x=>Math.round(+x[1]*100));assert.equal(m.ans,prices[2]-prices[0]-prices[1]);
 }
});
