const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../curriculum.js'),T=require('../lessons.js'),P=require('../problems.js'),K=require('../coach.js'),L=require('../learning.js'),Course=require('../course.js');
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};

test('part-whole recaps rotate whole/part examples and checks with a single correct answer',()=>{
 const id='p3-wppartwhole',checks=[];let previous='';
 for(let i=0;i<12;i++){
  const variant=T.nextVariant(id,checks),d=T.get(id,variant),c=d.check;
  assert.notEqual(c.question,previous);assert.ok(d.idea.includes('whole')&&d.idea.includes('parts'));
  assert.equal(c.options.filter(v=>v===c.answer).length,1);assert.equal(new Set(c.options).size,c.options.length);
  const numbers=c.question.match(/\d+/g).map(Number);
  const expected=i%4===2?numbers.reduce((a,b)=>a+b,0):numbers[0]-numbers[1]-numbers[2];
  assert.equal(+c.answer,expected);assert.ok(c.visual.includes('?'));assert.ok(!c.visual.includes(`>${c.answer}</text>`));
  checks.push({skill:id,question:c.question});previous=c.question;
 }
 assert.equal(T.nextVariant(id,[{skill:id,question:'A whole is 900. Two parts are 400 and 350. What is the third part?'}]),0);
 assert.equal(T.get('p3-place',100),T.get('p3-place'),'ordinary lessons keep their existing visual/check');
});

test('changed part-whole applications stay at the current tier and keep the optional bar separate',()=>{
 for(let tier=1;tier<=3;tier++)for(let seed=1;seed<=100;seed++){
  assert.equal(K.hasTransfer('p3-wppartwhole',tier),true);
  const q=K.transfer(C,'p3-wppartwhole',tier,rng(seed)),d=q.data;
  assert.equal(q.tier,tier);assert.equal(q.year,3);assert.ok(q.wordProblem);
  assert.equal(q.ans,d.findWhole?d.parts.reduce((a,b)=>a+b,0):d.whole-d.parts[0]-d.parts[1]);
  assert.equal(q.vis,'','application starts without a supplied model');assert.ok(q.supportVisual.includes('?'));
  assert.ok(!q.supportVisual.includes(`= ${q.ans}`),'hint model does not supply a solved equation');
  assert.ok(!q.help.includes(' = '),'hint does not solve the current problem');
  assert.ok(q.ans>0&&q.ans<=10000);
 }
});

test('part-whole feedback distinguishes adding known parts from forgetting a part',()=>{
 const q=C.generate('p3-wppartwhole',1,rng(91));
 assert.equal(K.feedback(q,q.data.parts[0]+q.data.parts[1]).tag,'whole-vs-part');
 assert.equal(K.feedback(q,q.data.total-q.data.parts[0]).tag,'missing-known-part');
 assert.equal(L.independent({independent:true,hints:1}),false);
 assert.equal(L.independent({independent:true,lessonHelp:true}),false);
});

test('Hana course workload stays ten questions and five weekly sessions',()=>{
 assert.equal(Course.DEFAULTS.questions,10);assert.equal(Course.DEFAULTS.perWeek,5);
 assert.equal(Course.plan({},C.skills).queue.length,10);
});
