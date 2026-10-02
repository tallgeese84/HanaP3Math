const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../exam-bank'),C=require('../curriculum'),L=require('../learning'),K=require('../course'),R=require('../learning-review'),P=require('../papers');
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
function fixture(){return {format:'hana-exam-pack',version:1,id:'test',title:'Test pack',papers:[{id:'paper',title:'Original test fixture',year:3,pages:[{image},{image,answerKey:true}]}],questions:[{id:'q1',paper:'paper',number:'1',page:1,skill:'p3-place',tier:1,qtext:'What is the value of 3 in 432?',answer:30,kind:'key',help:'Find the place.',solution:'The 3 represents 3 tens: 30.'}]};}
test('private pack validation strips extra fields and rejects executable images, duplicates and wrong-year skills',()=>{
 const raw=fixture();raw.secret='not retained';raw.questions[0].vis='<script>bad()</script>';const p=B.validate(raw);
 assert.equal(p.secret,undefined);assert.equal(p.questions[0].vis,undefined);
 for(const mutate of [x=>x.papers[0].pages[0].image='data:image/svg+xml;base64,AAAA',x=>x.questions.push(x.questions[0]),x=>x.questions[0].skill='p4-place',x=>x.questions[0].page=2,x=>x.papers[0].pages=[]]){const x=fixture();mutate(x);assert.throws(()=>B.validate(x));}
});
test('imported questions respect the attempted level, exposure, session reuse and school year',()=>{
 const p=B.validate(fixture()),now=10*86400000,s=B.select([p],{},'p3-place',1,{now});assert.equal(s.ans,30);assert.equal(s.sourceQuestion,'1');
 assert.equal(B.select([p],{},'p3-place',2,{now}),null);
 assert.equal(B.select([p],{},'p3-place',1,{used:['q1'],now}),null);
 const e={id:'e',skill:'p3-place',tier:1,at:now-1000,sourceId:'q1'};
 assert.equal(B.select([p],{events:[e]},'p3-place',1,{now}),null);
 assert.equal(B.select([p],{events:[e]},'p3-place',1,{now:now+86400000}).sourceId,'q1');
 assert.deepEqual(B.queue([p],{},4),[]);
});
test('checkpoint retakes clear only reassessed skills and retain mixed-result repairs',()=>{
 const paper=(id,at,items)=>({id,cp:'cp1',at,complete:true,items:items.map(([skill,earned])=>({skill,earned,marks:1}))});
 const first=paper('a',1,[['p3-place',0],['p3-addsub',0]]);
 const pass=paper('b',2,[['p3-place',1]]);
 assert.deepEqual(K.repairs({papers:[first,pass]},C.skills).map(x=>x.skill),['p3-addsub']);
 const mixed=paper('c',3,[['p3-place',1],['p3-place',0]]);
 assert.equal(K.repairs({papers:[first,pass,mixed]},C.skills).length,2);
});
test('review retains course participation, source references and checkpoint working without pack images or credentials',()=>{
 const state={events:[{id:'e',skill:'p3-place',tier:1,at:10,course:true,sourceId:'q1',sourcePaper:'Fixture',sourcePage:1,sourceQuestion:'1',secret:'private-secret-sentinel-QA'}],papers:[{id:'p',at:20,items:[{id:'q',working:[[[.2,.3],[.5,.8]]],solution:'Check the tens.',image,secret:'private-secret-sentinel-QA'}]}]};
 const r=R.build(state,C.skills);assert.equal(r.learning.events[0].course,true);assert.equal(r.learning.events[0].sourceId,'q1');assert.deepEqual(r.learning.papers[0].items[0].working,[[[.2,.3],[.5,.8]]]);assert.equal(r.learning.papers[0].items[0].solution,'Check the tens.');assert.ok(!JSON.stringify(r).includes('private-secret-sentinel-QA'));assert.ok(!JSON.stringify(r).includes('data:image'));
});
test('short custom course schedules still leave the requested consolidation period',()=>{
 const state={course:{start:'2027-01-01',target:'2027-03-01',updatedAt:1}},s=K.settings(state),last=K.schedule(state).at(-1);
 assert.ok(Math.abs(last.due-(K.date(s.target)-21*86400000))<1);
});
test('checkpoint money answers cannot round an extra decimal into a correct cent amount',()=>{
 const it={marks:2,spec:{kind:'key',money:true,ans:123}};
 assert.equal(P.markItem(it,'1.234').correct,false);assert.equal(P.markItem(it,'1.23').earned,2);
});
