/* Original Singapore-style word problems (P3/P4) with bar models.
 * Every family keeps its numbers in `data` so tests can recompute answers
 * independently. Tier 1 shows a labelled model, tier 2 shows the model's
 * shape without the answer route, tier 3 asks Hana to draw her own model.
 * Questions are written for this app; no examination items are copied. */
(function(root){
'use strict';
const C=typeof module==='object'&&module.exports?require('./curriculum.js'):root.HanaCurriculum;
const T=typeof module==='object'&&module.exports?require('./lessons.js'):root.HanaLessons;
const esc=C.esc,blank='<span class="blank" id="blank">?</span>';
const fmt=n=>{const s=String(n);return s.length>=5?s.slice(0,-3)+' '+s.slice(-3):s;};
const cash=c=>'$'+(c/100).toFixed(2),dollars=d=>'$'+fmt(d);
const names=[['Mei','Ravi'],['Siti','Ben'],['Wei Ling','Ahmad'],['Priya','Jun'],['Aisha','Ken'],['Hana','Euna'],['Farah','Daniel'],['Li Ting','Arun']];
const things=['stickers','marbles','stamps','beads','cards','shells','erasers','buttons'];
const ctx=random=>({int:(a,b)=>a+Math.floor(random()*(b-a+1)),pick:a=>a[Math.floor(random()*a.length)],random});

/* ---------- bar models ---------- */
const INK='#352644',LINE='#7850aa',FILL='#e8dcf6',KNOWN='#b6d9c8';
const t=(x,y,s,anchor='middle',size=14,weight='normal')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${INK}">${esc(s)}</text>`;
function bars(rows,opt={}){
 const left=96,avail=240,rowH=48,barH=28,y0=opt.top?46:16;
 const sum=r=>r.segs.reduce((s,g)=>s+g.v,0),max=Math.max(...rows.map(sum));
 const scale=avail/max;let body='';const ends=[];
 rows.forEach((r,i)=>{
  const y=y0+i*rowH;let x=left;
  body+=t(left-10,y+19,r.name,'end',14,'bold');
  // Labelled pieces get room for their text; the rest of the row shrinks to fit.
  const need=r.segs.map(g=>Math.max(16,g.text?String(g.text).length*7.6+12:16)),raw=r.segs.map(g=>g.v*scale);
  let widths=raw.map((w,i)=>Math.max(w,need[i]));const over=widths.reduce((a,b)=>a+b,0)-raw.reduce((a,b)=>a+b,0);
  if(over>0){const flex=widths.map((w,i)=>w>need[i]?w-need[i]:0),room=flex.reduce((a,b)=>a+b,0);if(room>0)widths=widths.map((w,i)=>w-flex[i]*Math.min(1,over/room));}
  for(const [gi,g] of r.segs.entries()){
   const w=widths[gi];
   body+=`<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${barH}" fill="${g.fill||(g.unknown?'#fff':FILL)}" stroke="${LINE}" stroke-width="2" ${g.dash||g.unknown?'stroke-dasharray="5 4"':''}/>`;
   if(g.text)body+=t(x+w/2,y+19,g.text,'middle',13);
   x+=w;
  }
  ends.push(x);
  if(r.end)body+=t(x+8,y+19,r.end,'start',14,'bold');
 });
 if(opt.top){const r=opt.top.row||0,x2=ends[r],y=y0-8,m=(left+x2)/2;body+=`<path d="M${left} ${y} q0 -8 8 -8 H${m-6} l6 -6 l6 6 H${x2-8} q8 0 8 8" fill="none" stroke="${LINE}" stroke-width="2"/>`+t(m,y-20,opt.top.text,'middle',14,'bold');}
 if(opt.brace){const bx=Math.max(...ends)+10,y1=y0,y2=y0+(rows.length-1)*rowH+barH,m=(y1+y2)/2;body+=`<path d="M${bx} ${y1} q8 0 8 8 V${m-6} l6 6 l-6 6 V${y2-8} q0 8 -8 8" fill="none" stroke="${LINE}" stroke-width="2"/>`+t(bx+20,m+5,opt.brace,'start',14,'bold');}
 const h=y0+rows.length*rowH+(opt.caption?22:4);
 if(opt.caption)body+=t(210,h-8,opt.caption,'middle',13);
 return `<svg class="bar-model" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 ${h}" role="img" aria-label="${esc(opt.label||'Bar model')}" style="max-width:100%;width:430px"><title>${esc(opt.label||'Bar model')}</title>${body}</svg>`;
}
const units=(k,text='',extra=[])=>[...Array.from({length:k},()=>({v:1,text})),...extra];
const drawOwn='<p class="draw-own">Draw your own bar model in ✎ Think before you calculate.</p>';
// Tier 1: labelled model. Tier 2: same shape with "?" only where the question asks. Tier 3: no model.
function model(tier,full,shape){return tier===1?full():tier===2?shape():drawOwn;}

function q(o){
 const unit=o.unit||'';
 const out={qtext:o.qtext,ans:o.ans,kind:'key',help:o.help,vis:o.vis||'',unit,eq:(o.money?'$':'')+blank+(unit&&!o.money?' '+unit:''),phrase:o.qtext,data:o.data,steps:o.steps,wordProblem:true};
 if(o.money)out.money=true;if(o.dec)out.dec=true;
 const shown=o.money?cash(o.ans):o.dec?String(o.ans):fmt(o.ans)+(unit?' '+unit:'');
 out.fact=`${shown}. ${o.steps.join(' ')}`;
 return out;
}

/* ---------- P3 families ---------- */
function p3partwhole(c,tier){
 const [A,B]=c.pick(names);
 if(tier===1){
  const total=c.int(400,999),am=c.int(100,Math.floor(total/3)),pm=c.int(50,Math.floor(total/3)),ans=total-am-pm,item=c.pick(['apples','buns','oranges','muffins']);
  return q({qtext:`A stall had ${total} ${item}. It sold ${am} ${item} in the morning and ${pm} ${item} in the afternoon. How many ${item} were left?`,ans,unit:item,data:{type:'left',total,parts:[am,pm]},
   help:'Draw one bar for all the '+item+'. Cut off the two parts that were sold. The part left is the unknown.',
   steps:[`Sold altogether: ${am} + ${pm} = ${am+pm}.`,`Left: ${total} − ${am+pm} = ${ans}.`],
   vis:model(1,()=>bars([{name:'All',segs:[{v:am,text:String(am)},{v:pm,text:String(pm)},{v:ans,unknown:true,text:'?'}]}],{top:{text:String(total)},label:'One bar cut into sold and left parts'}),null)});
 }
 if(tier===2){
  const a=c.int(1200,3500),b=c.int(1000,3000),x=c.int(800,2500),total=a+b+x;
  return q({qtext:`A library has ${fmt(total)} books in three sections. The story section has ${fmt(a)} books and the science section has ${fmt(b)} books. How many books are in the history section?`,ans:x,unit:'books',data:{type:'missing',total,parts:[a,b]},
   help:'The three sections make the whole. Add the two known parts, then subtract from the whole.',
   steps:[`Story and science: ${a} + ${b} = ${a+b}.`,`History: ${total} − ${a+b} = ${x}.`],
   vis:bars([{name:'Books',segs:[{v:a,text:'story'},{v:b,text:'science'},{v:x,unknown:true,text:'?'}]}],{top:{text:fmt(total)},label:'Whole bar with two known parts and one unknown part'})});
 }
 const a=c.int(800,2000),d=c.int(150,600),x=c.int(500,2500),total=a+(a+d)+x,item=c.pick(things);
 return q({qtext:`${A}, ${B} and Kumar have ${fmt(total)} ${item} altogether. ${A} has ${fmt(a)} ${item}. ${B} has ${d} more ${item} than ${A}. How many ${item} does Kumar have?`,ans:x,unit:item,data:{type:'three',total,a,d},
  help:`First find how many ${B} has. Then take both children's ${item} away from the total.`,
  steps:[`${B}: ${a} + ${d} = ${a+d}.`,`${A} and ${B}: ${a} + ${a+d} = ${2*a+d}.`,`Kumar: ${total} − ${2*a+d} = ${x}.`],
  vis:drawOwn});
}
function p3compare(c,tier){
 const [A,B]=c.pick(names),item=c.pick(things);
 if(tier===1){
  const x=c.int(120,800),d=c.int(30,300),ans=2*x+d;
  return q({qtext:`${A} has ${x} ${item}. ${B} has ${d} more ${item} than ${A}. How many ${item} do they have altogether?`,ans,unit:item,data:{type:'more-total',x,d},
   help:`Draw ${B}'s bar longer than ${A}'s by ${d}. Find ${B}'s amount first, then add both bars.`,
   steps:[`${B}: ${x} + ${d} = ${x+d}.`,`Altogether: ${x} + ${x+d} = ${ans}.`],
   vis:bars([{name:A,segs:[{v:x,text:String(x)}]},{name:B,segs:[{v:x,text:String(x)},{v:d,text:String(d),fill:KNOWN}]}],{brace:'?',label:`${B}'s bar is ${d} longer than ${A}'s`})});
 }
 if(tier===2){
  const x=c.int(1000,4000),d=c.int(120,900),fewer=c.random()<.5,other=fewer?x+d:x-d,ans=x+other;
  return q({qtext:`${A} saved ${fmt(x)} ${item}. This is ${d} ${fewer?'fewer':'more'} than ${B}. How many ${item} did they save altogether?`,ans,unit:item,data:{type:'relational',x,d,fewer},
   help:`Read carefully: who has more? “${d} ${fewer?'fewer':'more'} than ${B}” describes ${A}. So ${B} has ${fewer?'more':'fewer'}.`,
   steps:[`${B}: ${x} ${fewer?'+':'−'} ${d} = ${other}.`,`Altogether: ${x} + ${other} = ${ans}.`],
   vis:fewer?bars([{name:A,segs:[{v:x,text:fmt(x)}]},{name:B,segs:[{v:x,text:''},{v:d,text:String(d),fill:KNOWN}]}],{brace:'?',label:`${B} has ${d} more than ${A}`}):bars([{name:A,segs:[{v:other,text:''},{v:d,text:String(d),fill:KNOWN}],end:fmt(x)},{name:B,segs:[{v:other,text:''}]}],{brace:'?',label:`${A} has ${d} more than ${B}`})});
 }
 const b=c.int(300,3500),d=c.int(50,900),total=2*b+d,askBig=c.random()<.5,ans=askBig?b+d:b;
 return q({qtext:`${A} and ${B} have ${fmt(total)} ${item} altogether. ${A} has ${d} more ${item} than ${B}. How many ${item} does ${askBig?A:B} have?`,ans,unit:item,data:{type:'sum-difference',total,d,askBig},
  help:`Take away the extra ${d} first. What is left is two equal bars.`,
  steps:[`Remove the difference: ${total} − ${d} = ${total-d}.`,`Two equal bars: ${total-d} ÷ 2 = ${b}, so ${B} has ${b}.`,...(askBig?[`${A}: ${b} + ${d} = ${b+d}.`]:[])],
  vis:drawOwn});
}
function p3times(c,tier){
 const [A,B]=c.pick(names),item=c.pick(things);
 if(tier===1){
  const k=c.int(2,5),n=c.int(12,99),total=c.random()<.5,ans=total?(k+1)*n:k*n;
  return q({qtext:`${B} has ${n} ${item}. ${A} has ${k} times as many ${item} as ${B}. How many ${item} ${total?'do they have altogether':`does ${A} have`}?`,ans,unit:item,data:{type:'times',k,n,total},
   help:`${B} is 1 unit. ${A} is ${k} units. ${total?`Altogether is ${k+1} units.`:''}`,
   steps:total?[`1 unit = ${n}.`,`${k+1} units = ${k+1} × ${n} = ${ans}.`]:[`1 unit = ${n}.`,`${A}: ${k} × ${n} = ${ans}.`],
   vis:bars([{name:A,segs:units(k,String(n))},{name:B,segs:units(1,String(n))}],total?{brace:'?',label:`${A} is ${k} units, ${B} is 1 unit`}:{label:`${A} is ${k} units, ${B} is 1 unit`})});
 }
 if(tier===2){
  const k=c.int(2,5),n=c.int(20,Math.floor(2400/(k+1))),T=(k+1)*n,askA=c.random()<.5,ans=askA?k*n:n;
  return q({qtext:`${A} has ${k} times as many ${item} as ${B}. They have ${fmt(T)} ${item} altogether. How many ${item} does ${askA?A:B} have?`,ans,unit:item,data:{type:'times-total',k,T,askA},
   help:`Count the units: ${A} has ${k}, ${B} has 1. Share the total among all the units.`,
   steps:[`Total units: ${k} + 1 = ${k+1}.`,`1 unit: ${T} ÷ ${k+1} = ${n}.`,...(askA?[`${A}: ${k} × ${n} = ${k*n}.`]:[])],
   vis:bars([{name:A,segs:units(k)},{name:B,segs:units(1)}],{brace:fmt(T),label:`${k} units and 1 unit make the total`})});
 }
 const k=c.int(3,6),n=c.int(15,Math.floor(1500/(k+1))),D=(k-1)*n,ans=(k+1)*n;
 return q({qtext:`${A} has ${k} times as many ${item} as ${B}. ${A} has ${fmt(D)} more ${item} than ${B}. How many ${item} do they have altogether?`,ans,unit:item,data:{type:'times-difference',k,D},
  help:`The difference is the extra units: ${A} has ${k-1} more units than ${B}.`,
  steps:[`Difference = ${k-1} units = ${D}.`,`1 unit: ${D} ÷ ${k-1} = ${n}.`,`Altogether: ${k+1} units = ${k+1} × ${n} = ${ans}.`],vis:drawOwn});
}
function p3groups(c,tier){
 if(tier===1){
  for(;;){
   const g=c.int(2,9),e=c.int(5,40),total=g*e,ps=[2,3,4,5,6,7,8,9].filter(p=>total%p===0&&total/p>=4&&p!==g);
   if(!ps.length)continue;const p=c.pick(ps),m=total/p,[A]=c.pick(names);
   return q({qtext:`${A}'s mother bought ${p} packets of sweets. Each packet had ${m} sweets. She shared all the sweets equally among ${g} children. How many sweets did each child get?`,ans:e,unit:'sweets',data:{type:'share',p,m,g},
    help:'First find all the sweets. Then share them into equal groups.',
    steps:[`All the sweets: ${p} × ${m} = ${total}.`,`Each child: ${total} ÷ ${g} = ${e}.`],
    vis:bars([{name:'Sweets',segs:Array.from({length:p},()=>({v:m,text:String(m)}))},{name:'Children',segs:Array.from({length:g},()=>({v:e,text:'?'}))}],{label:`${p} packets of ${m}, shared into ${g} equal parts`})});
  }
 }
 if(tier===2){
  const cap=c.int(4,9);let N;do{N=c.int(100,999);}while(N%cap===0);
  const r=N%cap,full=Math.floor(N/cap),type=c.int(0,2);
  if(type===0)return q({qtext:`${N} pupils are going on a trip. Each van can carry ${cap} pupils. What is the smallest number of vans needed?`,ans:full+1,unit:'vans',data:{type:'ceil',N,cap},help:'Divide, then think: can any pupils be left behind?',steps:[`${N} ÷ ${cap} = ${full} R ${r}.`,`The ${r} remaining pupils need one more van: ${full} + 1 = ${full+1}.`],vis:''});
  if(type===1)return q({qtext:`A farmer packs ${N} eggs into trays. Each tray holds ${cap} eggs. How many trays are completely filled?`,ans:full,unit:'trays',data:{type:'floor',N,cap},help:'Only full trays count. What happens to the eggs left over?',steps:[`${N} ÷ ${cap} = ${full} R ${r}.`,`${full} trays are full; ${r} eggs do not fill a tray.`],vis:''});
  return q({qtext:`A baker packs ${N} buns into boxes of ${cap}. How many more buns does she need to fill one more box?`,ans:cap-r,unit:'buns',data:{type:'fill',N,cap},help:'Find the remainder. How many more make one full box?',steps:[`${N} ÷ ${cap} = ${full} R ${r}.`,`One more full box needs ${cap} − ${r} = ${cap-r} more buns.`],vis:''});
 }
 const cap=c.int(4,9),N=c.int(200,999),p=c.int(2,9),boxes=Math.floor(N/cap),ans=boxes*p;
 return q({qtext:`A bakery made ${N} cupcakes. It packed them into boxes of ${cap} and sold every full box for $${p}. How much money did it receive for the full boxes?`,ans:ans*100,money:true,data:{type:'boxes-money',N,cap,p},
  help:'Find the number of full boxes first. Leftover cupcakes are not sold.',
  steps:[`Full boxes: ${N} ÷ ${cap} = ${boxes} R ${N%cap}.`,`Money: ${boxes} × $${p} = $${ans}.`],vis:drawOwn});
}
function p3money(c,tier){
 const [A]=c.pick(names);
 if(tier===1){
  const k=c.int(2,6),p=c.int(3,15),b=c.int(10,40),ans=k*p+b;
  return q({qtext:`${A} bought ${k} books at $${p} each and a bag for $${b}. How much did ${A} spend altogether?`,ans:ans*100,money:true,data:{type:'buy',k,p,b},
   help:'Multiply for the books first, then add the bag.',steps:[`Books: ${k} × $${p} = $${k*p}.`,`Altogether: $${k*p} + $${b} = $${ans}.`],
   vis:bars([{name:'Spent',segs:[...units(k,'$'+p),{v:Math.max(1,b/p),text:'$'+b,fill:KNOWN}]}],{top:{text:'?'},label:`${k} books and a bag`})});
 }
 if(tier===2){
  const a=c.int(450,2400),b=c.int(150,1200),note=a+b<2000?2000:5000,ans=note-a-b;
  return q({qtext:`A file costs ${cash(a)} and a pen costs ${cash(b)}. ${A} pays for both with a ${cash(note).replace('.00','')} note. How much change does ${A} get?`,ans,money:true,data:{type:'change',a,b,note},
   help:'Find the total cost first. Then subtract it from the note.',steps:[`Total: ${cash(a)} + ${cash(b)} = ${cash(a+b)}.`,`Change: ${cash(note)} − ${cash(a+b)} = ${cash(ans)}.`],
   vis:bars([{name:'Note',segs:[{v:a,text:cash(a)},{v:b,text:cash(b)},{v:ans,unknown:true,text:'?'}]}],{top:{text:cash(note)},label:'Note split into cost and change'})});
 }
 const type=c.int(0,2);
 if(type===0){const m=c.int(3,9),cm=c.int(10,90),total=m*100+cm,k=c.int(2,6),p=c.int(25,Math.floor((total-20)/k)),ans=total-k*p;
  return q({qtext:`A ribbon is ${m} m ${cm} cm long. ${A} cuts off ${k} pieces, each ${p} cm long. How long is the ribbon that is left? Give your answer in cm.`,ans,unit:'cm',data:{type:'ribbon',total,k,p},help:'Change the ribbon to centimetres first: 1 m = 100 cm.',steps:[`Ribbon: ${m} m ${cm} cm = ${total} cm.`,`Cut off: ${k} × ${p} = ${k*p} cm.`,`Left: ${total} − ${k*p} = ${ans} cm.`],vis:drawOwn});}
 if(type===1){const kg=c.int(2,5),g=c.int(150,450),d=c.int(2,Math.floor((kg*1000-50)/g)),ans=kg*1000-g*d;
  return q({qtext:`A bag has ${kg} kg of rice. Mum uses ${g} g of rice each day for ${d} days. How much rice is left? Give your answer in g.`,ans,unit:'g',data:{type:'rice',total:kg*1000,g,d},help:'Change kilograms to grams first: 1 kg = 1000 g.',steps:[`Rice: ${kg} kg = ${kg*1000} g.`,`Used: ${d} × ${g} = ${g*d} g.`,`Left: ${kg*1000} − ${g*d} = ${ans} g.`],vis:drawOwn});}
 const l=c.int(2,6),ml=c.int(100,900),total=l*1000+ml,b=c.int(150,500),k=c.int(2,Math.floor(total/b)),ans=total-b*k;
 return q({qtext:`A tank holds ${l} ℓ ${ml} ml of water. ${A} fills ${k} bottles with ${b} ml of water each. How much water is left in the tank? Give your answer in ml.`,ans,unit:'ml',data:{type:'water',total,k,p:b},help:'Change litres to millilitres first: 1 ℓ = 1000 ml.',steps:[`Water: ${l} ℓ ${ml} ml = ${total} ml.`,`Used: ${k} × ${b} = ${k*b} ml.`,`Left: ${total} − ${k*b} = ${ans} ml.`],vis:drawOwn});
}

/* ---------- P4 families ---------- */
function p4units(c,tier){
 const [A,B]=c.pick(names),item=c.pick(things);
 if(tier===1){
  const k=c.int(2,6),n=c.int(25,500),D=(k-1)*n,ans=k*n;
  return q({qtext:`${A} has ${k} times as many ${item} as ${B}. ${A} has ${fmt(D)} more ${item} than ${B}. How many ${item} does ${A} have?`,ans,unit:item,data:{type:'times-diff',k,D},
   help:`${A} has ${k-1} more units than ${B}. Those extra units are worth ${D}.`,
   steps:[`${k-1} units = ${D}.`,`1 unit = ${D} ÷ ${k-1} = ${n}.`,`${A}: ${k} × ${n} = ${ans}.`],
   vis:bars([{name:A,segs:[...units(1),...units(k-1,'',[]).map(u=>({...u,fill:KNOWN}))]},{name:B,segs:units(1)}],{label:`The extra ${k-1} units are the difference`,caption:`shaded units = ${fmt(D)}`})});
 }
 if(tier===2){
  const k=c.int(2,5),n=c.int(40,900),e=c.int(20,300),T=(k+2)*n+e,askB=c.random()<.5,ans=askB?n:n+e,Cn='Kumar';
  return q({qtext:`${A} has ${k} times as many ${item} as ${B}. ${Cn} has ${e} more ${item} than ${B}. The three children have ${fmt(T)} ${item} altogether. How many ${item} does ${askB?B:Cn} have?`,ans,unit:item,data:{type:'three-units',k,e,T,askB},
   help:`Let ${B} be 1 unit. Take away the extra ${e} first, then count the units.`,
   steps:[`Units: ${k} + 1 + 1 = ${k+2}.`,`${k+2} units = ${T} − ${e} = ${T-e}.`,`1 unit = ${(T-e)} ÷ ${k+2} = ${n}.`,...(askB?[]:[`${Cn}: ${n} + ${e} = ${n+e}.`])],
   vis:bars([{name:A,segs:units(k)},{name:B,segs:units(1)},{name:Cn,segs:[...units(1),{v:.6,text:String(e),fill:KNOWN}]}],{brace:fmt(T),label:'Units for three children'})});
 }
 const m=c.int(2,4),k=c.int(2,4),n=c.int(30,Math.floor(30000/(1+k+m*k))),T=n*(1+k+m*k),ans=m*k*n,Cn='Kumar';
 return q({qtext:`${A} has ${m} times as many ${item} as ${B}. ${B} has ${k} times as many ${item} as ${Cn}. They have ${fmt(T)} ${item} altogether. How many ${item} does ${A} have?`,ans,unit:item,data:{type:'chain',m,k,T},
  help:`Let ${Cn} be 1 unit. Then ${B} is ${k} units and ${A} is ${m} × ${k} units.`,
  steps:[`${Cn} 1 unit, ${B} ${k} units, ${A} ${m*k} units.`,`Total: ${1+k+m*k} units = ${T}.`,`1 unit = ${n}.`,`${A}: ${m*k} × ${n} = ${ans}.`],vis:drawOwn});
}
function p4beforeafter(c,tier){
 const [A,B]=c.pick(names),item=c.pick(things);
 if(tier===1){
  const a=c.int(12,80),b=c.int(10,60),left=c.int(15,120),got=c.random()<.5?c.int(10,50):0,first=left-got+a+b;
  if(first<=0)return p4beforeafter(c,tier);
  return q({qtext:got?`${A} spent $${a} on a book and $${b} on a bag. Then Grandma gave ${A} $${got}. ${A} now has $${left}. How much money did ${A} have at first?`:`${A} spent $${a} on a book and $${b} on a bag. ${A} had $${left} left. How much money did ${A} have at first?`,ans:first*100,money:true,data:{type:'backwards',a,b,got,left},
   help:'Work backwards from the end. Undo each step in reverse order.',
   steps:got?[`Before Grandma's gift: $${left} − $${got} = $${left-got}.`,`Add back what was spent: $${left-got} + $${a} + $${b} = $${first}.`]:[`Add back what was spent: $${left} + $${a} + $${b} = $${first}.`],
   vis:bars([{name:'At first',segs:[{v:a,text:'$'+a},{v:b,text:'$'+b},{v:Math.max(left-got,10),text:got?'':'$'+left,fill:KNOWN}]}],{top:{text:'?'},label:'At first = spent + left'})});
 }
 if(tier===2){
  const y=c.int(40,900),half=c.int(10,300),x=y+2*half,total=x+y;
  if(c.random()<.5)return q({qtext:`${A} has ${x} ${item} and ${B} has ${y} ${item}. How many ${item} must ${A} give ${B} so that they have the same number?`,ans:half,unit:item,data:{type:'equalise',x,y},
   help:'Find the difference. Giving moves half of the difference, because one bar shrinks while the other grows.',
   steps:[`Difference: ${x} − ${y} = ${x-y}.`,`Give half: ${x-y} ÷ 2 = ${half}.`,`Check: ${x-half} = ${y+half}.`],
   vis:bars([{name:A,segs:[{v:y,text:String(y)},{v:half,text:'?',fill:KNOWN},{v:half,text:''}]},{name:B,segs:[{v:y,text:String(y)}]}],{label:'Half of the extra moves across'})});
  return q({qtext:`${A} and ${B} have ${fmt(total)} ${item} altogether. After ${A} gives ${half} ${item} to ${B}, they have the same number. How many ${item} did ${A} have at first?`,ans:x,unit:item,data:{type:'same-after',total,half},
   help:'After giving, the two bars are equal. Find one bar at the end, then undo the gift.',
   steps:[`At the end each has ${total} ÷ 2 = ${total/2}.`,`${A} at first: ${total/2} + ${half} = ${x}.`],
   vis:bars([{name:A,segs:[{v:total/2,text:''},{v:half,text:String(half),dash:true}]},{name:B,segs:[{v:total/2-half,text:''},{v:half,text:'',fill:KNOWN}]}],{label:'End: equal bars'})});
 }
 const k=c.int(3,6);
 if(c.random()<.5){const u=c.int(15,400),g=(k-1)*u,first=k*u;
  return q({qtext:`${A} had ${k} times as many ${item} as ${B}. After ${A} gave away ${fmt(g)} ${item} to friends, both children had the same number of ${item}. How many ${item} did ${A} have at first?`,ans:first,unit:item,data:{type:'giveaway',k,g},
   help:`${B} did not change. ${A} lost the extra units.`,steps:[`${k-1} units = ${g}.`,`1 unit = ${g} ÷ ${k-1} = ${u}.`,`${A} at first: ${k} × ${u} = ${first}.`],vis:drawOwn});}
 let u,g;do{u=c.int(10,300);g=(k-1)*u/2;}while(!Number.isInteger(g));
 return q({qtext:`${A} had ${k} times as many ${item} as ${B}. After ${A} gave ${fmt(g)} ${item} to ${B}, they had the same number. How many ${item} did ${A} have at first?`,ans:k*u,unit:item,data:{type:'transfer',k,g},
  help:'After the gift they are equal, so the gift is half of the difference.',steps:[`Difference at first: ${k-1} units.`,`The gift is half of it: ${k-1} units = 2 × ${g} = ${2*g}.`,`1 unit = ${u}; ${A} at first: ${k} × ${u} = ${k*u}.`],vis:drawOwn});
}
function p4fraction(c,tier){
 const [A]=c.pick(names);
 if(tier===1){
  const b=c.pick([3,4,5,6,8,10,12]),a=coprime(c,b),k=c.int(3,20),N=b*k,ans=(b-a)*k;
  return q({qtext:`There are ${N} pupils in a hall. ${a}/${b} of them are girls. How many boys are there?`,ans,unit:'boys',data:{type:'rest',a,b,N},
   help:`Cut the whole into ${b} equal parts. The girls take ${a} parts.`,steps:[`1 part: ${N} ÷ ${b} = ${k}.`,`Boys: ${b-a} parts = ${b-a} × ${k} = ${ans}.`],
   vis:bars([{name:'Pupils',segs:[...units(a,'G'),...units(b-a,'B').map(u=>({...u,fill:KNOWN}))]}],{top:{text:String(N)},label:`${b} equal parts`})});
 }
 if(tier===2){
  const b=c.pick([3,4,5,6,8,10]),a=coprime(c,b),k=c.int(4,40),L=(b-a)*k,ans=b*k;
  return q({qtext:`Mrs Tan spent ${a}/${b} of her money on a dress. She had $${L} left. How much money did she have at first?`,ans:ans*100,money:true,data:{type:'whole-from-left',a,b,L},
   help:`The money left is ${b-a} of the ${b} parts. Find one part first.`,steps:[`Left: ${b-a} parts = $${L}.`,`1 part = $${L} ÷ ${b-a} = $${k}.`,`At first: ${b} × $${k} = $${ans}.`],
   vis:bars([{name:'Money',segs:[...units(a,'spent'),...units(b-a,'').map(u=>({...u,fill:KNOWN}))]}],{top:{text:'?'},label:`${a} parts spent, ${b-a} parts left`,caption:`shaded parts = $${L}`})});
 }
 if(c.random()<.5){
  let b,a;do{b=c.pick([5,7,8,9,10,11,12]);a=c.int(1,Math.floor((b-1)/2));}while(b-2*a<=0||gcd(a,b)!==1);
  const u=c.int(3,30),D=(b-2*a)*u,ans=b*u;
  return q({qtext:`${a}/${b} of the pupils in a choir are boys. There are ${D} more girls than boys. How many pupils are in the choir?`,ans,unit:'pupils',data:{type:'fraction-difference',a,b,D},
   help:`Boys ${a} units, girls ${b-a} units. The difference is ${b-2*a} units.`,steps:[`Girls − boys = ${b-a} − ${a} = ${b-2*a} units = ${D}.`,`1 unit = ${u}.`,`Choir: ${b} × ${u} = ${ans}.`],vis:drawOwn});
 }
 const pairs=[[4,5],[3,4],[2,5],[3,8],[4,6],[2,3],[6,8],[5,10],[3,12],[4,12]];
 for(;;){
  const [d1,d2]=c.pick(pairs),n1=coprime(c,d1),n2=coprime(c,d2),l=lcm(d1,d2),used=n1*(l/d1)+n2*(l/d2);if(used>=l)continue;
  const k=c.int(2,15),whole=l*k,y=n2*whole/d2,left=whole-n1*whole/d1-y;
  return q({qtext:`${A} spent ${n1}/${d1} of her money on a game and ${n2}/${d2} of her money on a book. She had $${left} left. How much did she spend on the book?`,ans:y*100,money:true,data:{type:'two-fractions',n1,d1,n2,d2,left},
   help:`Use ${l} equal parts for the whole. Find what fraction is left.`,steps:[`Whole = ${l} parts. Game ${n1*l/d1}, book ${n2*l/d2}, left ${l-used} parts.`,`${l-used} parts = $${left}, so 1 part = $${k}.`,`Book: ${n2*l/d2} × $${k} = $${y}.`],vis:drawOwn});
 }
}
function p4decimal(c,tier){
 const [A]=c.pick(names);
 if(tier===1){
  const k=c.int(2,9),p=c.int(105,995),ans=k*p,[item,items]=c.pick([['pen','pens'],['ruler','rulers'],['notebook','notebooks'],['juice box','juice boxes']]);
  return q({qtext:`One ${item} costs ${cash(p)}. How much do ${k} ${items} cost?`,ans,money:true,data:{type:'unit-cost',k,p},help:'Multiply the cost of one by the number bought. Line up the decimal point.',steps:[`${k} × ${cash(p)} = ${cash(ans)}.`],
   vis:bars([{name:items[0].toUpperCase()+items.slice(1),segs:units(k,cash(p))}],{top:{text:'?'},label:`${k} equal costs`})});
 }
 if(tier===2){
  const k=c.int(2,6),a=c.int(85,450),b=c.int(150,780),cost=k*a+b,note=cost<2000?2000:5000,ans=note-cost;
  return q({qtext:`${A} bought ${k} pens at ${cash(a)} each and a file for ${cash(b)}. She paid with a $${note/100} note. How much change did she receive?`,ans,money:true,data:{type:'change',k,a,b,note},help:'Find the cost of the pens, then the total, then the change.',steps:[`Pens: ${k} × ${cash(a)} = ${cash(k*a)}.`,`Total: ${cash(k*a)} + ${cash(b)} = ${cash(cost)}.`,`Change: ${cash(note)} − ${cash(cost)} = ${cash(ans)}.`],
   vis:bars([{name:'Note',segs:[{v:k*a,text:'pens'},{v:b,text:'file'},{v:Math.max(ans,200),unknown:true,text:'?'}]}],{top:{text:cash(note)},label:'Note = pens + file + change'})});
 }
 if(c.random()<.5){
  const size=c.pick([4,5,6]),y=c.int(45,180),x=c.int(Math.ceil(size*y*0.6),size*y-10),m=c.int(2,5),n=size*m,ans=m*(size*y-x);
  return q({qtext:`A packet of ${size} buns costs ${cash(x)}. One bun costs ${cash(y)} when bought singly. How much does ${A} save by buying ${n} buns in packets instead of singly?`,ans,money:true,data:{type:'save',size,x,y,n},help:'Find the cost both ways, then the difference.',steps:[`Singly: ${n} × ${cash(y)} = ${cash(n*y)}.`,`Packets: ${m} × ${cash(x)} = ${cash(m*x)}.`,`Saved: ${cash(n*y)} − ${cash(m*x)} = ${cash(ans)}.`],vis:drawOwn});
 }
 const k=c.int(3,8),cup=c.int(15,45),r=c.int(5,95),ans=(k*cup+r)/100;
 return q({qtext:`${A} poured juice from a jug into ${k} cups. Each cup held ${(cup/100).toFixed(2)} ℓ. There was ${(r/100).toFixed(2)} ℓ of juice left in the jug. How much juice was in the jug at first?`,ans:Math.round(ans*1000)/1000,dec:true,unit:'ℓ',data:{type:'jug',k,cup:cup/100,r:r/100},help:'Find the juice in all the cups first, then add what was left.',steps:[`Cups: ${k} × ${(cup/100).toFixed(2)} = ${(k*cup/100).toFixed(2)} ℓ.`,`At first: ${(k*cup/100).toFixed(2)} + ${(r/100).toFixed(2)} = ${(Math.round(ans*1000)/1000)} ℓ.`],vis:drawOwn});
}
function p4area(c,tier){
 if(tier===1){
  const L=c.int(6,25),W=c.int(3,L-1),area=c.random()<.5,ans=area?L*W:2*(L+W),cost=c.int(2,9);
  if(c.random()<.5)return q({qtext:`A rectangular garden is ${L} m long and ${W} m wide. ${area?'What is its area?':'A fence is built around it. How long is the fence?'}`,ans,unit:area?'m²':'m',data:{type:area?'area':'perimeter',L,W},help:area?'Area = length × width.':'The fence goes all the way round: add all four sides.',steps:area?[`${L} × ${W} = ${ans} m².`]:[`2 × (${L} + ${W}) = ${ans} m.`],vis:C.rect?'':''});
  return q({qtext:`A rectangular garden is ${L} m long and ${W} m wide. Fencing costs $${cost} per metre. How much does it cost to fence the whole garden?`,ans:2*(L+W)*cost*100,money:true,data:{type:'fence-cost',L,W,cost},help:'Find the perimeter first, then multiply by the cost of one metre.',steps:[`Perimeter: 2 × (${L} + ${W}) = ${2*(L+W)} m.`,`Cost: ${2*(L+W)} × $${cost} = $${2*(L+W)*cost}.`],vis:''});
 }
 if(tier===2){
  let L,W;do{L=c.int(8,30);W=c.int(2,L-2);}while((L+W)%2);const s=(L+W)/2;
  return q({qtext:`A square has the same perimeter as a rectangle that is ${L} cm long and ${W} cm wide. What is the area of the square?`,ans:s*s,unit:'cm²',data:{type:'same-perimeter',L,W},help:'Find the rectangle’s perimeter. A square has four equal sides.',steps:[`Perimeter: 2 × (${L} + ${W}) = ${2*(L+W)} cm.`,`Side of square: ${2*(L+W)} ÷ 4 = ${s} cm.`,`Area: ${s} × ${s} = ${s*s} cm².`],vis:''});
 }
 if(c.random()<.5){const L=c.int(6,25),W=c.int(3,20),A=L*W;
  return q({qtext:`A rectangle has an area of ${A} cm². Its length is ${L} cm. What is its perimeter?`,ans:2*(L+W),unit:'cm',data:{type:'area-to-perimeter',A,L},help:'Use the area to find the missing width first.',steps:[`Width: ${A} ÷ ${L} = ${W} cm.`,`Perimeter: 2 × (${L} + ${W}) = ${2*(L+W)} cm.`],vis:''});}
 const L=c.int(12,30),W=c.int(8,L),s=c.int(2,W-3),perim=c.random()<.5;
 return q({qtext:`A rectangular card is ${L} cm long and ${W} cm wide. A square of side ${s} cm is cut away from one corner. What is the ${perim?'perimeter':'area'} of the remaining card?`,ans:perim?2*(L+W):L*W-s*s,unit:perim?'cm':'cm²',data:{type:perim?'corner-perimeter':'corner-area',L,W,s},
  help:perim?'Draw it. The two new edges inside the cut are the same lengths as the two pieces removed from the outside.':'Take the square’s area away from the rectangle’s area.',
  steps:perim?[`Moving the two cut edges outward makes the full rectangle again.`,`Perimeter: 2 × (${L} + ${W}) = ${2*(L+W)} cm.`]:[`Rectangle: ${L} × ${W} = ${L*W} cm².`,`Square: ${s} × ${s} = ${s*s} cm².`,`Left: ${L*W} − ${s*s} = ${L*W-s*s} cm².`],vis:''});
}
function p4groups(c,tier){
 if(tier===1){
  const cap=c.int(6,40);let N;do{N=c.int(1000,9999);}while(N%cap===0);const r=N%cap,full=Math.floor(N/cap);
  return c.random()<.5?q({qtext:`${fmt(N)} people are going to a concert by bus. Each bus can carry ${cap} people. What is the smallest number of buses needed?`,ans:full+1,unit:'buses',data:{type:'ceil',N,cap},help:'Divide, then decide what to do with the people left over.',steps:[`${N} ÷ ${cap} = ${full} R ${r}.`,`One more bus for the ${r} people: ${full+1}.`],vis:''})
   :q({qtext:`A factory packs ${fmt(N)} pencils into boxes of ${cap}. How many boxes are completely filled?`,ans:full,unit:'boxes',data:{type:'floor',N,cap},help:'Only full boxes count.',steps:[`${N} ÷ ${cap} = ${full} R ${r}.`,`${full} full boxes.`],vis:''});
 }
 if(tier===2){
  const cap=c.pick([6,10,12,20,30]),N=c.int(400,4000),price=c.int(150,950),full=Math.floor(N/cap),ans=full*price;
  return q({qtext:`A farm collected ${fmt(N)} eggs. They were packed into trays of ${cap} and each full tray was sold for ${cash(price)}. How much money did the farm receive?`,ans,money:true,data:{type:'trays-money',N,cap,price},help:'Find the full trays first. Then multiply by the price of one tray.',steps:[`Full trays: ${N} ÷ ${cap} = ${full} R ${N%cap}.`,`Money: ${full} × ${cash(price)} = ${cash(ans)}.`],vis:''});
 }
 const a=c.int(3,7),b=a+c.int(1,3),n=c.int(8,40),e=c.int(2,a*n-1>40?40:a*n-1),s=(b-a)*n-e;
 if(s<=0)return p4groups(c,tier);
 const askKids=c.random()<.5,ans=askKids?n:a*n+e;
 return q({qtext:`Mr Lim has some sweets for his class. If he gives each pupil ${a} sweets, he will have ${e} sweets left. If he gives each pupil ${b} sweets, he will need ${s} more sweets. How many ${askKids?'pupils are in the class':'sweets does Mr Lim have'}?`,ans,unit:askKids?'pupils':'sweets',data:{type:'excess-shortage',a,b,e,s,askKids},
  help:`Giving ${b-a} more to every pupil uses up the ${e} left over and needs ${s} more.`,steps:[`Extra sweets needed for ${b-a} more each: ${e} + ${s} = ${e+s}.`,`Pupils: ${e+s} ÷ ${b-a} = ${n}.`,...(askKids?[]:[`Sweets: ${a} × ${n} + ${e} = ${a*n+e}.`])],vis:drawOwn});
}
function gcd(a,b){return b?gcd(b,a%b):a;}
function coprime(c,d){let n;do{n=c.int(1,d-1);}while(gcd(n,d)!==1);return n;}
function lcm(a,b){return a*b/gcd(a,b);}

const families=[
 ['p3-wppartwhole',3,'Part-whole word problems',p3partwhole,'p3-addsub'],
 ['p3-wpcompare',3,'More than & fewer than',p3compare,'p3-addsub'],
 ['p3-wptimes',3,'Times as many (units)',p3times,'p3-tables'],
 ['p3-wpgroups',3,'Equal groups & leftovers',p3groups,'p3-remainder'],
 ['p3-wpmoney',3,'Money & measures problems',p3money,'p3-money'],
 ['p4-wpunits',4,'Units & models',p4units,'p3-wptimes'],
 ['p4-wpbeforeafter',4,'Before & after',p4beforeafter,'p3-wpcompare'],
 ['p4-wpfraction',4,'Fraction word problems',p4fraction,'p4-fracset'],
 ['p4-wpdecimal',4,'Money & decimal problems',p4decimal,'p4-decimalops'],
 ['p4-wparea',4,'Area & perimeter problems',p4area,'p4-composite'],
 ['p4-wpgroups',4,'Grouping & excess-shortage',p4groups,'p4-divide']
];
const registered=[];
for(const [id,year,name,make,prereq] of families){
 if(C.skills.some(s=>s.id===id))continue;
 C.skills.push({id,year,topic:'Word problems',name,make:(c,tier)=>make(c,tier),prerequisite:prereq,manual:false,wordProblem:true});
 registered.push(id);
}

/* ---------- lessons ---------- */
const L=(id,goal,idea,visual,example,steps,question,options,answer,explanation)=>{T.lessons[id]={id,goal,idea,visual,example,steps,check:{question,options,answer,explanation}};};
L('p3-wppartwhole','Find a missing part from the whole.','A part-whole model has one long bar for the whole. Known parts are cut off the bar. To find a missing part, subtract the known parts from the whole.',
 bars([{name:'Whole',segs:[{v:300,text:'300'},{v:250,text:'250'},{v:200,unknown:true,text:'?'}]}],{top:{text:'750'},label:'Whole 750: parts 300, 250 and ?'}),
 'A stall had 750 buns. It sold 300 in the morning and 250 in the afternoon. How many were left?',['Draw one bar for 750 buns. Mark 300 and 250 as parts.','Sold altogether: 300 + 250 = 550.','Left: 750 − 550 = 200. Check: 300 + 250 + 200 = 750.'],
 'A whole is 900. Two parts are 400 and 350. What is the third part?',['150','250','1650'],'150','400 + 350 = 750, and 900 − 750 = 150.');
L('p3-wpcompare','Compare two amounts with two bars.','Draw one bar for each person, lined up on the left. The longer bar belongs to the person who has more. The extra piece is the difference. Read “fewer than” carefully: it tells you who has less.',
 bars([{name:'Mei',segs:[{v:300,text:'300'}]},{name:'Ravi',segs:[{v:300,text:''},{v:120,text:'120',fill:KNOWN}]}],{brace:'?',label:'Ravi has 120 more than Mei'}),
 'Mei has 300 stamps. Ravi has 120 more than Mei. How many do they have altogether?',['Ravi’s bar is Mei’s bar plus 120: 300 + 120 = 420.','Altogether: 300 + 420 = 720.','When the total and the difference are given, first take the difference away. Then halve what is left to find the smaller bar.'],
 'Ali has 50 cards. This is 20 fewer than Ben. How many cards does Ben have?',['70','30','100'],'70','Ali has fewer, so Ben has more: 50 + 20 = 70.');
L('p3-wptimes','Use equal units for “times as many”.','When one person has 3 times as many as another, draw the smaller bar as 1 unit and the larger bar as 3 equal units. Count all the units for the total, or the extra units for the difference.',
 bars([{name:'Siti',segs:units(3,'24')},{name:'Ben',segs:units(1,'24')}],{brace:'4 units',label:'Siti 3 units, Ben 1 unit'}),
 'Siti has 3 times as many beads as Ben. They have 96 beads altogether. How many does Ben have?',['Siti is 3 units and Ben is 1 unit: 4 units altogether.','4 units = 96, so 1 unit = 96 ÷ 4 = 24.','Ben has 24 beads. Siti has 3 × 24 = 72. Check: 24 + 72 = 96.'],
 'A has 4 times as many as B. A has 60 more than B. What is 1 unit?',['20','15','12'],'20','A has 3 more units than B. 3 units = 60, so 1 unit = 20.');
L('p3-wpgroups','Decide what the remainder means.','After dividing, look back at the story. Sometimes the leftover needs one more group (people still need a van). Sometimes it is ignored (only full boxes count). Sometimes the question asks how many more are needed to make another group.',
 bars([{name:'Pupils',segs:[...units(4,'8'),{v:.6,text:'3',fill:KNOWN}]}],{label:'35 pupils: 4 full vans of 8 and 3 more pupils'}),
 '35 pupils travel in vans that carry 8 each. How many vans are needed?',['35 ÷ 8 = 4 R 3.','4 vans are full, but 3 pupils still need a seat.','So 5 vans are needed. Answer the question that was asked, not just the division.'],
 '50 eggs go into trays of 6. How many trays are completely filled?',['8','9','2'],'8','50 ÷ 6 = 8 R 2. Only 8 trays are full.');
L('p3-wpmoney','Work in one unit, step by step.','In money and measurement stories, change everything to one unit first (cents, centimetres, grams or millilitres). Then decide the order of the steps: find totals before finding change or what is left.',
 bars([{name:'$20',segs:[{v:735,text:'$7.35'},{v:480,text:'$4.80'},{v:785,unknown:true,text:'?'}]}],{label:'$20 note split into two costs and change'}),
 'A file costs $7.35 and a pen costs $4.80. Hana pays with a $20 note. How much change does she get?',['Total cost: $7.35 + $4.80 = $12.15.','Change: $20.00 − $12.15 = $7.85.','For lengths, change 3 m 40 cm to 340 cm before you add or subtract.'],
 'Change 4 kg 50 g to grams.',['4050 g','450 g','4500 g'],'4050 g','4 kg = 4000 g. 4000 + 50 = 4050 g.');
L('p4-wpunits','Make units do the work.','Choose the smallest quantity as 1 unit. Write every other quantity in units, plus any extra amount. Remove extras, then share what is left among the units.',
 bars([{name:'A',segs:units(2)},{name:'B',segs:units(1)},{name:'C',segs:[...units(1),{v:.6,text:'15',fill:KNOWN}]}],{brace:'215',label:'A 2 units, B 1 unit, C 1 unit + 15'}),
 'A has twice as many as B. C has 15 more than B. Altogether they have 215. Find B.',['B is 1 unit, A is 2 units, C is 1 unit + 15.','4 units + 15 = 215, so 4 units = 200.','1 unit = 50. B has 50.'],
 'A is 3 units and B is 1 unit. A has 80 more than B. What is 1 unit?',['40','20','80'],'40','The difference is 2 units = 80, so 1 unit = 40.');
L('p4-wpbeforeafter','Draw before and after.','Ask what changed and what stayed the same. If someone only gives away, the other person stays the same. If one person gives to another, the total stays the same and the gap closes by twice the gift. Working backwards undoes each step.',
 bars([{name:'Before',segs:[{v:30,text:'30'},{v:10,text:'10',fill:KNOWN},{v:10,text:'10'}]},{name:'Other',segs:[{v:30,text:'30'}]}],{label:'Giving 10 closes a gap of 20'}),
 'Ali has 50 marbles and Ben has 30. How many must Ali give Ben so they have the same?',['The gap is 50 − 30 = 20.','Giving moves marbles from one bar to the other, so it closes the gap twice as fast.','Give half the gap: 20 ÷ 2 = 10. Check: 40 and 40.'],
 'After spending $12, Mei had $30. How much did she have at first?',['$42','$18','$30'],'$42','Undo the spending: $30 + $12 = $42.');
L('p4-wpfraction','Turn fractions into equal parts.','The denominator tells you how many equal parts make the whole. Find what one part is worth from any known amount, then build the amount you need.',
 bars([{name:'Money',segs:[...units(2,'spent'),...units(3,'').map(u=>({...u,fill:KNOWN}))]}],{top:{text:'?'},label:'Spent 2 of 5 parts; 3 parts left',caption:'3 parts = $36'}),
 'Mrs Tan spent 2/5 of her money and had $36 left. How much did she have at first?',['The whole is 5 parts; 2 are spent and 3 are left.','3 parts = $36, so 1 part = $12.','At first: 5 × $12 = $60.'],
 '3/4 of a set is 24. What is the whole set?',['32','18','96'],'32','3 parts = 24, so 1 part = 8, and 4 parts = 32.');
L('p4-wpdecimal','Handle money with decimals in steps.','Multiply for repeated costs, add for totals and subtract for change or savings. Line up the decimal points and write money with two decimal places.',
 bars([{name:'Pens',segs:units(4,'$1.25')}],{top:{text:'$5.00'},label:'4 pens at $1.25'}),
 'A pack of 4 buns costs $3.20. One bun costs $0.95. How much is saved by buying 8 buns in packs?',['Singly: 8 × $0.95 = $7.60.','Packs: 2 × $3.20 = $6.40.','Saved: $7.60 − $6.40 = $1.20.'],
 'What is 3 × $2.45?',['$7.35','$6.35','$7.45'],'$7.35','$2.45 × 3: 3 × $2 = $6 and 3 × $0.45 = $1.35. Total $7.35.');
L('p4-wparea','Choose area or perimeter from the story.','Fencing, edging and borders go around the outside: perimeter. Covering, painting and tiling fill the inside: area. When one measurement is missing, use the other one to find it first.',
 '',
 'A rectangle has an area of 48 cm² and length 8 cm. Find its perimeter.',['Width = 48 ÷ 8 = 6 cm.','Perimeter = 2 × (8 + 6) = 28 cm.','Cutting a square from a corner removes area but keeps the perimeter the same.'],
 'A garden needs a fence all the way round. Which do you find?',['Perimeter','Area','Length only'],'Perimeter','A fence goes around the outside, so it is the perimeter.');
L('p4-wpgroups','Use the leftovers wisely.','Large grouping problems use the same idea as smaller ones: divide, then decide what the remainder means. In excess-and-shortage problems, giving everyone a few more uses the leftovers and the shortage together.',
 bars([{name:'3 each',segs:[...Array.from({length:5},()=>({v:3,text:'3'})),{v:4,text:'+4',fill:KNOWN}]},{name:'5 each',segs:[...Array.from({length:5},()=>({v:5,text:'5'}))],end:'6 short'}],{label:'Excess 4, shortage 6',caption:'19 sweets: 4 left over at 3 each, 6 short at 5 each'}),
 'If each pupil gets 3 sweets, 4 are left. If each gets 5, 6 more are needed. How many pupils?',['Giving 2 more each needs the 4 left over plus 6 more: 10 sweets.','Pupils: 10 ÷ 2 = 5.','Sweets: 5 × 3 + 4 = 19. Check: 5 × 5 = 25, which is 6 more than 19.'],
 '1000 people take buses that carry 45. How many buses are needed?',['23','22','45'],'23','1000 ÷ 45 = 22 R 10, so the 10 people need one more bus: 23.');

const api={families:families.map(f=>f[0]),registered,bars,generate:(id,tier,random=Math.random)=>C.generate(id,tier,random)};
if(typeof module==='object'&&module.exports)module.exports=api;else root.HanaProblems=api;
})(typeof window==='undefined'?globalThis:window);
