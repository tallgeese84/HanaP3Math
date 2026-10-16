const test=require('node:test'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const C=require('../curriculum.js');require('../problems.js');
const L=require('../learning.js'),K=require('../course.js'),R=require('../learning-review.js');
const NOW=Date.parse('2026-10-12T12:00:00Z');
const answer=(id,at,tier=2,independent=true,extra={})=>({id,skill:'p3-place',at,tier,independent,correct:true,...extra});
const wins=(skill='p3-place',start=1)=>[0,1,2].map(i=>answer(skill+'-'+i,start+i,2,true,{skill}));
const history=()=>({events:[...wins(),...wins('p3-patterns'),...[4,5,6,7,8,9].map(i=>answer('review-'+i,i,1,false,{hints:1}))]});

test('historical readiness earns a stable frontier while current review, queues and checkpoints stay unchanged',()=>{
 const raw=history(),s=L.captureCourseEarned(raw),earned=K.earnedStatus(s,C.skills),current=K.status(s,C.skills,NOW);
 assert.equal(earned.current.id,'u2');assert.equal(current.current.id,'u1');
 assert.equal(earned.progressPct,1.5/31);assert.equal(current.progressPct,.75/31);
 assert.equal(s.courseEarned['p3-place'].at,3);assert.equal(s.courseEarned['p3-place'].proof.length,3);
 assert.deepEqual(K.plan(s,C.skills,NOW).queue,K.plan(raw,C.skills,NOW).queue);
 assert.deepEqual(current.checkpoints,K.status(raw,C.skills,NOW).checkpoints);
 assert.deepEqual(L.evidence(s,'p3-place',NOW),L.evidence(raw,'p3-place',NOW));
 const long=L.merge(s,{events:Array.from({length:24},(_,i)=>answer('long-review-'+i,100+i,1,false,{hints:1}))});
 assert.match(K.status(long,C.skills,NOW).advice.join(' '),/earlier/);
 const later=L.merge(s,{events:[answer('another-review',NOW,1,false,{revealed:true})]});
 assert.equal(K.earnedStatus(later,C.skills).progressPct,earned.progressPct);
});

test('a previously secure skill keeps its achievement when a later review needs help',()=>{
 const raw={events:Array.from({length:6},(_,i)=>answer('secure-'+i,NOW-2*86400000+i*86400000/3,2,true,{form:'form-'+i%2,phase:i===5?'recall':'practice',reviewGapMs:i===5?86400000:0}))};
 assert.equal(L.evidence(raw,'p3-place',NOW).secure,true);
 const saved=L.captureCourseEarned(raw),later=L.merge(saved,{events:[0,1,2,3,4,5].map(i=>answer('supported-'+i,NOW+i,2,false,{hints:1}))});
 assert.equal(L.evidence(later,'p3-place',NOW).secure,false);
 assert.equal(K.skillStatus(later,'p3-place',C.skills,NOW).status,'started');
 assert.deepEqual(later.courseEarned,saved.courseEarned);
});

test('backfill sorts historical prefixes and conservatively deduplicates answer identities',()=>{
 const events=wins(),forward=L.captureCourseEarned({events}),reverse=L.captureCourseEarned({events:[...events].reverse()});
 assert.deepEqual(reverse.courseEarned,forward.courseEarned);
 assert.deepEqual(L.captureCourseEarned({events:[events[0],events[0],events[0]]}).courseEarned,{});
 assert.deepEqual(L.captureCourseEarned({events:[...events,{...events[2],hints:1}]}).courseEarned,{});
 assert.deepEqual(L.merge({events},{events:[{...events[2],hints:1}]}).courseEarned,{},'contradictory legacy inputs merge before new credit is derived');
});

test('hints, retries, repeats, guesses, revealed work and lessons cannot create earned automatic skills',()=>{
 for(const flag of [{hints:1},{tries:1},{lessonHelp:true},{repeated:true},{confidence:'guess'},{revealed:true},{correct:false}]){
  assert.deepEqual(L.captureCourseEarned({events:wins().map(e=>({...e,...flag}))}).courseEarned,{});
 }
 assert.deepEqual(L.captureCourseEarned({stars:100,lessons:{'p3-place':{at:4,passed:true}},checks:[{id:'check',skill:'p3-place',at:4,passed:true}]}).courseEarned,{});
 assert.deepEqual(L.captureCourseEarned({events:wins().map(e=>({...e,tier:1}))}).courseEarned,{});
});

test('JSON reload, settings changes and older snapshots preserve the existing earned map',()=>{
 const s=L.captureCourseEarned(history()),saved=JSON.parse(JSON.stringify(s));
 assert.deepEqual(L.captureCourseEarned(saved).courseEarned,s.courseEarned);
 assert.deepEqual(L.merge(s,{events:[]}).courseEarned,s.courseEarned);
 assert.deepEqual(K.setSettings(s,{perWeek:7},NOW).courseEarned,s.courseEarned);
 assert.deepEqual(L.merge(s,{events:history().events,courseEarned:{}}).courseEarned,s.courseEarned);
});

test('earned certificates merge commutatively, associatively and idempotently despite later corrections',()=>{
 const A=L.captureCourseEarned({events:wins()}),B=L.captureCourseEarned({events:wins('p3-place',10).map(e=>({...e,id:'later-'+e.id}))});
 const a={courseEarned:A.courseEarned},b={courseEarned:B.courseEarned},c={events:[{...wins()[2],hints:1}]};
 const left=L.merge(L.merge(a,b),c),right=L.merge(a,L.merge(b,c));
 assert.deepEqual(left.courseEarned,right.courseEarned);assert.equal(left.courseEarned['p3-place'].at,3);
 assert.deepEqual(L.merge(a,b).courseEarned,L.merge(b,a).courseEarned);
 assert.deepEqual(L.merge(A,A),A);
 assert.deepEqual(L.merge(A,c).courseEarned,A.courseEarned,'a milestone earned earlier stays recorded; corrected current evidence remains conservative');
 assert.equal(L.independent(L.merge(A,c).events.find(e=>e.id===c.events[0].id)),false);
});

test('backfill captures milestones before pruning and certificates survive after old answers are gone',()=>{
 const events=[...wins(),...Array.from({length:5001},(_,i)=>answer('new-'+i,100+i,1,false,{skill:'p4-place',hints:1}))];
 const s=L.captureCourseEarned({events});assert.equal(s.events.length,5000);assert.ok(!s.events.some(e=>e.skill==='p3-place'));
 assert.ok(s.courseEarned['p3-place']);assert.deepEqual(L.clean(JSON.parse(JSON.stringify(s))).courseEarned,s.courseEarned);
 assert.deepEqual(L.merge(null,{events}).courseEarned,s.courseEarned);
});

test('newly restored earlier history deterministically improves the achievement date',()=>{
 const later=L.captureCourseEarned({events:wins('p3-place',10)}),earlier=wins('p3-place',1).map(e=>({...e,id:'early-'+e.id}));
 const restored=L.merge(later,{events:earlier});assert.equal(restored.courseEarned['p3-place'].at,3);
});

test('manual achievement requires an actual saved drawing and lesson evidence',()=>{
 const e=answer('drawing',4,1,false,{skill:'p3-drawlines',manual:true}),lesson={'p3-drawlines':{at:6,passed:false,tries:1}};
 assert.deepEqual(L.captureCourseEarned({events:[e]}).courseEarned,{});
 assert.deepEqual(L.captureCourseEarned({lessons:lesson}).courseEarned,{});
 const s=L.captureCourseEarned({events:[e],lessons:lesson});
 assert.equal(s.courseEarned[e.skill].rule,'manual-v1');assert.equal(s.courseEarned[e.skill].at,6);
 assert.equal(K.skillStatus(s,e.skill,C.skills).status,'ready');
});

test('malformed milestones are rejected and exported proof records contain no private extra fields',()=>{
 const good=L.captureCourseEarned({events:wins()}).courseEarned['p3-place'];
 for(const bad of [{...good,at:NaN},{...good,proof:[]},{...good,rule:'mastered'},{...good,proof:good.proof.map(p=>({...p,tier:1}))},{...good,proof:[good.proof[0],good.proof[0],good.proof[2]]},{...good,proof:good.proof.map(p=>({...p,hints:1}))}])assert.deepEqual(L.clean({courseEarned:{'p3-place':bad}}).courseEarned,{});
 assert.deepEqual(L.clean({courseEarned:{'<script>':good,'p3-drawlines':good}}).courseEarned,{});
 const s={courseEarned:{'p3-place':{...good,secret:'never-export',proof:good.proof.map(p=>({...p,secret:'never-export',question:'private extra'}))}}};
 const b=R.build(s,C.skills,{now:NOW,timeZone:'America/Chicago'});
 assert.equal(b.appVersion,'h26');assert.ok(b.learning.courseEarned['p3-place']);assert.ok(!JSON.stringify(b).includes('never-export'));assert.ok(!JSON.stringify(b).includes('private extra'));
 assert.equal(b.learning.course.earnedCurrent,'u1');assert.equal(b.learning.course.earnedProgressPct,.75/31);
});

test('large retained history uses ordinary readiness and bounded milestone validation',()=>{
 const s=L.captureCourseEarned({events:[...wins(),...Array.from({length:4997},(_,i)=>answer('large-'+i,100+i,1,false,{skill:'p4-place'}))]});
 const begin=performance.now(),st=K.status(s,C.skills,NOW),earned=K.earnedStatus(s,C.skills),ms=performance.now()-begin;
 assert.equal(st.current.id,'u1');assert.equal(earned.earnedSkills,1);
 console.log(`5,000-answer current/earned status computed in ${ms.toFixed(1)} ms`);
});
