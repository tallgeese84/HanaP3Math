/* Singapore MOE 2021 primary syllabus, October 2025 revision, pp. 35–40.
 * Each skill has an explicit year. Difficulty never changes the year.
 * Original questions; construction tasks require a grown-up's review. */
(function(root){
'use strict';
const skills = [];
function skill(id, year, topic, name, make, prerequisite=null, manual=false){skills.push({id,year,topic,name,make,prerequisite,manual});}
const blank='<span class="blank" id="blank">?</span>';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gcd=(a,b)=>b?gcd(b,a%b):a;
const f=(n,d)=>{const g=gcd(n,d);return `${n/g}/${d/g}`;};
const fract=(n,d)=>`<span class="frx"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
const money=n=>'$'+(n/100).toFixed(2);
const svg=(body,w=360,h=180)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Question diagram" style="max-width:100%;width:${w}px">${body}</svg>`;
const txt=(x,y,t,extra='')=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#352644" ${extra.includes('font-size')?'':'font-size="15"'} ${extra}>${esc(t)}</text>`;
const line=(x,y,a,b,extra='')=>`<line x1="${x}" y1="${y}" x2="${a}" y2="${b}" stroke="#7850aa" stroke-width="3" ${extra}/>`;
const rect=(w,h,labels=true)=>{const width=w===h?110:230,x=(360-width)/2;return svg(`<rect x="${x}" y="30" width="${width}" height="110" rx="2" fill="#eee6f9" stroke="#7850aa" stroke-width="2"/>${labels?txt(180,22,w+' cm')+txt(x+width+30,90,h+' cm'):''}${txt(180,170,'Diagram not to scale')}`);};
const bar=(values,labels)=>svg(values.map((v,i)=>`<rect x="60" y="${20+i*48}" width="${v}" height="30" fill="${i?'#d7c0f3':'#b3decb'}" stroke="#7850aa"/>${txt(28,42+i*48,labels[i])}`).join(''),360,125);
function num(prompt,ans,help,vis='',unit=''){return {qtext:prompt,ans,kind:'key',help,vis,unit,eq:blank+(unit?' '+unit:''),fact:`${ans}${unit?' '+unit:''}. ${help}`,phrase:prompt};}
function choice(prompt,ans,options,help,vis=''){return {qtext:prompt,ans,kind:'choice',choices:[...new Set(options)].map(v=>({v,t:esc(v)})),help,vis,fact:`${ans}. ${help}`,phrase:prompt};}
function fracAnswer(prompt,n,d,help){const a=f(n,d),options=[a,...[1,2,-1,3].map(k=>f(Math.max(0,n+k),d))];return choice(prompt,a,options,help);}
function context(random){return {int:(a,b)=>a+Math.floor(random()*(b-a+1)),pick:a=>a[Math.floor(random()*a.length)],random};}
const numberWords=n=>{
 const one=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
 const ten=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
 if(n<20)return one[n];if(n<100)return ten[Math.floor(n/10)]+(n%10?'-'+one[n%10]:'');
 if(n<1000)return one[Math.floor(n/100)]+' hundred'+(n%100?' and '+numberWords(n%100):'');
 return numberWords(Math.floor(n/1000))+' thousand'+(n%1000?(n%1000<100?' and ':' ')+numberWords(n%1000):'');
};
function placeQuestion(c,year,t){
 const max=year===3?10000:100000,n=c.int(t===1?100:1000,t===1?(year===3?999:9999):max),p=c.int(0,String(n).length-1),place=10**p;
 if(t===3){const digit=Math.floor(n/place)%10,replacement=c.int(p===String(n).length-1?1:0,9),ans=n+(replacement-digit)*place;
  if(ans<=max)return num(`In ${n}, replace the digit in the ${['ones','tens','hundreds','thousands','ten thousands','hundred thousands'][p]} place with ${replacement}. What is the new number?`,ans,'Change only the named place. Keep every other digit in its place.');}

 if(c.random()<.33)return num(`Write in numerals: ${numberWords(n)}.`,n,'Write one digit in each place. Use zero for an empty place.');
 return num(`In ${n}, what is the value of the digit in the ${['ones','tens','hundreds','thousands','ten thousands','hundred thousands'][p]} place?`,Math.floor(n/place)%10*place,'Multiply the digit by its place value.');
}
for(const year of [3,4]){
 const p='p'+year;
 skill(p+'-place',year,'Numbers',year===3?'Numbers to 10 000':'Numbers to 100 000',(c,t)=>placeQuestion(c,year,t),year===4?'p3-place':null);
 skill(p+'-patterns',year,'Numbers','Compare & find patterns',(c,t)=>{
  const max=year===3?10000:100000,step=c.pick(t===1?[10]:t===2?[100,1000]:[25,50,200,500]),a=c.int(1,max-4*step);
  if(t===3)return num(`Complete: ${a+3*step}, __, ${a+step}, ${a}.`,a+2*step,'Find the constant decrease. Use the two final numbers to work out the step.');
  if(c.random()<.5)return num(`Complete: ${a}, ${a+step}, ${a+2*step}, __.`,a+3*step,'Find the same change between neighbouring numbers.');
  const ns=[a,a+step,a+2*step,a+3*step];return choice('Which number is greatest?',Math.max(...ns),ns,'Compare the digits from the largest place first.');
 },year===4?'p3-patterns':null);
}
skill('p3-addsub',3,'Operations','Add & subtract',(c,t)=>{
 const a=c.int(t===1?20:t===2?100:1000,[0,99,999,9999][t]),b=c.int(10,[0,99,999,9999][t]),add=c.random()<.5;
 const x=Math.max(a,b),y=Math.min(a,b),ans=add?x+y:x-y;
 if(ans>10000)return num(`${x} − ${y} = ?`,x-y,'Align the places. Regroup when there are not enough ones, tens or hundreds.');
 return num(`${x} ${add?'+':'−'} ${y} = ?`,ans,'Align the places. Work from ones towards thousands and regroup when needed.');
});
skill('p3-tables',3,'Operations','Times tables 6–9',(c,t)=>{const a=c.int(6,9),b=c.int(2,t===1?5:10);if(t===3)return num(`? × ${a} = ${a*b}. Find the missing number.`,b,`Use the inverse fact: ${a*b} ÷ ${a}.`);return (t===1||c.random()<.5)?num(`${a} × ${b} = ?`,a*b,`Use a known fact such as 5 × ${b}, then add the extra groups.`):num(`${a*b} ÷ ${a} = ?`,b,`Which number multiplied by ${a} makes ${a*b}?`);});
function operation(c,year,t,divide=false){
 const b=c.int(2,t===1?5:9),max=year===3?[0,99,499,999][t]:[0,999,4999,9999][t];
 if(divide){const a=c.int(2,Math.floor(max/b));return num(`${a*b} ÷ ${b} = ?`,a,'Share the largest place first; regroup any remainder into the next place.');}
 const a=c.int(t===1?12:100,max);return num(`${a} × ${b} = ?`,a*b,`Split ${a} into place values, multiply each by ${b}, then combine.`);
}
skill('p3-muldiv',3,'Operations','Multiply & divide up to 3 digits',(c,t)=>operation(c,3,t,c.random()<.5),'p3-tables');
for(const year of [3,4]) skill(`p${year}-remainder`,year,'Operations','Division with remainders',(c,t)=>{
 const b=c.int(2,t===1?5:9),a=c.int(12,year===3?[0,49,199,999][t]:[0,99,999,9999][t]),r=a%b,quo=Math.floor(a/b),ans=`${quo} R ${r}`;
 return choice(`${a} ÷ ${b}: give quotient R remainder.`,ans,[ans,`${quo+1} R ${r}`,`${quo} R ${r+1}`,`${quo-1} R ${r}`],`Find full groups of ${b}. The remainder must be less than ${b}.`);
},year===4?'p3-remainder':'p3-tables');
skill('p3-equivalent',3,'Fractions','Equivalent & simplest fractions',(c,t)=>{
 const d=c.pick(t===1?[2,3]:t===2?[2,3,4]:[2,3,4,6]),n=c.int(1,d-1),k=c.int(2,Math.floor(12/d));
 if(t<3)return num(`${n}/${d} = ?/${d*k}. Find the missing numerator.`,n*k,'Multiply numerator and denominator by the same number.');
 return fracAnswer(`Write ${n*k}/${d*k} in its simplest form.`,n,d,'Divide the numerator and denominator by their greatest common factor.');
});
skill('p3-fraccompare',3,'Fractions','Compare unlike fractions',(c,t)=>{
 const d=c.int(2,t===3?12:6),e=t===1?d:t===2?d*c.int(1,Math.floor(12/d)):c.int(2,12),n=c.int(1,d-1),m=c.int(1,e-1),a=n*e,b=m*d;
 return choice(`Compare ${n}/${d} and ${m}/${e}.`,a>b?'>':a<b?'<':'=',['<','=','>'],'Use equal-sized wholes. Rewrite with a shared denominator to compare.');
},'p3-equivalent');
function fracCalc(c,year,t){
 let d,e,n,m,add;
 // P3 related denominators and total within one whole; P4 at most two denominators, each ≤12.
 for(let i=0;i<100;i++){
 d=c.pick(t===1?[2,3,4]:t===2?[2,3,4,6]:year===3?[4,6]:[5,6,8,10,12]);e=t===1?d:year===3?d*c.int(t===3?2:1,Math.floor(12/d)):c.int(2,t===2?6:12);n=c.int(1,d-1);m=c.int(1,e-1);add=c.random()<.5;
 if(!add||year===4||n*e+m*d<=d*e)break;
 }
 if(!add&&n*e<m*d){[n,m]=[m,n];[d,e]=[e,d];}
 if(year===3&&add&&n*e+m*d>d*e){add=false;if(n*e<m*d){[n,m]=[m,n];[d,e]=[e,d];}}
 const N=add?n*e+m*d:n*e-m*d;
 return fracAnswer(`${n}/${d} ${add?'+':'−'} ${m}/${e} = ?`,N,d*e,'Use a shared denominator, combine the numerators, then simplify.');
}
skill('p3-fracops',3,'Fractions','Add & subtract related fractions',(c,t)=>fracCalc(c,3,t),'p3-equivalent');
skill('p3-money',3,'Everyday maths','Money & change',(c,t)=>{
 const a=t===1?c.int(15,50)*10:c.int(150,2000),b=t===1?c.int(5,15)*10:c.int(50,Math.min(a,1000)),add=c.random()<.5;
 if(t===3){const paid=Math.ceil((a+b)/1000)*1000,q=num(`A book costs ${money(a)} and a pen costs ${money(b)}. Hana pays ${money(paid)}. What is her change?`,paid-a-b,'Add both prices first. Subtract the total from the payment.');q.money=true;q.eq='$'+blank;q.fact=`${money(q.ans)}. ${q.help}`;return q;}
 const q=num(add?`Hana buys a notebook for ${money(a)} and pens for ${money(b)}. What is the total cost?`:`Hana pays ${money(a)} for a snack costing ${money(b)}. How much change does she get?`,add?a+b:a-b,'Keep the dollars and cents aligned. One dollar is 100 cents.');q.money=true;q.eq='$'+blank;q.fact=`${money(q.ans)}. ${q.help}`;return q;
});
skill('p3-measure',3,'Everyday maths','Length, mass & capacity',(c,t)=>{
 const [a,b,k]=c.pick([['km','m',1000],['m','cm',100],['kg','g',1000],['ℓ','ml',1000]]),w=c.int(1,8),r=c.int(1,k-1);
 if(t===1)return num(`Convert ${w} ${a} to ${b}.`,w*k,`1 ${a} = ${k} ${b}. Multiply by ${k}.`,'',b);
 if(t===2)return num(`Convert ${w} ${a} ${r} ${b} to ${b}.`,w*k+r,`1 ${a} = ${k} ${b}. Convert the larger units, then add.`, '',b);
 const ans=`${w} ${a} ${r} ${b}`;return choice(`Write ${w*k+r} ${b} in compound units.`,ans,[ans,`${w} ${a} ${r+1} ${b}`,`${w+1} ${a} ${r} ${b}`,`${w-1} ${a} ${r} ${b}`],`Make groups of ${k}; keep the remaining ${b}.`);
});
const clock=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}${String(n%60).padStart(2,'0')}`;
skill('p3-time',3,'Everyday maths','Time, seconds & 24-hour clock',(c,t)=>{
 const type=t===1?c.int(0,1):t===2?2:c.int(3,4),start=c.int(420,1000),dur=c.int(15,120);
 if(type===0){const h=c.int(1,11),pm=c.random()<.5,m=c.int(0,59),ans=clock((h+(pm?12:0))*60+m);return choice(`Write ${h}:${String(m).padStart(2,'0')} ${pm?'pm':'am'} in 24-hour time.`,ans,[ans,clock((h+(pm?0:12))*60+m),clock((h+(pm?12:0))*60+(m+5)%60)],'In the afternoon add 12 to the hour. Keep the minutes unchanged.');}
 if(type===1){const m=c.int(1,5),s=c.int(1,59);return num(`How many seconds are in ${m} min ${s} s?`,m*60+s,'Each minute contains 60 seconds.','','s');}
 if(type===2)return num(`An activity starts at ${clock(start)} and ends at ${clock(start+dur)}. How many minutes does it last?`,dur,'Count to the next hour, then count the remaining minutes.','','min');
 const end=type===3,ans=clock(end?start+dur:start);
 return choice(end?`A bus leaves at ${clock(start)}. The trip takes ${dur} minutes. When does it arrive?`:`A lesson ends at ${clock(start+dur)} and lasts ${dur} minutes. When did it start?`,ans,[ans,clock((end?start+dur:start)+60),clock((end?start+dur:start)-10),clock((end?start+dur:start)+10)],end?'Add the minutes, exchanging 60 minutes for one hour.':'Count backwards by the duration.');
});
skill('p3-area',3,'Geometry','Area & perimeter',(c,t)=>{
 const w=c.int(3,t===1?6:12),h=c.int(2,t===1?5:10),area=c.random()<.5;
 if(t===3){const W=c.int(6,12),H=c.int(5,10),a=c.int(2,W-2),b=c.int(2,H-2);
  const vis=svg(`<path d="M65 30H290V90H195V145H65Z" fill="#eee6f9" stroke="#7850aa" stroke-width="2"/>${txt(180,22,W+' cm')}${txt(325,66,(H-b)+' cm')}${txt(248,116,a+' cm')}${txt(227,150,b+' cm')}${txt(124,165,(W-a)+' cm')}${txt(26,89,H+' cm')}`,360,185);
  return num('Find the perimeter of this rectilinear figure.',2*(W+H),'Add all six outside lengths. A perimeter is measured in length units.',vis,'cm');
 }
 return num(`Find the ${area?'area':'perimeter'} of the rectangle.`,area?w*h:2*(w+h),area?'Count square units: length × breadth.':'Add the four outside lengths.',rect(w,h),area?'cm²':'cm');
});
function angleDrawing(deg,scale=false){
 const a=deg*Math.PI/180,ox=180,oy=154,R=125;
 let s='';if(scale)for(let d=0;d<=180;d+=10){const x=ox+R*Math.cos(d*Math.PI/180),y=oy-R*Math.sin(d*Math.PI/180);s+=line(ox+(R-5)*Math.cos(d*Math.PI/180),oy-(R-5)*Math.sin(d*Math.PI/180),x,y,'stroke-width="1"')+txt(ox+(R+16)*Math.cos(d*Math.PI/180),oy-(R+16)*Math.sin(d*Math.PI/180)+4,d,'font-size="11"');}
 s+=line(ox,oy,ox+100,oy)+line(ox,oy,ox+100*Math.cos(a),oy-100*Math.sin(a));
 if(scale)s+=txt(ox-8,oy+20,'B')+txt(295,oy+10,'C')+txt(ox+113*Math.cos(a),oy-113*Math.sin(a),'A');
 return svg(s,360,190);
}
skill('p3-angles',3,'Geometry','Compare with a right angle',(c,t)=>{
 const deg=c.pick(t===1?[30,90,150]:t===2?[60,90,120]:[80,90,100]),ans=deg===90?'A right angle':deg<90?'Smaller than a right angle':'Greater than a right angle';
 return choice(t===3?'Look carefully: compare this angle with a square corner.':'Compare this angle with a square corner.',ans,['Smaller than a right angle','A right angle','Greater than a right angle'],'Imagine fitting the corner of a sheet of paper into the angle.',angleDrawing(deg));
});
skill('p3-lines',3,'Geometry','Parallel & perpendicular lines',(c,t)=>{
 const k=c.int(0,2),ans=['Parallel','Perpendicular','Neither'][k],s=k===0?line(65,60,295,60)+line(65,120,295,120):k===1?line(180,20,180,160)+line(65,90,295,90):line(65,140,290,25)+line(65,60,295,110);
 if(t===3){const [a,b,answer]=c.pick([['A','C','Parallel'],['B','D','Parallel'],['A','B','Perpendicular'],['C','D','Perpendicular']]),v=svg(`<g transform="rotate(${c.pick([-20,20])} 180 90)">${line(95,45,265,45)+line(95,135,265,135)+line(95,45,95,135)+line(265,45,265,135)+txt(180,35,'A')+txt(286,95,'B')+txt(180,157,'C')+txt(76,95,'D')}</g>`);return choice(`In this rectangle, how are sides ${a} and ${b} related?`,answer,['Parallel','Perpendicular','Neither'],'Opposite sides are parallel. Neighbouring sides meet at right angles, even when the rectangle is tilted.',v);}
 return choice('How are the two lines related?',ans,['Parallel','Perpendicular','Neither'],'Parallel lines stay equally far apart. Perpendicular lines meet at a right angle.',svg(t===2?`<g transform="rotate(25 180 90)">${s}</g>`:s));
});
function graph(c,kind,t){
 const names=kind==='bar'?['Hana','Mei','Arif','Ben']:['Mon','Tue','Wed','Thu'],step=c.pick(t===1?[2]:[2,5,10]),v=names.map(()=>c.int(1,8)*step),top=8*step,x0=55,y0=170;
 let s='';for(let k=0;k<=8;k++){const y=y0-k*18;s+=line(x0,y,335,y,'stroke="#e2dae9" stroke-width="1"')+txt(30,y+5,k*step);}
 const pts=v.map((n,i)=>[90+i*65,y0-n/top*144]);
 if(kind==='bar')pts.forEach(([x,y])=>s+=`<rect x="${x-17}" y="${y}" width="34" height="${y0-y}" fill="#bcb0de"/>`);
 else{s+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#7850aa" stroke-width="3"/>`;pts.forEach(([x,y])=>s+=`<circle cx="${x}" cy="${y}" r="4" fill="#7850aa"/>`);}
 names.forEach((n,i)=>s+=txt(90+i*65,193,n));s+=txt(190,17,'Books borrowed');
 const i=c.int(0,3),j=(i+1)%4;
 if(t===3)return num(`How many books were borrowed in total ${kind==='bar'?'by':'on'} ${names.slice(0,3).join(', ')}?`,v[0]+v[1]+v[2],'Read each of the three values, then add them.',svg(s,360,215),'books');
 return t===1?num(`How many books ${kind==='bar'?'did '+names[i]+' borrow':'were borrowed on '+names[i]}?`,v[i],`Each interval on the vertical scale represents ${step} books.`,svg(s,360,215),'books'):num(`What is the difference between ${names[i]} and ${names[j]}?`,Math.abs(v[i]-v[j]),'Read both values from the scale, then subtract the smaller from the larger.',svg(s,360,215),'books');
}
skill('p3-bars',3,'Data','Read scaled bar graphs',(c,t)=>graph(c,'bar',t));
skill('p3-story',3,'Problem solving','Two-step word problems',(c,t)=>{
 const boxes=c.int(3,t===1?4:9),each=c.int(t===1?2:6,t===3?20:9),away=c.int(2,each*2);
 return num(`Hana has ${boxes} packs of stickers. Each pack has ${each} stickers. She gives ${away} stickers to Euna. How many stickers are left?`,boxes*each-away,'First find all the stickers in the packs. Then subtract the stickers given away.','', 'stickers');
},'p3-muldiv');
skill('p4-round',4,'Numbers','Round whole numbers',(c,t)=>{const n=c.int(t===1?100:1000,t===1?999:99999),unit=c.pick(t===1?[10]:t===2?[100]:[1000]);return num(`Round ${n} to the nearest ${unit}.`,Math.round(n/unit)*unit,'Look at the next digit: 5 or more rounds up. Use ≈ for an approximate value.');},'p3-place');
skill('p4-factors',4,'Numbers','Factors & common multiples',(c,t)=>{
 const a=c.int(2,t===1?5:9),b=c.int(2,9);
 if(t===1)return choice(`Which number is a factor of ${a*b}?`,a,[a,...[2,3,4,5,6,7,8,9,10,11].filter(v=>(a*b)%v).slice(0,3)],'A factor divides the number exactly.');
 if(t===2){const x=a*c.int(2,10),y=a*c.int(2,10),correct=a,wrong=Array.from({length:9},(_,i)=>i+1).filter(v=>x%v||y%v);return choice(`Which is a common factor of ${x} and ${y}?`,correct,[correct,...wrong.slice(0,3)],'A common factor divides each number exactly.');}
 const ans=a*b/gcd(a,b);return num(`What is the smallest positive common multiple of ${a} and ${b}?`,ans,'List the positive multiples of both numbers and find the first shared value.');
},'p3-tables');
skill('p4-multiply',4,'Operations','Multiply larger numbers',(c,t)=>{
 if(t<3)return operation(c,4,t,false);
 const a=c.int(100,999),b=c.int(10,99);return num(`${a} × ${b} = ?`,a*b,`Multiply ${a} by the tens and by the ones of ${b}; add the partial products.`);
},'p3-muldiv');
skill('p4-divide',4,'Operations','Divide up to 4 digits',(c,t)=>operation(c,4,t,true),'p3-muldiv');
skill('p4-mixed',4,'Fractions','Mixed & improper fractions',(c,t)=>{
 const d=c.int(2,t===3?12:5),n=c.int(1,d-1),w=c.int(1,t===1?2:5),ans=`${w} ${f(n,d)}`;
 if(t===1)return num(`Write ${w} ${n}/${d} as ?/${d}. What is the numerator?`,w*d+n,'Multiply the whole number by the denominator, then add the numerator.');
 return choice(`Write ${w*d+n}/${d} as a mixed number in simplest form.`,ans,[ans,`${w+1} ${f(n,d)}`,`${w-1} ${f(n,d)}`],'Divide the numerator by the denominator. The remainder is the fractional part.');
},'p3-equivalent');
skill('p4-fracset',4,'Fractions','Fractions of a set',(c,t)=>{
 const d=c.int(2,t===1?5:12),n=t===1?1:c.int(1,d-1),k=c.int(2,12);
 if(t===3)return num(`${n*k} blue beads make up ${n}/${d} of all the beads. How many beads are there altogether?`,d*k,`First divide ${n*k} by ${n} to find one group. Multiply that group by ${d}.`,'','beads');
 return num(`There are ${d*k} beads. ${n}/${d} of them are blue. How many beads are blue?`,n*k,`Share the whole set into ${d} equal groups, then take ${n} groups.`,'','beads');
},'p3-muldiv');
skill('p4-fracops',4,'Fractions','Add & subtract unlike fractions',(c,t)=>fracCalc(c,4,t),'p3-fracops');
skill('p4-decimalplace',4,'Decimals','Decimal places & rounding',(c,t)=>{
 const n=c.int(1001,9999),s=(n/1000).toFixed(3),kind=t===1?0:t===2?2:1,place=c.pick(t===1?[1,2]:[1,2,3]);
 if(kind===0){const q=num(`What digit is in the ${['','tenths','hundredths','thousandths'][place]} place of ${s}?`,Number(s.split('.')[1][place-1]),'Read decimal places from the decimal point to the right.');return q;}
 if(kind===1){const dp=c.int(0,2),q=num(`Round ${s} to ${dp===0?'the nearest whole number':dp+' decimal '+(dp===1?'place':'places')}.`,Math.round(n/10**(3-dp))/10**dp,'Look one place to the right of the required place.');q.dec=true;return q;}
 const other=(n+c.int(1,99))/1000;return choice(`Which is greater: ${s} or ${other.toFixed(3)}?`,other.toFixed(3),[s,other.toFixed(3)],'Compare whole numbers first, then tenths, hundredths and thousandths.');
},'p3-place');
skill('p4-decimalfraction',4,'Decimals','Fractions ↔ decimals',(c,t)=>{
 const d=c.pick(t===1?[10,100]:t===2?[2,4,5]:[20,25,50,100]),n=c.int(1,d-1);
 if(t<3){const q=num(`Write ${n}/${d} as a decimal.`,n/d,'Make an equivalent fraction with denominator 10 or 100.');q.dec=true;return q;}
 return fracAnswer(`Write ${(n/d).toFixed(2)} as a fraction in simplest form.`,n,d,'Write the hundredths as a fraction, then simplify.');
},'p3-equivalent');
skill('p4-decimalops',4,'Decimals','Calculate with decimals',(c,t)=>{
 const a=t===1?c.int(10,99)*10:c.int(100,999),b=t===1?c.int(1,9)*10:c.int(10,99),op=t===3?c.int(2,3):c.int(0,1),k=c.int(2,9);let q;
 if(op===0||op===1)q=num(`${(a/100).toFixed(2)} ${op===0?'+':'−'} ${(b/100).toFixed(2)} = ?`,(op===0?a+b:a-b)/100,'Align decimal points and calculate in hundredths.');
 if(op===2)q=num(`${(a/100).toFixed(2)} × ${k} = ?`,a*k/100,'Multiply the hundredths, then put the decimal point back.');
 if(op===3)q=num(`${(a*k/100).toFixed(2)} ÷ ${k} = ?`,a/100,'Divide the hundredths into equal groups.');q.dec=true;return q;
},'p4-decimalplace');
skill('p4-decimalquotient',4,'Decimals','Division & rounded answers',(c,t)=>{
 const a=c.int(1,t===1?20:80),b=c.pick(t===1?[2,4,5]:t===2?[3,6,8]:[3,6,7,9]),dp=t===3?2:1,q=num(`${a} ÷ ${b} = ? Round your answer to ${dp} decimal ${dp===1?'place':'places'}.`,Math.round(a/b*10**dp)/10**dp,'Continue dividing into decimal places. Use the next digit to round.');q.dec=true;return q;
},'p4-divide');
skill('p4-dimension',4,'Geometry','Find missing lengths',(c,t)=>{
 const w=c.int(3,12),h=c.int(2,10),area=t===2;
 if(t===1)return num(`A square has ${area?'area '+w*w+' cm²':'perimeter '+4*w+' cm'}. How long is one side?`,w,area?'Find a whole number that multiplied by itself gives the area.':'A square has four equal sides. Divide the perimeter by four.','','cm');
 return num(`A rectangle has ${area?'area '+w*h+' cm²':'perimeter '+2*(w+h)+' cm'} and length ${w} cm. Find its breadth.`,h,area?'Divide the area by the known length.':'Halve the perimeter, then subtract the known length.','','cm');
},'p3-area');
skill('p4-composite',4,'Geometry','Composite area & perimeter',(c,t)=>{
 const W=c.int(7,t===1?9:14),H=c.int(6,t===1?7:10),a=c.int(2,W-3),b=c.int(2,H-3),area=t!==3;
 const s=svg(`<path d="M55 30 H295 V85 H200 V150 H55Z" fill="#eee6f9" stroke="#7850aa" stroke-width="2"/>${txt(175,22,W+' cm')}${txt(24,90,H+' cm')}${txt(252,109,a+' cm')}${txt(238,144,b+' cm')}${txt(180,178,'Diagram not to scale')}`,360,190);
 return num(t===1?`A large rectangle has area ${W*H} cm². Its missing corner has area ${a*b} cm². Find the remaining area.`:`Find the ${area?'area':'perimeter'} of this L-shaped garden.`,area?W*H-a*b:2*(W+H),area?'Subtract the missing corner from the large rectangle.':'Find the missing lengths; add every outside edge.',s,area?'cm²':'cm');
},'p3-area');
skill('p4-angles',4,'Geometry','Measure & name angles',(c,t)=>{
 const deg=10*c.int(t===1?3:2,t===1?9:16);if(t===3)return num('Use the scale to measure ∠ABC from the left-hand ray BC.',180-deg,'Start at 0 on the left. Subtract the indicated right-hand scale reading from 180.',angleDrawing(deg,true).replace('x2="280"','x2="80"').replace('x="295"','x="65"'),'°');return num('Use the scale to measure ∠ABC. Start at 0 on ray BC.',deg,'The middle letter B is the vertex. Read where ray BA meets the scale.',angleDrawing(deg,true),'°');
},'p3-angles');
skill('p4-properties',4,'Geometry','Rectangles & squares',(c,t)=>{
 const square=c.random()<.5;
 if(t===2){const side=c.int(3,12);return num(`A ${square?'square':'rectangle'} has one side ${side} cm long. How long is its opposite side?`,side,'Opposite sides are equal. Turning the shape does not change its properties.',rect(side,square?side:2,false),'cm');}
 if(t===3){const k=c.int(0,2);
  if(k===0)return choice('A four-sided shape has four right angles. Which statement must be true?','Both pairs of opposite sides are parallel',['Both pairs of opposite sides are parallel','All four sides are equal','Only one pair of sides is equal'],'Four right angles give a rectangle. Its opposite sides are parallel and equal; it need not be a square.');
  if(k===1)return choice('What extra fact would prove that a rectangle is a square?','Two neighbouring sides are equal',['Two neighbouring sides are equal','Its opposite sides are equal','It has four right angles'],'A rectangle already has equal opposite sides. Equal neighbouring sides make all four sides equal.');
  return choice('A square is turned so that one corner points upwards. Which statement is true?','It still has four right angles',['It still has four right angles','It is no longer a square','Its sides become different lengths'],'Turning a shape does not change its side lengths, angles or parallel sides.');
 }
 return choice(`Which statement is always true for a ${square?'square':'rectangle'}?`,square?'All four sides are equal':'Opposite sides are equal',square?['All four sides are equal','It has only one right angle','Opposite sides meet']:['Opposite sides are equal','All four sides must be equal','It has no parallel sides'],'Both shapes have four right angles and two pairs of parallel sides. A square also has four equal sides.',rect(square?6:8,6,false));
},'p3-lines');
skill('p4-symmetry',4,'Geometry','Lines of symmetry',(c,t)=>{
 if(t===2){const square=c.random()<.5,fold=c.pick(['a diagonal','a vertical line through the centre','a horizontal line through the centre']);return choice(`Is ${fold} a line of symmetry of a ${square?'square':'non-square rectangle'}?`,square||fold!=='a diagonal'?'Yes':'No',['Yes','No'],'The folded halves must match. A non-square rectangle has two symmetry lines through the side midpoints; a square also has its diagonals.',svg(`<rect x="${square?120:60}" y="25" width="${square?120:240}" height="120" fill="#eee6f9" stroke="#7850aa"/>`));}
 if(t===3){const n=c.int(2,5);return num(`A point is ${n} grid squares to the left of a vertical mirror line. How many squares apart are the point and its reflection?`,n*2,'The reflection is equally far on the other side. Add the two distances.','','squares');}
 const k=c.int(0,2),name=['square','non-square rectangle','isosceles triangle'][k],ans=[4,2,1][k];
 const s=k===2?svg('<path d="M180 25 L70 150 H290Z" fill="#eee6f9" stroke="#7850aa" stroke-width="2"/>'):svg(`<rect x="${k?60:120}" y="25" width="${k?240:120}" height="120" fill="#eee6f9" stroke="#7850aa" stroke-width="2"/>`);
 return num(`How many lines of symmetry does this ${name} have?`,ans,'Imagine folding: the two halves must match exactly.',s);
},'p3-lines');
skill('p4-nets',4,'Geometry','Nets & solids',(c,t)=>{
 if(t===1){
  const k=c.int(0,5),names=['cube','cuboid','cone','cylinder','triangular prism','square pyramid'];
  const drawing=[
   '<path d="M100 65H190V155H100Z M100 65L145 25H235V115L190 155 M190 65L235 25 M145 25V115L100 155 M145 115H235"/>',
   '<path d="M75 75H215V150H75Z M75 75L130 35H270V110L215 150 M215 75L270 35 M130 35V110L75 150 M130 110H270"/>',
   '<ellipse cx="180" cy="145" rx="70" ry="22"/><path d="M110 145L180 25L250 145"/>',
   '<ellipse cx="180" cy="40" rx="70" ry="22"/><ellipse cx="180" cy="145" rx="70" ry="22"/><path d="M110 40V145 M250 40V145"/>',
   '<path d="M65 150L110 65L155 150Z M155 150H285L240 65H110 M65 150H195L240 65 M195 150H285"/>',
   '<path d="M90 125L185 165L265 115L170 85Z M90 125L180 20L185 165 M180 20L265 115 M180 20L170 85"/>'
  ][k];
  return choice('Which solid is represented by this drawing?',names[k],names,'Use the shapes of the faces and whether surfaces are flat or curved.',svg(`<g fill="none" stroke="#7850aa" stroke-width="2.5">${drawing}</g>`));
 }
 if(t===3){const k=c.int(0,3),names=['cube','cuboid','square pyramid','triangular prism'],faces=[6,6,5,5],triangles=[0,0,4,2],tri=c.random()<.5;return num(`How many ${tri?'triangular faces':'faces in total'} does a ${names[k]} have?`,tri?triangles[k]:faces[k],'Imagine the net. Count every face, including those hidden in a drawing.');}
 const k=c.int(0,3),names=['cube','cuboid','square pyramid','triangular prism'];let s='';
 if(k<2){const ws=k===0?[36,36,36,36]:[60,30,60,30];let x=65;ws.forEach(w=>{s+=`<rect x="${x}" y="66" width="${w}" height="45"/>`;x+=w;});s+=k===0?'<rect x="101" y="30" width="36" height="36"/><rect x="101" y="111" width="36" height="36"/>':'<rect x="65" y="36" width="60" height="30"/><rect x="65" y="111" width="60" height="30"/>';if(k===0)s=s.replaceAll('height="45"','height="36"').replaceAll('y="111"','y="102"');}
 if(k===2)s='<rect x="155" y="65" width="50" height="50"/><path d="M155 65L180 22L205 65 M155 115L180 158L205 115 M155 65L112 90L155 115 M205 65L248 90L205 115"/>';
 if(k===3)s='<rect x="90" y="65" width="50" height="60"/><rect x="140" y="65" width="50" height="60"/><rect x="190" y="65" width="50" height="60"/><path d="M140 65L165 21.7L190 65 M140 125L165 168.3L190 125"/>';
 return choice('Which solid can be folded from this net?',names[k],names,'Match the shapes of the faces and how they join.',svg(`<g fill="#e8dcf6" stroke="#7850aa" stroke-width="2">${s}</g>`));
});
skill('p4-tables',4,'Data','Complete & interpret tables',(c,t)=>{
 const a=c.int(5,40),b=c.int(5,40),d=c.int(5,40),total=a+b+d;
 const vis=`<table class="data-table"><caption>Books borrowed</caption><thead><tr><th>Mon</th><th>Tue</th><th>Wed</th><th>Total</th></tr></thead><tbody><tr><td>${a}</td><td>${t===3?'?':b}</td><td>${d}</td><td>${total}</td></tr></tbody></table>`;
 if(t===1)return num('How many books were borrowed on Tuesday?',b,'Read the Tuesday column.',vis,'books');
 if(t===2)return num('How many books were borrowed on Monday and Tuesday altogether?',a+b,'Read the two days and add their values.',vis,'books');
 return num('How many books were borrowed on Tuesday?',b,'Subtract the two known days from the total.',vis,'books');
},'p3-bars');
skill('p4-linegraphs',4,'Data','Read line graphs',(c,t)=>graph(c,'line',t),'p3-bars');
skill('p4-piecharts',4,'Data','Read pie charts',(c,t)=>{
 const k=c.int(0,2),names=c.pick([['Reading','Drawing','Swimming'],['Drawing','Swimming','Reading'],['Swimming','Reading','Drawing']]),n=c.int(3,12),values=[2*n,n,n];
 const s=svg(`<path d="M115 95 L115 20 A75 75 0 0 1 115 170Z" fill="#bea4df"/><path d="M115 95 L115 170 A75 75 0 0 1 40 95Z" fill="#a7d7c0"/><path d="M115 95 L40 95 A75 75 0 0 1 115 20Z" fill="#f3cc84"/>${names.map((v,i)=>`<rect x="217" y="${42+i*38}" width="12" height="12" fill="${['#bea4df','#a7d7c0','#f3cc84'][i]}"/>${txt(285,53+i*38,v)}`).join('')}${txt(190,187,'Two equal quarters and one half')}`,380,202);
 if(t===1)return choice('Which activity was chosen by the most children?',names[0],names,'The largest sector represents the most children.',s);
 if(t===3)return num(`${n} children chose ${names[1].toLowerCase()}. How many children chose an activity altogether?`,4*n,`${names[1]} is one quarter. Multiply this part by four to find the whole.`,s,'children');
 return num(`${4*n} children chose one favourite activity each. How many chose ${names[k].toLowerCase()}?`,values[k],`${names[0]} takes half the circle. ${names[1]} and ${names[2]} each take one quarter.`,s,'children');
},'p4-fracset');
// Human-reviewed construction tasks use the working pad and never count as independent mastery.
function construction(prompt,check,vis=''){return {qtext:prompt,ans:'review',kind:'manual',manual:true,help:check,vis,phrase:prompt,fact:check,checklist:check};}
skill('p3-drawlines',3,'Drawing','Draw parallel & perpendicular lines',(c,t)=>construction(c.random()<.5?'Use a ruler and square corner to draw two perpendicular lines.':'Use a ruler to draw two parallel lines.','Ask a grown-up to check your drawing: parallel lines stay equally far apart; perpendicular lines meet at a square corner.'), 'p3-lines',true);
skill('p4-construct',4,'Drawing','Draw angles, shapes & solids',(c,t)=>{
 const k=c.int(0,3),angle=10*c.int(2,16),w=c.int(3,8),h=c.int(2,w);
 if(k===3)return construction('Draw a 2D representation of a cube, cuboid, triangular prism or square pyramid.','Ask a grown-up to check the faces and joined edges. Show hidden edges with dotted lines.');
 return construction(k===0?`On paper, use a protractor to draw an angle of ${angle}°.`:k===1?`On paper, draw a rectangle ${w} cm long and ${h} cm wide.`:`On paper, draw a square with sides of ${w} cm.`,'Ask a grown-up to check with a ruler or protractor. Screen size is not a reliable centimetre scale.');
},'p4-angles',true);
skill('p4-drawsymmetry',4,'Drawing','Complete a reflected shape',(c,t)=>{
 let s='';for(let x=30;x<=330;x+=30)s+=line(x,20,x,170,'stroke="#ddd3e8" stroke-width="1"');for(let y=20;y<=170;y+=30)s+=line(30,y,330,y,'stroke="#ddd3e8" stroke-width="1"');s+=line(180,15,180,175,'stroke-dasharray="5 5"')+'<path d="M150 50 L90 50 L90 110 L120 140 L150 110Z" fill="#d7c0f3" stroke="#7850aa" stroke-width="2"/>';
 return construction('Copy the grid on paper. Complete the shape on the other side of the dotted mirror line.','Each reflected corner should be the same number of squares from the mirror line, on the other side.',svg(s));
},'p4-symmetry',true);
function generate(id,tier=1,random=Math.random){
 const skill=skills.find(s=>s.id===id);if(!skill)throw new Error('Unknown skill '+id);
 const q=skill.make(context(random),Math.max(1,Math.min(3,tier)));
 q.skill=id;q.year=skill.year;q.topic=skill.topic;q.title=skill.name;q.tier=tier;
 // Fisher–Yates; correct responses must not always occupy the first position.
 if(q.choices)for(let i=q.choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[q.choices[i],q.choices[j]]=[q.choices[j],q.choices[i]];}
 q.signature=id+'|'+q.qtext+'|'+q.ans;return q;
}
const api={skills,generate,esc};
if(typeof module==='object'&&module.exports)module.exports=api;else root.HanaCurriculum=api;
})(typeof window==='undefined'?globalThis:window);
