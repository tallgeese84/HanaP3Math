/* Original, parameterised P3/P4 practice informed by the supplied 2025 papers.
 * Register after problems.js. Existing skills/year boundaries remain intact.
 * Level 1 preserves foundations; levels 2/3 mix reasoning with fluent practice.
 * No school question text, scans, learner data or network dependency lives here. */
(function(root){
'use strict';
const node=typeof module==='object'&&module.exports;
const C=node?require('./curriculum.js'):root.HanaCurriculum;
if(node)require('./problems.js');
const K=node?require('./coach.js'):root.HanaCoach;
const REV='h19',families=[],blank='<span class="blank" id="blank">?</span>';
const cash=n=>'$'+(n/100).toFixed(2),dec=n=>(n/100).toFixed(2);
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+String(n%60).padStart(2,'0');
const ctx=r=>({random:r,int:(a,b)=>a+Math.floor(r()*(b-a+1)),pick:a=>a[Math.floor(r()*a.length)]});
const fraction=(n,d)=>C.mixedText(n,d);
const title=(x,y,s)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="14" fill="#352644">${C.esc(s)}</text>`;
const svg=(body,label,h=200)=>`<svg viewBox="0 0 400 ${h}" role="img" aria-label="${C.esc(label)}" style="width:400px;max-width:100%"><title>${C.esc(label)}</title>${body}</svg>`;
function q(text,ans,help,steps,data,extra={}){
 const s={qtext:text,phrase:text,kind:'key',ans,help,steps,data,vis:'',unit:'',...extra};
 s.eq=(s.money?'$':'')+blank+(s.unit?' '+C.esc(s.unit):'');
 s.fact=(s.money?cash(ans):String(ans)+(s.unit?' '+s.unit:''))+'. '+steps.join(' ');
 return s;
}
function fq(text,N,D,help,steps,data){
 const g=C.gcd(N,D);N/=g;D/=g;const ans=fraction(N,D);
 return {...q(text,ans,help,steps,data),kind:'parts',layout:N>D?'mixed':'fraction',expect:{N,D,form:N>D?'mixed':'simplest'},ansText:ans};
}
function add(id,skills,make,tiers=[2,3]){families.push({id,skills:skills.split(' '),make,tiers});}
const slip=(value,tag,message)=>({value,tag,message});

add('regrouped-place','p3-place p4-place',(c,t,id)=>{
 const thousands=c.int(1,id==='p3-place'?7:85),hundreds=c.int(11,19),ones=c.int(1,9),total=thousands*1000+hundreds*100+ones;
 return q(t===2?`What number is made from ${thousands} thousands, ${hundreds} hundreds and ${ones} ones?`:`A number is ${total}. It is made from ${thousands} thousands, some hundreds and ${ones} ones. How many hundreds are there?`,t===2?total:hundreds,
  'A place can contain more than nine groups. Regroup ten hundreds as one thousand.',
  [`${thousands} thousands = ${thousands*1000}; ${hundreds} hundreds = ${hundreds*100}.`,`${thousands*1000} + ${hundreds*100} + ${ones} = ${total}.`,...(t===3?[`(${total} − ${thousands*1000} − ${ones}) ÷ 100 = ${hundreds}.`]:[])],{thousands,hundreds,ones,total,t});
});
add('digit-constraints','p3-place p4-place',(c,t,id)=>{
 const digits=[c.pick([2,4,6,8]),c.pick([1,3,5,7,9]),0];
 while(digits.length<(id==='p3-place'?4:5)){const d=c.int(1,9);if(!digits.includes(d))digits.push(d);}
 const even=t===3,small=t===2,perms=[];
 function perm(a,b=[]){if(!a.length){if(b[0]&&(!even||b.at(-1)%2===0))perms.push(Number(b.join('')));return;}a.forEach((d,i)=>perm(a.filter((_,j)=>j!==i),[...b,d]));}perm(digits);
 const ans=small?Math.min(...perms):Math.max(...perms);
 return q(`Use each digit ${digits.join(', ')} exactly once. What is the ${small?'smallest possible number':'greatest possible even number'}?`,ans,
  even?'An even number ends in 0, 2, 4, 6 or 8. Keep the largest possible digits at the front.':'The first digit cannot be zero. Put the smallest non-zero digit first, then order the rest.',
  [`${ans} uses every digit exactly once and has no leading zero.`,even?'Compare possible even last digits, starting with the largest possible first digit.':'The smallest non-zero digit goes first; zero can come next.'],{digits,even,small});
});
add('missing-calculation','p3-addsub',(c,t)=>{
 const a=c.int(600,2800),b=c.int(300,2000),x=c.int(500,3000),total=a+x;
 return q(t===2?`${a} + □ = ${total}. What is the missing number?`:`□ − ${a} = ${b} + ${x}. What is the missing number?`,t===2?x:a+b+x,
  'Make both sides equal. Undo the operation involving the box.',
  t===2?[`${total} − ${a} = ${x}.`,`Check: ${a} + ${x} = ${total}.`]:[`${b} + ${x} = ${b+x}.`,`Put back ${a}: ${b+x} + ${a} = ${a+b+x}.`],{a,b,x,total,t});
});
add('reverse-remainder','p3-remainder p4-remainder',(c,t,id)=>{
 const divisor=c.int(3,9),quotient=c.int(12,id==='p3-remainder'?90:900),r=c.int(1,divisor-1),N=divisor*quotient+r;
 return q(t===2?`A number divided by ${divisor} gives ${quotient} remainder ${r}. What is the number?`:`${N} counters are put into groups of ${divisor}. What is the smallest number of extra counters needed so that none are left over?`,t===2?N:divisor-r,
  t===2?'Rebuild the dividend from the complete groups and the leftover.':'Find the remainder. The question asks how many more complete the next group.',
  [`${N} = ${quotient} × ${divisor} + ${r}.`,...(t===3?[`Add ${divisor} − ${r} = ${divisor-r} counters.`]:[])],{divisor,quotient,r,N,t},
  {misconceptions:[slip(t===2?divisor*quotient:r,'remainder-meaning',t===2?'Include the leftover as well as the complete groups.':'That is the leftover. How many more would complete a group?') ]});
});
add('equal-packs','p3-muldiv p4-divide p4-multiply p3-wpgroups',(c,t,id)=>{
 const per=c.int(12,id.startsWith('p3')?60:180),a=c.int(3,8),b=c.int(2,9),spare=c.int(2,11),total=a*per+spare;
 return q(t===2?`${total} pencils fill ${a} identical boxes with ${spare} pencils left over. How many pencils are in each full box?`:`${a} identical packets contain ${a*per} cards altogether. How many cards are in ${b} such packets?`,t===2?per:b*per,
  'First find the amount in one equal group. Use only the items that are actually packed.',
  t===2?[`Packed: ${total} − ${spare} = ${a*per}.`,`Each box: ${a*per} ÷ ${a} = ${per}.`]:[`One packet: ${a*per} ÷ ${a} = ${per}.`,`${b} packets: ${per} × ${b} = ${b*per}.`],{per,a,b,spare,total,t},
  {unit:t===2?'pencils':'cards'});
});
add('missing-fraction','p3-fracops p4-fracops',(c,t,id)=>{
 const D=c.pick(id==='p3-fracops'?[4,8,9]:[6,8,10,12]),a=c.int(1,D-3),b=c.int(1,D-a-1),total=a+b;
 return fq(t===2?`${fraction(a,D)} + □ = ${fraction(total,D)}. Find the missing fraction in simplest form.`:`A ribbon was 1 m long. Mei cut off ${fraction(a,D)} m, then another piece. There was ${fraction(b,D)} m left. How long was the second piece? Give a fraction in simplest form.`,t===2?b:D-a-b,D,
  'Write all the lengths with a shared denominator. Account for every part of the whole.',
  t===2?[`${fraction(total,D)} − ${fraction(a,D)} = ${fraction(b,D)}.`]:[`Both cuts: 1 − ${fraction(b,D)} = ${fraction(D-b,D)} m.`,`Second cut: ${fraction(D-b,D)} − ${fraction(a,D)} = ${fraction(D-b-a,D)} m.`],{D,a,b,total,t});
});
add('comparison-chain','p3-wpcompare p3-wppartwhole p3-story',(c,t)=>{
 const first=c.int(250,900),gap=c.int(50,first-80),third=c.int(200,850),second=first-gap,total=second+third;
 return q(t===2?`A school has ${first} boys. It has ${gap} fewer girls than boys. How many children are there altogether?`:`A stall sold ${first} buns on Monday. It sold ${gap} fewer on Tuesday. It sold ${total} buns in total on Tuesday and Wednesday. How many buns did it sell on Wednesday?`,t===2?first+second:third,
  'Work out the smaller quantity first. Then check which quantities belong to the given total.',
  [`${first} − ${gap} = ${second}.`,t===2?`Altogether: ${first} + ${second} = ${first+second}.`:`Wednesday: ${total} − ${second} = ${third}.`],{first,gap,total,t},
  {unit:t===2?'children':'buns',misconceptions:[slip(t===2?2*first+gap:total-first,'comparison-direction','“Fewer” describes the smaller amount. Work out that amount before using the total.')]});
});
add('shopping-change','p3-money p3-wpmoney',(c,t)=>{
 const price=c.int(75,340),count=c.int(2,6),other=c.int(425,1300),total=count*price+other,paid=Math.ceil((total+100)/1000)*1000,change=paid-total;
 return q(t===2?`A notebook costs ${cash(other)} and each pen costs ${cash(price)}. Hana buys one notebook and ${count} pens, paying ${cash(paid)}. How much change does she get?`:`Hana pays ${cash(paid)} for one notebook and ${count} identical pens. She receives ${cash(change)} change. The notebook costs ${cash(other)}. How much does each pen cost?`,t===2?change:price,
  t===2?'Find the cost of all the pens before adding the notebook.':'Find the amount spent, remove the notebook cost, then share the pen cost equally.',
  t===2?[`Pens: ${count} × ${cash(price)} = ${cash(count*price)}.`,`Total: ${cash(count*price)} + ${cash(other)} = ${cash(total)}.`,`Change: ${cash(paid)} − ${cash(total)} = ${cash(change)}.`]:[`Spent: ${cash(paid)} − ${cash(change)} = ${cash(total)}.`,`Pens: ${cash(total)} − ${cash(other)} = ${cash(count*price)}.`,`Each: ${cash(count*price)} ÷ ${count} = ${cash(price)}.`],{price,count,other,paid,change,t},
  {money:true,misconceptions:[slip(t===2?paid-price-other:count*price,'equal-item-cost','Check how many identical pens were bought. The cost of one pen and all the pens are different quantities.')]});
});
add('measure-repacking','p3-measure p3-wpmoney',(c,t)=>{
 const [big,small,k,object]=c.pick([['kg','g',1000,'rice'],['ℓ','ml',1000,'juice'],['m','cm',100,'ribbon']]);
 const count=c.int(3,8),each=c.int(k===100?12:120,k===100?80:600),left=c.int(1,k-1),total=count*each+left,w=Math.floor(total/k),r=total%k;
 return q(t===2?`There are ${w} ${big} ${r} ${small} of ${object}. ${count} equal portions of ${each} ${small} are used. How much is left, in ${small}?`:`There are ${w} ${big} ${r} ${small} of ${object}. After making ${count} equal portions, ${left} ${small} is left. How much is in each portion, in ${small}?`,t===2?left:each,
  `Convert to ${small} first. ${k} ${small} = 1 ${big}.`,
  [`${w} ${big} ${r} ${small} = ${total} ${small}.`,t===2?`Used: ${count} × ${each} = ${count*each} ${small}.`:`Used: ${total} − ${left} = ${count*each} ${small}.`,t===2?`Left: ${total} − ${count*each} = ${left} ${small}.`:`Each portion: ${count*each} ÷ ${count} = ${each} ${small}.`],{k,w,r,count,each,left,t},{unit:small});
});
add('time-with-break','p3-time',(c,t)=>{
 const start=c.int(8*60,15*60),first=c.int(35,85),pause=c.int(10,25),second=c.int(25,70),end=start+first+pause+second;
 if(t===2)return q(`A workshop starts at ${clock(start)} and finishes at ${clock(end)}. There is a ${pause}-minute break. How many minutes are spent on activities?`,first+second,
  'Find the elapsed time, then remove the break. Minutes regroup at 60.',[`Elapsed: ${end-start} min.`,`Activity time: ${end-start} − ${pause} = ${first+second} min.`],{start,end,pause,t},{unit:'min',misconceptions:[slip(end-start,'exclude-break','Elapsed time includes the break. The question asks only for activity time.')]});
 const text=`A club session has a ${first}-minute activity, a ${pause}-minute break and a ${second}-minute activity. It ends at ${clock(end)}. When did it start? Give 24-hour time.`;
 return {...q(text,clock(start),'Add the durations, including the break. Count backwards from the finishing time.',[`Total: ${first} + ${pause} + ${second} = ${end-start} min.`,`Count back ${end-start} min from ${clock(end)} to ${clock(start)}.`],{end,first,pause,second,t}),kind:'parts',layout:'clock',expect:{h:Math.floor(start/60),m:start%60},ansText:clock(start)};
});
add('rectangle-context','p3-area',(c,t)=>{
 const L=c.int(12,28),W=c.int(5,11),gate=c.int(2,4),l=c.int(7,11),w=c.int(2,4);
 return q(t===2?`A rectangular garden is ${L} m long and ${W} m wide. A ${gate} m gap is left for a gate. How many metres of fencing are needed?`:`A rectangular mat is ${L} cm long and ${W} cm wide. Another mat is ${l} cm long and ${w} cm wide. How much greater is the area of the first mat?`,t===2?2*(L+W)-gate:L*W-l*w,
  t===2?'Fencing goes around the edge. Leave out the gate.':'Find each area before comparing them.',
  t===2?[`Perimeter: 2 × (${L} + ${W}) = ${2*(L+W)} m.`,`Fence: ${2*(L+W)} − ${gate} = ${2*(L+W)-gate} m.`]:[`Areas: ${L} × ${W} = ${L*W} cm²; ${l} × ${w} = ${l*w} cm².`,`Difference: ${L*W} − ${l*w} = ${L*W-l*w} cm².`],{L,W,gate,l,w,t},{unit:t===2?'m':'cm²'});
});
add('graph-reasoning','p3-bars p4-linegraphs',(c,t,id)=>{
 const scale=c.pick([5,10,20]),v=Array.from({length:4},()=>c.int(2,9)*scale),labels=['Mon','Tue','Wed','Thu'],target=v.reduce((a,b)=>a+b,0)+c.int(1,6)*scale;
 let body=title(205,17,'Library visitors');for(let i=0;i<=10;i++){const y=185-i*15;body+=`<path d="M48 ${y}H350" stroke="#ded5e9"/>`+title(25,y+5,i*scale);}
 const pts=v.map((n,i)=>[85+75*i,185-n/scale*15]);
 if(id==='p3-bars')pts.forEach(([x,y])=>body+=`<rect x="${x-17}" y="${y}" width="34" height="${185-y}" fill="#ad93cf"/>`);
 else body+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#7850aa" stroke-width="3"/>`+pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#7850aa"/>`).join('');
 labels.forEach((s,i)=>body+=title(85+75*i,207,s));
 return q(t===2?'How many visitors came on Monday and Wednesday altogether?':`The library wants a total of ${target} visitors from Monday to Friday. How many visitors are needed on Friday?`,t===2?v[0]+v[2]:target-v.reduce((a,b)=>a+b,0),
  'Read the scale carefully. Use the days named in the question.',t===2?[`Monday ${v[0]}, Wednesday ${v[2]}.`,`Total: ${v[0]} + ${v[2]} = ${v[0]+v[2]}.`]:[`Monday to Thursday: ${v.join(' + ')} = ${v.reduce((a,b)=>a+b,0)}.`,`Still needed: ${target} − ${v.reduce((a,b)=>a+b,0)} = ${target-v.reduce((a,b)=>a+b,0)}.`],{v,target,scale,t},{unit:'visitors',vis:svg(body,'Library visitors by day; vertical scale in visitors',225),essentialVisual:true});
});
add('rounding-boundary','p4-round',(c,t)=>{
 const unit=c.pick([10,100,1000]),rounded=c.int(5,85)*unit,small=t===2,ans=small?rounded-unit/2:rounded+unit/2-1;
 return q(`A whole number rounds to ${rounded} to the nearest ${unit}. What is the ${small?'smallest':'greatest'} possible whole number?`,ans,
  'Find the halfway boundaries. The lower halfway value rounds up; the upper halfway value rounds to the next multiple.',
  [`Numbers from ${rounded-unit/2} to ${rounded+unit/2-1} round to ${rounded}.`,`The ${small?'smallest':'greatest'} is ${ans}.`],{unit,rounded,small});
});
add('common-multiple-context','p4-factors',(c,t)=>{
 const [a,b]=c.pick([[4,6],[6,8],[3,5],[4,10],[6,9],[8,12]]),m=a*b/C.gcd(a,b),k=c.int(2,6),low=(k-1)*m+1,high=(k+1)*m-1;
 return q(t===2?`Every ${a}th visitor receives a badge and every ${b}th visitor receives a bookmark. Which visitor is the first to receive both? Enter the visitor number.`:`Some counters can be shared equally into groups of ${a} or groups of ${b}, with none left over. There are more than ${low} and fewer than ${high} counters. How many counters are there?`,t===2?m:k*m,
  'List common multiples. Then apply all the conditions in the question.',[`The first common multiple of ${a} and ${b} is ${m}.`,...(t===3?[`Only ${k*m} is a multiple of ${m} between ${low} and ${high}.`]:[])],{a,b,low,high,t});
});
add('fraction-reverse-set','p4-fracset p4-wpfraction',(c,t)=>{
 const d=c.pick([5,7,9,11]),n=c.int(1,Math.floor(d/2)),unit=c.int(6,32),whole=d*unit,known=(t===2?d-n:d-2*n)*unit;
 return q(t===2?`${fraction(n,d)} of the beads are blue and the rest are red. There are ${known} red beads. How many beads are there altogether?`:`${fraction(n,d)} of the beads are blue and the rest are red. There are ${known} more red beads than blue beads. How many beads are there altogether?`,whole,
  t===2?'The known amount is the fraction left, not the fraction that is blue.':'Draw equal parts for red and blue. The given amount is their difference.',
  [`Red: ${d-n} of ${d} parts.`,`${t===2?d-n:d-2*n} parts = ${known}, so one part = ${unit}.`,`All ${d} parts = ${d} × ${unit} = ${whole}.`],{d,n,known,t},{unit:'beads',misconceptions:[slip(known*d,'fraction-unit','The given amount represents several equal parts. Find one part before finding the whole.')]});
});
add('fraction-servings','p4-wpfraction p4-mixed',(c,t)=>{
 const d=c.int(3,8),people=c.int(2,5)*d+c.int(1,d-1),pizzas=Math.ceil(people/d),left=pizzas*d-people;
 if(t===2)return q(`Each child needs 1/${d} of a pizza. There are ${people} children. Only whole pizzas can be bought. What is the least number of pizzas needed?`,pizzas,
  'One pizza serves a whole group. Any children left over still need pizza.',[`${people} ÷ ${d} = ${Math.floor(people/d)} R ${people%d}.`,`One more pizza is needed: ${pizzas}.`],{d,people,pizzas,t},{unit:'pizzas',misconceptions:[slip(Math.floor(people/d),'remainder-meaning','That many pizzas will leave some children without their full serving.')]});
 return fq(`${pizzas} whole pizzas are cut into ${d} equal slices each. ${people} children each take one slice. How much pizza is left? Give a fraction in simplest form.`,left,d,
  'Count slices first. Then express the leftover as part of one pizza.',[`Slices at first: ${pizzas} × ${d} = ${pizzas*d}.`,`Left: ${pizzas*d} − ${people} = ${left} slices, or ${fraction(left,d)} of a pizza.`],{d,people,pizzas,t});
});
add('two-fractions-whole','p4-wpfraction',(c)=>{
 const d=c.pick([6,8,10,12]),a=c.int(1,2),b=c.int(2,d-a-1),unit=c.int(10,35),left=(d-a-b)*unit,ans=b*unit;
 return q(`A class collection contains storybooks, comics and magazines. ${fraction(a,d)} are storybooks and ${fraction(b,d)} are comics. The remaining ${left} items are magazines. How many comics are there?`,ans,
  'Both fractions refer to the same whole collection. Find the remaining fraction, then one equal part.',
  [`Magazines: ${d} − ${a} − ${b} = ${d-a-b} of ${d} equal parts.`,`One part: ${left} ÷ ${d-a-b} = ${unit}.`,`Comics: ${b} × ${unit} = ${ans}.`],{d,a,b,left},{unit:'comics'});
},[3]);
add('decimal-boundary','p4-decimalplace',(c,t)=>{
 const rounded=c.int(20,750)*10,small=c.random()<.5,source=rounded+c.int(-5,4),ans=t===2?rounded/100:(small?rounded-5:rounded+4)/100;
 return q(t===2?`Round ${dec(source)} to 1 decimal place.`:`A number has exactly two decimal places. It rounds to ${(rounded/100).toFixed(1)} to 1 decimal place. What is the ${small?'smallest':'greatest'} possible number?`,ans,
  'Work in hundredths. The halfway value rounds up, not down.',t===2?[`The nearest tenth is ${(rounded/100).toFixed(1)}.`]:[`The possible hundredths run from ${dec(rounded-5)} to ${dec(rounded+4)}.`,`Choose ${dec(Math.round(ans*100))}.`],{rounded,source,small,t},{dec:true});
});
add('decimal-repacking','p4-decimalops p4-wpdecimal',(c,t)=>{
 const per=c.int(35,480),bags=c.int(3,9),needed=c.int(2,9),total=per*bags;
 return q(t===2?`${dec(total)} kg of flour is shared equally among ${bags} bags. What is the mass of flour in each bag?`:`${bags} identical bags of flour have a total mass of ${dec(total)} kg. What is the total mass of ${needed} such bags?`,t===2?per/100:per*needed/100,
  'Find the mass of one bag before finding the mass of several bags.',[`One bag: ${dec(total)} ÷ ${bags} = ${dec(per)} kg.`,...(t===3?[`${needed} bags: ${dec(per)} × ${needed} = ${dec(per*needed)} kg.`]:[])],{total,bags,needed,t},{dec:true,unit:'kg'});
});
add('decimal-compute-round','p4-decimalops',(c,t)=>{
 const a=c.int(180,2500),b=c.int(115,1700),scale=t===2?10:100,sum=a+b,rounded=Math.floor((sum+scale/2)/scale)*scale;
 return q(`A parcel has two items with masses ${dec(a)} kg and ${dec(b)} kg. Find their total mass, rounded to ${t===2?'1 decimal place':'the nearest whole kilogram'}.`,rounded/100,
  'Calculate the exact total first. Round only the final answer.',[`Total: ${dec(a)} + ${dec(b)} = ${dec(sum)} kg.`,`Rounded total: ${rounded/100} kg.`],{a,b,scale},{dec:true,unit:'kg'});
});
add('decimal-total-difference','p4-wpdecimal',(c)=>{
 const short=c.int(125,850),long=short+c.int(90,700),total=short+long;
 return q(`Two ropes have a total length of ${dec(total)} m. The longer rope is ${dec(long)} m long. How much longer is it than the shorter rope?`,(long-short)/100,
  'The total is not the shorter length. Find that length before comparing.',[`Shorter rope: ${dec(total)} − ${dec(long)} = ${dec(short)} m.`,`Difference: ${dec(long)} − ${dec(short)} = ${dec(long-short)} m.`],{total,long},{dec:true,unit:'m',misconceptions:[slip(short/100,'intermediate-answer','That is the shorter rope. The question asks for the difference between the ropes.')]});
},[3]);
add('equal-bundle-difference','p4-wpdecimal',(c)=>{
 const base=c.int(425,1850),small=c.int(40,160),n=c.int(2,4),extra=c.int(2,5),buy=c.int(2,5),bill1=base+n*small,bill2=base+(n+extra)*small;
 return q(`One lunch box and ${n} identical drinks cost ${cash(bill1)}. One identical lunch box and ${n+extra} of the same drinks cost ${cash(bill2)}. How much do ${buy} lunch boxes cost?`,base*buy,
  'The lunch box cost is the same in both bills. Subtract the bills to isolate the extra drinks.',
  [`${extra} extra drinks: ${cash(bill2)} − ${cash(bill1)} = ${cash(extra*small)}.`,`One drink: ${cash(extra*small)} ÷ ${extra} = ${cash(small)}.`,`One lunch box: ${cash(bill1)} − ${n} × ${cash(small)} = ${cash(base)}.`,`${buy} lunch boxes: ${cash(base)} × ${buy} = ${cash(base*buy)}.`],{bill1,bill2,n,extra,buy},{money:true});
},[3]);
add('decimal-change-units','p4-wpdecimal',(c)=>{
 const unit=c.int(15,120),k=c.int(2,5),gap=c.int(65,250),used=gap+(k-1)*unit,first=used+unit;
 return q(`Container A had ${dec(gap)} ℓ more juice than container B. After ${dec(used)} ℓ was poured out of A, B held ${k} times as much juice as A had left. How much juice was in A at first?`,first/100,
  'B stays unchanged. The amount poured out removes the original difference and then creates a new difference.',
  [`New difference: ${dec(used)} − ${dec(gap)} = ${dec((k-1)*unit)} ℓ.`,`${k-1} equal parts = ${dec((k-1)*unit)} ℓ, so A has ${dec(unit)} ℓ left.`,`At first: ${dec(unit)} + ${dec(used)} = ${dec(first)} ℓ.`],{gap,used,k},{dec:true,unit:'ℓ'});
},[3]);
add('same-start-change','p4-wpbeforeafter',(c,t)=>{
 const unit=c.int(20,180),k=c.int(2,5),spent=(k-1)*unit,first=k*unit,gift=c.int(10,75);
 return q(t===2?`Mei and Ravi had the same amount of money. Mei spent $${spent}. Ravi then had ${k} times as much money as Mei had left. How much did Mei have at first?`:`After Mei gives Ravi ${gift} cards, Ravi has ${k} times as many cards as Mei. They have ${(k+1)*unit} cards altogether. How many cards did Mei have at first?`,t===2?first*100:unit+gift,
  'Draw the final amounts as equal units. Then undo the change to find the starting amount.',
  t===2?[`The difference is ${k-1} units = $${spent}.`,`One unit = $${unit}.`,`Mei at first: $${unit} + $${spent} = $${first}.`]:[`The total stays ${(k+1)*unit}. Final total: ${k+1} units.`,`Mei has ${(k+1)*unit} ÷ ${k+1} = ${unit} cards left.`,`Before giving: ${unit} + ${gift} = ${unit+gift}.`],{k,spent,total:(k+1)*unit,gift,t},{money:t===2,unit:t===3?'cards':''});
});
add('two-excesses','p4-wpgroups',(c,t)=>{
 const people=c.int(12,45),a=c.int(2,4),b=a+c.int(2,4),small=c.int(2,18),large=(b-a)*people+small,total=b*people+small;
 return q(`If a teacher gives each pupil ${a} stickers, ${large} stickers are left. If each pupil gets ${b} stickers, ${small} are left. How many ${t===2?'pupils are there':'stickers does the teacher have'}?`,t===2?people:total,
  'Both amounts are leftovers. Subtract the leftovers to find the cost of giving each pupil more.',
  [`Extra used: ${large} − ${small} = ${large-small}.`,`Pupils: ${large-small} ÷ (${b} − ${a}) = ${people}.`,...(t===3?[`Stickers: ${people} × ${b} + ${small} = ${total}.`]:[])],{a,b,small,large,t},{unit:t===2?'pupils':'stickers',misconceptions:[slip((large+small)/(b-a),'two-leftovers','Both amounts are left over. Compare their difference; addition is for an excess paired with a shortage.')]});
});
add('joined-rectangles','p4-composite p4-wparea',(c,t)=>{
 const W=c.int(8,15),H=c.int(7,12),a=c.int(3,7),b=c.int(2,H-2),area=W*H+a*b,perimeter=2*(W+H)+2*a;
 const body=`<path d="M60 35H230V95H330V165H60Z" fill="#ece2f7" stroke="#7850aa" stroke-width="2"/><path d="M230 95V165" stroke="#7850aa" stroke-dasharray="4 4"/>${title(145,26,W+' cm')}${title(28,105,H+' cm')}${title(280,87,a+' cm')}${title(360,135,b+' cm')}${title(200,192,'Diagram not to scale')}`;
 return q(`Two rectangles are joined as shown with no overlap. The large rectangle is ${W} cm by ${H} cm and the small one is ${a} cm by ${b} cm. They share the full ${b} cm side. Find the ${t===2?'total area':'outside perimeter'}.`,t===2?area:perimeter,
  t===2?'The rectangles do not overlap, so add their areas.':'The shared side is inside the shape. Do not count it as an outside edge.',
  t===2?[`${W} × ${H} = ${W*H} cm².`,`${a} × ${b} = ${a*b} cm².`,`Total = ${area} cm².`]:[`Separate perimeters: ${2*(W+H)} + ${2*(a+b)} = ${2*(W+H+a+b)} cm.`,`Remove the shared side twice: ${2*(W+H+a+b)} − 2 × ${b} = ${perimeter} cm.`],{W,H,a,b,t},{unit:t===2?'cm²':'cm',vis:svg(body,'Two rectangles joined along one side'),essentialVisual:true,misconceptions:[slip(2*(W+H+a+b),'shared-boundary','Adding both perimeters counts the shared inside edge twice. Only trace the outside boundary.')]});
});
add('dimension-chain','p4-dimension p4-wparea',(c,t)=>{
 const L=c.int(12,24),W=c.int(5,11),perimeter=2*(L+W),increase=c.int(1,W-2),newL=L+increase,newW=W-increase;
 return q(t===2?`A rectangular card has perimeter ${perimeter} cm and length ${L} cm. Find its area.`:`A rectangle is ${L} cm long and ${W} cm wide. A second rectangle has the same perimeter, but its length is ${increase} cm greater. Find the area of the second rectangle.`,t===2?L*W:newL*newW,
  'Half the perimeter is length plus breadth. Find the missing breadth before calculating area.',
  t===2?[`Length + breadth: ${perimeter} ÷ 2 = ${L+W} cm.`,`Breadth: ${L+W} − ${L} = ${W} cm.`,`Area: ${L} × ${W} = ${L*W} cm².`]:[`Length + breadth stays ${L+W} cm.`,`New length ${newL} cm; new breadth ${L+W} − ${newL} = ${newW} cm.`,`New area: ${newL} × ${newW} = ${newL*newW} cm².`],{L,W,perimeter,increase,t},{unit:'cm²'});
});
add('rectangle-angle','p4-angles p4-properties',(c,t)=>{
 const a=c.int(2,7)*10,b=t===3?c.int(1,89-a):0,ans=90-a-b;
 const labels=t===2?[`${a}°`,'?']:[`${a}°`,`${b}°`,'?'];
 const rays=t===2?[a]:[a,a+b];let body='<path d="M90 30V170H330" fill="none" stroke="#7850aa" stroke-width="3"/><path d="M90 153H107V170" fill="none" stroke="#7850aa"/>';
 for(const d of rays){const rad=d*Math.PI/180;body+=`<path d="M90 170L${90+130*Math.sin(rad)} ${170-130*Math.cos(rad)}" stroke="#7850aa" stroke-width="2"/>`;}
 body+=title(235,25,'Parts: '+labels.join(' + '))+title(230,194,'Diagram not to scale');
 return q(`A corner of a rectangle is split into ${t===2?'two':'three'} non-overlapping angles. ${t===2?`One angle is ${a}°`:`Two angles are ${a}° and ${b}°`}. Find the remaining angle.`,ans,
  'A rectangle corner is a right angle. All the parts of that corner total 90°.',[t===2?`90° − ${a}° = ${ans}°.`:`90° − (${a}° + ${b}°) = ${ans}°.`],{a,b},{unit:'°',vis:svg(body,'A right-angle corner divided into smaller angles'),essentialVisual:true});
});
add('two-way-table','p4-tables',(c,t)=>{
 const a=c.int(15,40),b=c.int(12,35),d=c.int(12,30),e=c.int(10,25),row=a+b,other=d+e,total=row+other;
 const vis=`<table class="data-table"><caption>Club members</caption><thead><tr><th>Club</th><th>Boys</th><th>Girls</th><th>Total</th></tr></thead><tbody><tr><th>Art</th><td>${a}</td><td>?</td><td>${row}</td></tr><tr><th>Drama</th><td>${d}</td><td>${t===2?e:'?'}</td><td>${t===2?other:'?'}</td></tr><tr><th>Total</th><td>${a+d}</td><td>?</td><td>${total}</td></tr></tbody></table>`;
 return q(t===2?'How many girls are in the Art club?':'How many girls are in the Drama club?',t===2?b:e,
  'Use row and column totals. A question mark is an unknown, not zero.',t===2?[`Art girls: ${row} − ${a} = ${b}.`]:[`Drama total: ${total} − ${row} = ${other}.`,`Drama girls: ${other} − ${d} = ${e}.`],{a,d,row,total,t},{unit:'girls',vis,essentialVisual:true});
});

function finish(f,c,t,id){
 const s=C.skills.find(s=>s.id===id),out=f.make(c,t,id);
 Object.assign(out,{skill:id,year:s.year,topic:s.topic,title:s.name,tier:t,family:f.id,bankRevision:REV,form:id+':'+f.id,wordProblem:!!s.wordProblem});
 out.signature=id+'|'+out.qtext+'|'+out.ans;return out;
}
function available(id,t){return families.filter(f=>f.skills.includes(id)&&f.tiers.includes(t));}
function generate(id,t,random=Math.random,family=null){const pool=available(id,t).filter(f=>!family||f.id===family);return pool.length?finish(pool[Math.floor(random()*pool.length)],ctx(random),t,id):null;}
for(const skill of C.skills){
 if(!families.some(f=>f.skills.includes(skill.id)))continue;
 const base=skill.make;
 skill.make=(c,t)=>{const pool=available(skill.id,t);return pool.length&&c.random()<.75?finish(c.pick(pool),c,t,skill.id):base(c,t);};
 K?.registerApplication?.(skill.id,(random,t)=>generate(skill.id,t,random));
}
const api={revision:REV,families:families.map(({id,skills,tiers})=>({id,skills,tiers})),generate,available:(id,t)=>available(id,t).map(f=>f.id)};
if(node)module.exports=api;else root.HanaExamStyle=api;
})(typeof window==='undefined'?globalThis:window);
