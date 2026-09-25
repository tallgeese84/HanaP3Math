const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../curriculum.js'),L=require('../learning.js');
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}
test('all skills generate valid, unique answers across three tiers and 300 seeds',()=>{
 const positions=new Set();
 for(const s of C.skills)for(let tier=1;tier<=3;tier++)for(let seed=1;seed<=300;seed++){
  const q=C.generate(s.id,tier,random(seed*991));
  assert.equal(q.year,s.year);assert.ok(q.qtext&&q.help&&q.fact);
  if(q.kind==='key'){assert.equal(typeof q.ans,'number');assert.ok(Number.isFinite(q.ans)&&q.ans>=0);if(!q.dec)assert.ok(Number.isInteger(q.ans));}
  if(q.kind==='choice'){
   assert.ok(q.choices.length>=2);assert.equal(q.choices.filter(c=>c.v===q.ans).length,1);
   assert.equal(new Set(q.choices.map(c=>c.v)).size,q.choices.length);
   if(s.id==='p3-remainder')positions.add(q.choices.findIndex(c=>c.v===q.ans));
  }
  if(q.kind==='manual')assert.equal(s.manual,true);
 }
 assert.ok(positions.size>=3,'correct options must move');
});
test('P3 and P4 operations respect the actual MOE operand limits',()=>{
 for(let i=1;i<1000;i++)for(const year of [3,4]){
  const q=C.generate(`p${year}-${year===3?'muldiv':'multiply'}`,3,random(i*33));
  const m=q.qtext.match(/^(\d+) ([×÷]) (\d+)/);assert.ok(m);
  const a=+m[1],b=+m[3];assert.ok(a<=(year===3?999:9999));
  assert.ok(b<=(year===3||a>=1000?9:99));assert.equal(q.ans,m[2]==='×'?a*b:a/b);
 }
});
test('fraction items have one mathematically correct option, and P3 uses related denominators within one whole',()=>{
 for(let i=1;i<=1200;i++)for(const year of [3,4]){
  const q=C.generate(`p${year}-fracops`,2,random(i));
  const [,a,b,op,c,d]=q.qtext.match(/(\d+)\/(\d+) ([+−]) (\d+)\/(\d+)/);
  const expected=+a/+b+(op==='+'?1:-1)*(+c/+d);
  const accepted=q.choices.filter(o=>{const [n,d]=o.v.split('/').map(Number);return Math.abs(n/d-expected)<1e-10;});
  assert.equal(accepted.length,1);assert.equal(accepted[0].v,q.ans);assert.ok(+b<=12&&+d<=12);
  if(year===3){assert.ok(+b % +d===0||+d % +b===0);assert.ok(expected<=1+1e-10&&expected>=0);}
 }
});
test('place-value prompts identify the place rather than an ambiguous repeated digit',()=>{
 for(const y of [3,4])for(let i=1;i<300;i++){
  const q=C.generate(`p${y}-place`,3,random(i));
  assert.ok(q.qtext.includes('place')||q.qtext.startsWith('Write in numerals'));
 }
});
test('year selection and six-question diagnostic coverage never drift into the other year',()=>{
 for(const year of [3,4]){
  let state=L.clean(null);const visited=new Set();
  for(let sitting=0;sitting<6;sitting++){
   const queue=L.plan(state,C.skills,year,'checkin');assert.equal(queue.length,6);
   for(const id of queue){assert.equal(C.skills.find(s=>s.id===id).year,year);visited.add(id);state.events.push({id:`${sitting}-${id}`,skill:id,tier:1,at:Date.now()+sitting,independent:true});}
  }
  const pool=C.skills.filter(s=>s.year===year&&!s.manual);assert.equal(visited.size,pool.length);
 }
});
test('hints, retries, reveals and drawing cannot manufacture mastery; time is not a gate',()=>{
 const id='p3-addsub',events=[];const now=Date.now();
 for(let i=0;i<8;i++)events.push({id:'h'+i,skill:id,tier:1,at:now+i,independent:false,hints:1});
 assert.equal(L.evidence({events},id).tier,1);assert.equal(L.evidence({events},id).secure,false);
 const independent=events.map((e,i)=>({...e,id:'i'+i,independent:true,hints:0,elapsedMs:600000,tier:i<4?1:2,at:now+i}));
 assert.equal(L.evidence({events:independent},id).tier,3);
 assert.equal(L.evidence({events:independent},id).secure,false,'one sitting is not secure');
 independent[0].at-=86400000;
 assert.equal(L.evidence({events:independent},id).secure,true);
 assert.equal(L.evidence({events:independent.map(e=>({...e,manual:true}))},id).secure,false);
});
test('cloud evidence merges by stable event identity and preserves local data from older clients',()=>{
 const a={id:'a',skill:'p3-addsub',tier:1,at:1,independent:true},b={...a,id:'b',at:2};
 assert.deepEqual(L.merge({events:[a]},{events:[a,b]}).events,[a,b]);
 assert.deepEqual(L.merge({events:[a]},{}).events,[a]);
 assert.deepEqual(L.merge(null,null),{version:1,events:[]});
});
test('failed or supported work becomes due after one day, independent work after two',()=>{
 const now=Date.now(),e={id:'a',skill:'p3-addsub',tier:1,at:now-86400001,independent:false};
 assert.equal(L.evidence({events:[e]},e.skill,now).due,true);
 assert.equal(L.evidence({events:[{...e,independent:true}]},e.skill,now).due,false);
});
