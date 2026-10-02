const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../curriculum.js'),T=require('../lessons.js'),P=require('../problems.js'),K=require('../course.js'),Pa=require('../papers.js'),L=require('../learning.js'),R=require('../learning-review.js');
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}
const nums=s=>(s.match(/\d+(?:\.\d+)?/g)||[]).map(Number);
// Each answer is recomputed from the stored problem data with separate formulas.
const oracle={
 left:d=>d.total-d.parts[0]-d.parts[1],missing:d=>d.total-d.parts[0]-d.parts[1],three:d=>d.total-2*d.a-d.d,
 'more-total':d=>2*d.x+d.d,relational:d=>d.fewer?2*d.x+d.d:2*d.x-d.d,'sum-difference':d=>d.askBig?(d.total+d.d)/2:(d.total-d.d)/2,
 times:d=>d.total?(d.k+1)*d.n:d.k*d.n,'times-total':d=>d.askA?d.T/(d.k+1)*d.k:d.T/(d.k+1),'times-difference':d=>d.D/(d.k-1)*(d.k+1),
 share:d=>d.p*d.m/d.g,ceil:d=>Math.ceil(d.N/d.cap),floor:d=>Math.floor(d.N/d.cap),fill:d=>d.cap-d.N%d.cap,'boxes-money':d=>Math.floor(d.N/d.cap)*d.p*100,
 buy:d=>(d.k*d.p+d.b)*100,change:d=>d.k?d.note-d.k*d.a-d.b:d.note-d.a-d.b,ribbon:d=>d.total-d.k*d.p,rice:d=>d.total-d.g*d.d,water:d=>d.total-d.k*d.p,
 'times-diff':d=>d.D/(d.k-1)*d.k,'three-units':d=>{const u=(d.T-d.e)/(d.k+2);return d.askB?u:u+d.e;},chain:d=>d.T/(1+d.k+d.m*d.k)*d.m*d.k,
 backwards:d=>(d.left-d.got+d.a+d.b)*100,equalise:d=>(d.x-d.y)/2,'same-after':d=>d.total/2+d.half,giveaway:d=>d.g/(d.k-1)*d.k,transfer:d=>2*d.g/(d.k-1)*d.k,
 rest:d=>d.N/d.b*(d.b-d.a),'whole-from-left':d=>d.L/(d.b-d.a)*d.b*100,'fraction-difference':d=>d.D/(d.b-2*d.a)*d.b,
 'two-fractions':d=>{const whole=d.left/(1-d.n1/d.d1-d.n2/d.d2);return Math.round(whole*d.n2/d.d2*100);},
 'unit-cost':d=>d.k*d.p,save:d=>(d.n*d.y-d.n/d.size*d.x),jug:d=>Math.round((d.k*d.cup+d.r)*1000)/1000,
 area:d=>d.L*d.W,perimeter:d=>2*(d.L+d.W),'fence-cost':d=>2*(d.L+d.W)*d.cost*100,'same-perimeter':d=>((d.L+d.W)/2)**2,'area-to-perimeter':d=>2*(d.L+d.A/d.L),
 'corner-perimeter':d=>2*(d.L+d.W),'corner-area':d=>d.L*d.W-d.s*d.s,'trays-money':d=>Math.floor(d.N/d.cap)*d.price,
 'excess-shortage':d=>{const n=(d.e+d.s)/(d.b-d.a);return d.askKids?n:d.a*n+d.e;}
};
test('word problems: every family, tier and seed has a positive answer that matches an independent oracle',()=>{
 const seen=new Set();
 for(const id of P.families)for(let tier=1;tier<=3;tier++)for(let seed=1;seed<=600;seed++){
  const q=C.generate(id,tier,random(seed*7919+tier));
  const f=oracle[q.data.type];assert.ok(f,'oracle for '+q.data.type);seen.add(q.data.type);
  let expected=f(q.data);if(q.data.type==='change'&&!q.data.k)expected=q.data.note-q.data.a-q.data.b;
  assert.ok(Math.abs(expected-q.ans)<1e-6,`${id} t${tier}: ${q.qtext} expected ${expected} got ${q.ans}`);
  assert.ok(q.ans>0&&Number.isFinite(q.ans));if(!q.dec)assert.ok(Number.isInteger(q.ans),q.qtext);
  assert.ok(!/NaN|undefined|Infinity/.test(q.qtext+q.fact+q.help+q.vis),q.qtext);
  for(const m of q.qtext.matchAll(/(\d+)\/(\d+)/g))assert.equal(C.gcd(+m[1],+m[2]),1,'fractions in questions are in simplest form: '+q.qtext);
  if(q.year===3)assert.ok(nums(q.qtext).every(n=>n<=10000),'P3 numbers stay within 10 000: '+q.qtext);
  if(q.year===4)assert.ok(nums(q.qtext.replace(/ /g,'')).every(n=>n<=100000),'P4 numbers stay within 100 000');
  if(tier===3)assert.ok(!q.vis.includes('<svg'),'tier 3 asks Hana to draw her own model');
 }
 assert.ok(seen.size>=40);
});
test('word problems use the names of the people they mention and gendered pronouns consistently',()=>{
 for(let seed=1;seed<500;seed++)for(const id of ['p4-wpfraction','p4-wpdecimal']){const q=C.generate(id,seed%2?2:3,random(seed));assert.ok(!/ (his|He|he) /.test(q.qtext),q.qtext);}
});
test('every skill, including word problems, has a lesson with a single correct check answer',()=>{
 for(const s of C.skills){const l=T.get(s.id);assert.ok(l,'lesson for '+s.id);assert.ok(l.goal&&l.idea&&l.example&&l.steps.length>=2);
  assert.equal(l.check.options.filter(o=>o===l.check.answer).length,1);assert.equal(new Set(l.check.options).size,l.check.options.length);}
});
test('typed answers: fractions, mixed numbers, compound units, remainders and 24-hour time',()=>{
 const frac={layout:'fraction',expect:{N:7,D:12}},mixed={layout:'mixed',expect:{N:11,D:4}};
 assert.equal(C.checkParts(frac,{n:'7',d:'12'}).correct,true);
 assert.equal(C.checkParts(frac,{n:'14',d:'24'}).tag,'form-simplest');
 assert.equal(C.checkParts(frac,{n:'7'}).tag,'format');
 assert.equal(C.checkParts(frac,{n:'7',d:'0'}).tag,'format');
 assert.equal(C.checkParts(frac,{n:'5',d:'12'}).correct,false);
 assert.equal(C.checkParts(mixed,{w:'2',n:'3',d:'4'}).correct,true);
 assert.equal(C.checkParts(mixed,{n:'11',d:'4'}).tag,'form-mixed');
 assert.equal(C.checkParts({layout:'fraction',expect:{N:3,D:1}},{w:'3'}).correct,true);
 const u={layout:'units',expect:{a:3,b:45,k:1000,big:'kg',small:'g'}};
 assert.equal(C.checkParts(u,{a:'3',b:'45'}).correct,true);assert.equal(C.checkParts(u,{a:'2',b:'1045'}).tag,'units-regroup');
 const r={layout:'remainder',expect:{q:12,r:3,divisor:5}};
 assert.equal(C.checkParts(r,{q:'12',r:'3'}).correct,true);assert.equal(C.checkParts(r,{q:'11',r:'8'}).tag,'remainder-size');
 const t={layout:'clock',expect:{h:8,m:5}};
 assert.equal(C.checkParts(t,{h:'08',m:'05'}).correct,true);assert.equal(C.checkParts(t,{h:'8',m:'5'}).display,'0805');assert.equal(C.checkParts(t,{h:'25',m:'00'}).tag,'clock-format');
});
test('course: every skill belongs to exactly one unit, units run in school-year order and finish before the target',()=>{
 const all=K.UNITS.flatMap(u=>u.skills);
 assert.deepEqual([...all].sort(),C.skills.map(s=>s.id).sort());assert.equal(new Set(all).size,all.length);
 const years=K.UNITS.map(u=>u.year);assert.deepEqual(years,[...years].sort());
 const sched=K.schedule({});assert.ok(sched.at(-1).due<=K.date(K.DEFAULTS.target)-2*7*86400000);
 for(let i=1;i<sched.length;i++)assert.ok(sched[i].from>=sched[i-1].due-1);
 for(const cp of K.CHECKPOINTS)assert.ok(K.UNITS.some(u=>u.id===cp.after));
});
function practise(state,ids,at,tier=2){let events=[...(state.events||[])];for(const id of ids)for(let i=0;i<3;i++)events.push({id:id+at+i,skill:id,tier,at:at+i*1000,independent:true,correct:true,course:true,session:'s'+at});return L.merge(state,{events,lessons:Object.fromEntries(ids.map(id=>[id,{at,passed:true,tries:1}]))});}
test('course: sessions start with the first unit, move on when skills are ready and include word problems and review',()=>{
 const now=K.date('2026-10-06');let s={};
 let p=K.plan(s,C.skills,now);assert.equal(p.focus,'p3-place');assert.equal(p.queue.length,10);assert.equal(p.queue[0],'p3-place');
 s=practise(s,['p3-place','p3-patterns','p3-addsub'],now);
 p=K.plan(s,C.skills,now+86400000);assert.equal(p.unit,'u2');assert.equal(p.focus,'p3-wppartwhole');
 s=practise(s,['p3-wppartwhole','p3-wpcompare','p3-tables'],now+2*86400000);
 p=K.plan(s,C.skills,now+3*86400000);assert.equal(p.unit,'u3');
 assert.ok(p.queue.filter(id=>C.skills.find(k=>k.id===id).wordProblem).length>=2,'word problems in each session');
 assert.ok(p.queue.some(id=>['p3-place','p3-patterns','p3-addsub'].includes(id)),'earlier units are reviewed');
 assert.ok(p.queue.every(id=>C.skills.find(k=>k.id===id).year===3),'no P4 skills before the P3 units are done');
});
test('course: pace is compared with the schedule, and the child view never needs the warning',()=>{
 const st=K.status({},C.skills,K.date('2026-12-15'));assert.equal(st.state,'behind');assert.ok(st.advice.length);
 const early=K.status({},C.skills,K.date('2026-10-01'));assert.equal(early.state,'not-started');
 const custom=K.setSettings({},{target:'2027-07-30',perWeek:7},1);assert.equal(K.settings(custom).target,'2027-07-30');assert.equal(K.settings(custom).perWeek,7);
 assert.equal(K.settings(K.setSettings({},{target:'2026-10-10'},1)).target,K.DEFAULTS.target,'targets too close to the start are ignored');
});
function answerAll(paper,wrongSections=[]){for(const it of paper.items){const s=it.spec;if(wrongSections.includes(it.section)){it.response=s.kind==='parts'?{w:'999'}:'999999';continue;}
 if(s.kind==='choice')it.response=s.ans;else if(s.kind==='key')it.response=s.money?(s.ans/100).toFixed(2):String(s.ans);
 else{const e=s.expect;if(s.layout==='fraction'||s.layout==='mixed'){const w=Math.floor(e.N/e.D),r=e.N%e.D;it.response=r?{w:w||'',n:String(r),d:String(e.D)}:{w:String(w)};}else if(s.layout==='units')it.response={a:String(e.a),b:String(e.b)};else if(s.layout==='remainder')it.response={q:String(e.q),r:String(e.r)};else it.response={h:String(e.h),m:String(e.m)};}}return paper;}
test('checkpoints match the school format and full marks are reachable for every checkpoint',()=>{
 for(const cp of K.CHECKPOINTS)for(let seed=1;seed<=40;seed++){
  const p=Pa.build(cp.id,C.skills,{random:random(seed)}),f=Pa.FORMATS[cp.size];
  assert.equal(p.items.filter(i=>i.section==='A').length,f.A.length);assert.equal(p.items.filter(i=>i.section==='B').length,f.B);assert.equal(p.items.filter(i=>i.section==='C').length,f.C.length);
  assert.equal(p.max,cp.size==='short'?35:54);
  for(const it of p.items.filter(i=>i.section==='A')){assert.equal(it.spec.kind,'choice');assert.equal(it.spec.choices.filter(c=>c.v===it.spec.ans).length,1);assert.equal(new Set(it.spec.choices.map(c=>c.v)).size,it.spec.choices.length);}
  for(const it of p.items.filter(i=>i.section==='C'))assert.ok(C.skills.find(s=>s.id===it.skill).wordProblem,'Section C is word problems');
  const allowed=new Set(K.UNITS.filter(u=>cp.units.includes(u.id)||(cp.review||[]).includes(u.id)).flatMap(u=>u.skills));
  assert.ok(p.items.every(i=>allowed.has(i.skill)),'only taught units appear');
  const sc=Pa.score(answerAll(p),C.skills);assert.equal(sc.score,sc.max);assert.equal(sc.band,'Ready');
 }
});
test('checkpoint results drive repairs and more word problems, and travel with family sync and reviews',()=>{
 const p=answerAll(Pa.build('cp1',C.skills,{random:random(9)}),['C']),sc=Pa.score(p,C.skills,{now:1000}),rec=Pa.record(sc);
 assert.equal(sc.sections.find(s=>s.id==='C').earned,0);assert.ok(sc.recs.some(r=>/Word problems/.test(r)));
 const state=L.merge({},{papers:[rec]});
 assert.equal(K.adjustments(state).wordProblems,3);
 const repairs=K.repairs(state,C.skills,2000).map(r=>r.skill);assert.ok(repairs.length&&repairs.every(id=>C.skills.find(s=>s.id===id).wordProblem));
 const plan=K.plan(state,C.skills,K.date('2026-10-06'));assert.ok(plan.queue.some(id=>repairs.includes(id)),'repairs are reviewed first');
 const later=L.merge(state,{events:repairs.flatMap(id=>[1,2].map(i=>({id:id+i,skill:id,tier:2,at:5000+i,independent:true,correct:true})))});
 assert.equal(K.repairs(later,C.skills,9000).length,0,'two later independent answers clear a repair');
 assert.deepEqual(L.merge(L.merge({},{papers:[rec]}),{papers:[rec]}).papers.length,1);
 const review=R.build(state,C.skills,{now:3000,timeZone:'UTC'});// Inside `learning` so the existing Drive relay allowlist passes it unchanged.
 assert.equal(review.learning.papers.length,1);assert.ok(review.learning.course&&review.learning.course.units.length===16);
 const half=Pa.markItem({marks:2,spec:{kind:'parts',layout:'fraction',expect:{N:1,D:2}}},{n:'2',d:'4'});assert.equal(half.earned,1,'unsimplified fraction loses one mark');
});
