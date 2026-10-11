/* Small authored applications plus conservative feedback. No learner data or AI keys. */
(function(root){
'use strict';
const forms={};
const applications={};
const add=(ids,make)=>ids.split(' ').forEach(id=>forms[id]=make);
const integer=(r,a,b)=>a+Math.floor(r()*(b-a+1));
function n(qtext,ans,help,unit=''){return {qtext,ans,help,unit,kind:'key',eq:'<span class="blank" id="blank">?</span>'+(' '+unit),fact:`${ans}${unit?' '+unit:''}. ${help}`,phrase:qtext,vis:''};}
add('p3-place p4-place',(r,t,id)=>{const k=integer(r,1,id==='p3-place'?[0,3,6,9][t]:[0,9,50,99][t]),tens=integer(r,1,9),ones=integer(r,1,9);return n(`A shop packs counters in boxes of 1 000 and bags of 10. There are ${k} boxes, ${tens} bags and ${ones} loose counters. How many counters are there?`,k*1000+tens*10+ones,'Add the thousands, tens and ones. Use zero for the empty hundreds place.','counters');});
add('p3-patterns p4-patterns',(r,t)=>{const step=integer(r,2,5)*[0,10,50,100][t],start=integer(r,10,80)*[0,10,50,100][t];return n(`A number machine adds the same amount each time. Its outputs are ${start}, ${start+step}, ${start+2*step}. What number came immediately before ${start}?`,start-step,'Find the constant increase, then undo it by subtracting.');});
add('p3-addsub',(r,t)=>{const start=integer(r,20,[0,80,600,6000][t]),away=integer(r,5,19);return n(`A library lends ${away} books. It has ${start-away} books left. How many books did it have before the loan?`,start,`Put the borrowed books back: ${start-away} + ${away} = ${start}.`,'books');});
add('p3-tables',(r,t)=>{const rows=integer(r,6,9),seats=integer(r,2,[0,4,7,10][t]);return n(`A hall has ${rows} equal rows of chairs. There are ${rows*seats} chairs altogether. How many chairs are in each row?`,seats,`Find the missing factor: ${rows} × ? = ${rows*seats}.`,'chairs');});
add('p3-muldiv p4-divide',(r,t,id)=>{const boxes=integer(r,2,9),each=integer(r,12,id==='p3-muldiv'?[0,30,60,99][t]:[0,99,499,999][t]);return n(`${boxes*each} crayons are shared equally among ${boxes} boxes. How many crayons go in each box?`,each,'Divide the total into equal groups, then check by multiplying.','crayons');});
add('p4-multiply',(r,t)=>{const a=integer(r,12,[0,30,90,150][t]),b=integer(r,11,25);return n(`A school buys ${a} packs, each containing ${b} stickers. How many stickers does it buy altogether?`,a*b,`Split ${b} into tens and ones. Multiply each part, then add.`,'stickers');});
add('p3-remainder p4-remainder',(r,t)=>{const seats=integer(r,3,9),full=integer(r,2,[0,8,20,60][t]),left=integer(r,1,seats-1);return n(`Each small boat can carry ${seats} people. ${full*seats+left} people need a place. What is the smallest number of boats needed?`,full+1,`${full} boats leave ${left} people without a place. They need one more boat.`,'boats');});
add('p3-money',(r,t)=>{const price=integer(r,100,[0,500,2000,9000][t]),left=integer(r,50,[0,100,300,900][t]),q=n(`Hana pays for a ${'$'+(price/100).toFixed(2)} book and has ${'$'+(left/100).toFixed(2)} left. How much money did she have at first?`,price+left,'Add the cost and the money left to find the starting amount.');q.money=true;q.eq='$<span class="blank" id="blank">?</span>';q.fact=`$${(q.ans/100).toFixed(2)}. ${q.help}`;return q;});
add('p3-measure',(r,t)=>{const metres=integer(r,1,[0,3,9,30][t]),cut=integer(r,10,90);return n(`A ribbon is ${metres} m long. Hana cuts off ${cut} cm. How many centimetres are left?`,metres*100-cut,`First convert ${metres} m to ${metres*100} cm, then subtract ${cut} cm.`,'cm');});
add('p3-time',(r,t)=>{const before=integer(r,1,[0,3,6,11][t])*5,after=integer(r,1,[0,3,6,11][t])*5;return n(`The first part of an activity takes ${before} minutes and the second part takes ${after} minutes. The two parts happen one after the other and finish at 3 p.m.. How many minutes before 3 p.m. did the whole activity start?`,before+after,'Combine the two durations before counting backwards from the finish.','min');});
add('p3-area p4-dimension',(r,t,id)=>{const w=integer(r,3,[0,5,9,12][t]),h=integer(r,2,w);return id==='p3-area'?n(`A rectangular board has ${w} rows of ${h} square tiles. Each tile covers 1 cm². What area do the tiles cover?`,w*h,'Each row has the same number of square units. Multiply rows by tiles per row.','cm²'):n(`A rectangular garden has perimeter ${2*(w+h)} m. Its length is ${w} m. What is its breadth?`,h,`Half the perimeter is ${w+h} m. Subtract the known length.`,'m');});
add('p3-story',(r,t)=>{const groups=integer(r,3,[0,4,6,8][t]),each=integer(r,6,[0,7,9,12][t]),extra=integer(r,2,7);return n(`Hana shares some stickers equally among ${groups} friends. Each receives ${each}. She still has ${extra} stickers. How many did she have at first?`,groups*each+extra,'Find the stickers shared, then put back the stickers kept.','stickers');});
add('p4-round',(r,t)=>{const unit=[0,10,100,1000][t],value=integer(r,11,89)*unit+integer(r,1,unit-1);return n(`A shop rounds prices to the nearest $${unit} for an estimate. A delivery costs $${value}. What price should it use for the estimate?`,Math.round(value/unit)*unit,`Choose the nearer multiple of ${unit}. Check the next smaller place to decide which way to round.`,'dollars');});
add('p4-fracset',(r,t)=>{const d=integer(r,3,[0,4,6,9][t]),k=integer(r,2,[0,3,6,9][t]);return n(`A box has ${d*k} beads. 1/${d} of them are blue and all the rest are red. How many beads are red?`,(d-1)*k,'Find the blue beads first, then subtract them from the whole set.','beads');});
add('p4-decimalops',(r,t)=>{const a=integer(r,120,[0,199,350,999][t]),b=integer(r,30,[0,50,90,399][t]),q=n(`A bottle held some water. After ${ (b/100).toFixed(2)} litres were poured out, ${(a/100).toFixed(2)} litres remained. How many litres were in the bottle at first?`,(a+b)/100,'Add the poured amount back to the remainder. Align decimal points.','litres');q.dec=true;return q;});
// An application changes the relationship without raising the current tier.
// The bar and method are optional hints; no worked solution is shown first.
add('p3-wppartwhole',(r,t)=>{
 const a=integer(r,t===1?120:900,t===1?260:2600),b=t===3?a+integer(r,150,600):integer(r,t===1?60:600,t===1?150:1700),left=integer(r,t===1?100:500,t===1?280:1800),whole=a+b+left,findWhole=r()<.5;
 const question=t===3?(findWhole?`Hana gave ${a} beads to Euna and ${b-a} more beads than that to Jonah. She has ${left} beads left. How many beads did she have at first?`:`Three boxes contain ${whole} beads altogether. The first box contains ${a} beads. The second contains ${b-a} more than the first. How many beads are in the last box?`):(findWhole?`Hana gave ${a} beads to Euna and ${b} to Jonah. She has ${left} beads left. How many beads did she have at first?`:`Three boxes contain ${whole} beads altogether. The first has ${a} and the second has ${b}. How many beads are in the last box?`);
 const help='Name the whole and the parts. Put each part inside one bar. Add the parts to find the whole, or subtract the known parts from the whole to find a missing part.';
 const q=n(question,findWhole?whole:left,help,'beads'),P=typeof module==='object'&&module.exports?require('./problems.js'):root.HanaProblems;
 // All pieces have equal drawn widths, so the unknown length cannot give away
 // the answer. Tier 3 leaves the second amount to be worked out by Hana.
 q.supportVisual=P.bars([{name:'Parts',segs:[{v:1,text:String(a)},{v:1,text:t===3?`${a} + ${b-a}`:String(b)},{v:1,text:findWhole?String(left):'?',unknown:!findWhole}]}],{top:{text:findWhole?'?':String(whole)},label:findWhole?'Find the starting whole from the given parts':'Find the missing part inside the whole',caption:'Lengths are not to scale. Label and check each part.'});
 q.wordProblem=true;q.data={type:'part-whole-application',parts:[a,b,left],whole,findWhole};
 q.fact=`${q.ans} beads. ${t===3?`Second part: ${a} + ${b-a} = ${b}. `:''}${findWhole?`Whole: ${a} + ${b} + ${left} = ${whole}.`:`Known parts: ${a} + ${b} = ${a+b}. Missing part: ${whole} − ${a+b} = ${left}.`} Check: all three parts make ${whole}.`;
 return q;
});
function transfer(C,id,tier,random=Math.random){
 const richer=tier>=2&&applications[id]?.(random,tier);if(richer)return richer;
 if(!forms[id])return null;const skill=C.skills.find(s=>s.id===id),q=forms[id](random,tier,id);
 return {...q,skill:id,year:skill.year,topic:skill.topic,title:skill.name,tier,form:id+':application',signature:id+'|'+q.qtext+'|'+q.ans};
}
function form(q){return q.form||q.skill+':'+q.qtext.replace(/\d+(?:\.\d+)?/g,'#').replace(/\s+/g,' ').slice(0,180);}
function feedback(q,response){
 const value=typeof response==='number'?response:Number(response),a=Number(q.ans);
 const slip=q.misconceptions?.find(s=>Number.isFinite(s.value)&&Math.abs(s.value-value)<1e-6);
 if(slip)return {tag:slip.tag,message:slip.message};
 if(q.skill==='p3-wppartwhole'){
  const d=q.data||{},whole=d.whole??d.total,parts=d.parts||('a'in d?[d.a,d.a+d.d]:[]);
  if(!d.findWhole&&parts.length>=2&&value===parts[0]+parts[1])return {tag:'whole-vs-part',message:'That is the total of the known parts. Which part are we finding? The whole also includes the missing part.'};
  if(!d.findWhole&&parts.length>=2&&(value===whole-parts[0]||value===whole-parts[1]))return {tag:'missing-known-part',message:'Both known parts belong inside the whole. Combine them first, then find what remains.'};
  return {tag:'whole-vs-part',message:d.findWhole?'The starting whole includes what was given away AND what is left. Label every part before adding.':'Label the whole, the known parts and the question mark. The whole equals all the parts together.'};
 }
 if(/place/.test(q.skill)&&a>0&&(value===a*10||value===a/10))return {tag:'place-value',message:'Check which place the digit is in. One place to the left is ten times as much.'};
 if(q.money&&value===a*100)return {tag:'money-units',message:'Check dollars and cents. The answer box is in dollars; 100 cents makes $1.'};
 if(/frac/.test(q.skill)||q.skill.includes('equivalent'))return {tag:'fraction-check',message:'Check what counts as one whole, and whether the pieces are equal. Try a bar model.'};
 if(/area|dimension|composite/.test(q.skill))return {tag:'measure-choice',message:'Are you finding the space inside, the distance around, or a missing side? Label what the question asks for.'};
 if(/time/.test(q.skill))return {tag:'time-units',message:'Try a timeline. Remember that the minutes roll over at 60, not 100.'};
 if(/bars|tables$|linegraphs|piecharts/.test(q.skill)&&q.topic==='Data')return {tag:'read-data',message:'Read the labels and scale first. Then decide whether to read, add or compare amounts.'};
 return {tag:'check-method',message:'Check what you need to find. You can draw a model, check each step, or open the lesson.'};
}
const api={transfer,hasTransfer:(id,tier=1)=>!!forms[id]||(tier>=2&&!!applications[id]),registerApplication:(id,make)=>{applications[id]=make;},transferSkills:Object.keys(forms),form,feedback};
if(typeof module==='object'&&module.exports)module.exports=api;else root.HanaCoach=api;
})(typeof window==='undefined'?globalThis:window);
