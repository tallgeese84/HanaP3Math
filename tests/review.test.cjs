const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../curriculum.js'),L=require('../learning.js'),K=require('../coach.js'),R=require('../learning-review.js');
const DAY=86400000,now=Date.parse('2026-09-28T01:27:00Z'),base={id:'answer',session:'session',skill:'p3-place',year:3,tier:1,at:now,correct:true,independent:true,hints:0,tries:0};
test('guesses, exact repeats, lesson help and manual work do not increase independent evidence',()=>{
 for(const flag of [{confidence:'guess'},{repeated:true},{lessonHelp:true},{manual:true},{revealed:true},{tries:1}]){const events=Array.from({length:8},(_,i)=>({...base,...flag,id:String(i),at:now+i}));assert.equal(L.evidence({events},base.skill).secure,false);assert.equal(L.evidence({events},base.skill).success,0);assert.equal(L.evidence({events},base.skill).tier,1);}
 assert.equal(L.independent({...base,confidence:'unsure'}),true,'uncertainty alone is not an error');
});
test('recall review is delayed by any completed lesson or lesson check, without adding mastery',()=>{
 const state={events:[{...base,at:now-3*DAY}],lessons:{'p3-place':{at:now-1000,passed:true,tries:1}},checks:[{id:'check',skill:'p3-place',at:now-500,passed:true}]};
 assert.equal(L.exposure(state,'p3-place'),now-500);assert.equal(L.evidence(state,'p3-place',now).due,false);assert.equal(L.evidence(state,'p3-place',now).total,1);
 state.exposures={'p3-place':now};assert.equal(L.exposure(state,'p3-place'),now,'a viewed but unfinished lesson is still exposure');
});
test('cloud union preserves rich attempts and later working without laundering support',()=>{
 const rich={...base,updatedAt:now+50,tries:1,independent:false,notes:{solve:'I checked my groups'},attempts:[{id:'a',at:now-10,response:4,correct:false},{id:'b',at:now,response:40,correct:true}]};
 const merged=L.merge({events:[rich],checks:[{id:'c',skill:base.skill,at:now}]},{events:[base]});assert.equal(merged.events.length,1);assert.equal(merged.events[0].attempts.length,2);assert.equal(merged.events[0].notes.solve,rich.notes.solve);assert.equal(L.independent(merged.events[0]),false);assert.equal(merged.checks.length,1);
 assert.deepEqual(L.merge(merged,merged),merged);assert.deepEqual(L.merge({events:[base]},{events:[rich]}).events,merged.events);
});
test('calendar reports respect the parent timezone and the two non-overlapping weeks',()=>{
 const at=iso=>Date.parse(iso),state={events:[{...base,id:'today',at:at('2026-09-27T20:00:00Z')},{...base,id:'six-days',at:at('2026-09-21T12:00:00Z'),confidence:'guess'},{...base,id:'seven-days',at:at('2026-09-20T12:00:00Z'),hints:1},{...base,id:'thirteen-days',at:at('2026-09-14T12:00:00Z'),revealed:true},{...base,id:'outside',at:at('2026-09-13T12:00:00Z')}]};
 assert.equal(R.day(now,'America/Chicago'),'2026-09-27');assert.equal(R.day(now,'Asia/Singapore'),'2026-09-28');
 const p=R.periods(state,now,'America/Chicago');assert.equal(p.today.completed,1);assert.equal(p.last7.completed,2);assert.equal(p.previous7.completed,2);assert.equal(p.last7.guessed,1);assert.equal(p.previous7.supported,1);assert.equal(p.previous7.revealed,1);assert.equal(p.last7.unmeasured,2);
});
test('review exports whitelist learning data, preserve unknown legacy responses and escape spreadsheet formulas',()=>{
 const state={events:[{...base,question:'=IMPORTXML("private")',secret:'do-not-export',url:'https://private.example',notes:{solve:'=2+2',secret:'do-not-export'}}],hq_sync:{secret:'do-not-export'},lessons:{}};
 const b=R.build(state,C.skills,{now,timeZone:'America/Chicago'}),json=JSON.stringify(b);assert.ok(!json.includes('do-not-export'));assert.ok(!json.includes('private.example'));assert.equal(b.learning.events[0].attempts,undefined);assert.match(R.csv(b),/"'=IMPORTXML/);assert.match(R.csv(b),/"'=2\+2"/);assert.match(R.csv(b),/Not recorded/);assert.equal(b.timeZone,'America/Chicago');
});
test('all authored applications have independently calculated answers and respect their year',()=>{
 for(const id of K.transferSkills)for(let tier=1;tier<=3;tier++)for(const random of [()=>0,()=>0.37,()=>0.999999]){
  const q=K.transfer(C,id,tier,random),nums=q.qtext.replace('1 000','1000').match(/\d+(?:\.\d+)?/g).map(Number);let expected;
  switch(id){
   case 'p3-place':case 'p4-place':expected=nums[2]*1000+nums[3]*10+nums[4];assert.ok(expected<(id==='p3-place'?10000:100000));break;
   case 'p3-patterns':case 'p4-patterns':expected=2*nums[0]-nums[1];break;
   case 'p3-addsub':expected=nums[0]+nums[1];break;
   case 'p3-tables':expected=nums[1]/nums[0];break;
   case 'p3-muldiv':case 'p4-divide':expected=nums[0]/nums[1];assert.ok(nums[0]<(id==='p3-muldiv'?1000:10000));break;
   case 'p4-multiply':expected=nums[0]*nums[1];assert.ok(nums[0]<1000&&nums[1]<100);break;
   case 'p3-remainder':case 'p4-remainder':expected=Math.ceil(nums[1]/nums[0]);break;
   case 'p3-money':expected=Math.round((nums[0]+nums[1])*100);break;
   case 'p3-measure':expected=nums[0]*100-nums[1];break;
   case 'p3-time':expected=nums[0]+nums[1];assert.ok(!q.qtext.includes('1500'));break;
   case 'p3-area':expected=nums[0]*nums[1];break;
   case 'p4-dimension':expected=nums[0]/2-nums[1];assert.ok(expected<=nums[1]);break;
   case 'p3-story':expected=nums[0]*nums[1]+nums[2];break;
   case 'p4-round':expected=Math.round(nums[1]/nums[0])*nums[0];break;
   case 'p4-fracset':expected=nums[0]*(1-nums[1]/nums[2]);break;
   case 'p4-decimalops':expected=nums[0]+nums[1];break;
   default:assert.fail('Missing oracle for '+id);
  }
  assert.ok(Math.abs(q.ans-expected)<1e-8,id+': '+q.qtext);assert.equal(q.year,C.skills.find(s=>s.id===id).year);assert.equal(q.form,id+':application');assert.ok(q.help&&q.fact);
 }
 assert.equal(K.transfer(C,'p4-piecharts',1),null,'do not fabricate coverage');
});
test('feedback offers a specific check, never an asserted diagnosis',()=>{
 assert.equal(K.feedback({skill:'p3-place',ans:40},400).tag,'place-value');assert.equal(K.feedback({skill:'p3-money',ans:125,money:true},12500).tag,'money-units');assert.equal(K.feedback({skill:'p4-dimension',ans:5},6).tag,'measure-choice');
});
