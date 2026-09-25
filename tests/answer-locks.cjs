/* Real browser regression for answer controls across question/input transitions.
 * Fixtures only set an ordinary saved diagnostic session; clicks/taps use the UI. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(req.url.split('?')[0])==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end();}).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const method of ['pad','write','keyboard']){
   const context=await browser.newContext({viewport:{width:800,height:1100},hasTouch:true,reducedMotion:'reduce'});
   await context.addInitScript(()=>{
    if(!localStorage.getItem('fixture')){
     localStorage.setItem('fixture','yes');localStorage.setItem('hq_sound','off');localStorage.setItem('hq_tts','off');
     localStorage.setItem('hq_stars','21');localStorage.setItem('hq_caught','25,133');
    }
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const tap=selector=>page.locator(selector).tap();
   const clearCatch=()=>page.waitForFunction(()=>document.querySelector('#catch').style.display!=='flex',{},{timeout:20000});
   await page.goto(`http://127.0.0.1:${server.address().port}/`);
   await page.waitForFunction(()=>!document.querySelector('#startDaily').disabled&&!!NET);
   await page.evaluate(async()=>{
    const spec=HanaCurriculum.generate('p3-place',1,()=>0.5);
    await store.set('hq_session',JSON.stringify({id:'lock-fixture',year:3,kind:'checkin',queue:['p3-place','p3-lines','p3-lines','p3-place'],index:0,results:[],phase:'practice',current:{id:'lock-first',spec,tries:0,hints:0,entry:'',done:false,revealed:false,started:Date.now(),elapsed:0,notes:{},strokes:[],answerStrokes:[]}}));
    await HanaStudio.reload();
   });
   await tap('#resumeSession');
   async function number(){
    const answer=await page.evaluate(()=>String(HanaStudio.getSession().current.spec.ans));
    if(method==='pad'){
     await tap('#useKeypad');
     for(const digit of answer)await page.locator('#kpad button').filter({hasText:new RegExp('^'+digit+'$')}).tap();
     await tap('#kpad .kok');
    }else{
     await tap('#useKeyboard');await page.locator('#typedAnswer').fill(answer);
     if(method==='write')await tap('#useWriting');
     await tap(method==='write'?'#wOk':'#answerForm button');
    }
    assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.done),true);
    await clearCatch();
   }
   async function available(label){
    const state=await page.evaluate(()=>({done:HanaStudio.getSession().current.done,locked:padLocked,containerLocked:document.querySelector('#pad').classList.contains('locked'),pointerEvents:getComputedStyle(document.querySelector('#pad')).pointerEvents,disabled:[...document.querySelectorAll('#pad button')].map(b=>b.disabled)}));
    assert.equal(state.done,false,label);
    assert.equal(state.locked,false,label);
    assert.equal(state.containerLocked,false,`${method}: ${label}: stale container lock: ${JSON.stringify(state)}`);
    assert.notEqual(state.pointerEvents,'none',label);assert.ok(state.disabled.every(x=>!x),label);
   }
   async function choice(correct=true){
    const i=await page.evaluate(correct=>{const s=HanaStudio.getSession().current.spec;return s.choices.findIndex(o=>correct?o.v===s.ans:o.v!==s.ans);},correct);
    await page.locator('#pad button').nth(i).tap();
   }
   async function lesson(){
    await tap('#lessonNext');await tap('#lessonNext');
    const i=await page.evaluate(()=>{const d=HanaLessons.get(HanaStudio.getSession().lesson.skill);return d.check.options.indexOf(d.check.answer);});
    await page.locator('#lessonChoices button').nth(i).tap();
    assert.equal(await page.locator('#lessonNext').isEnabled(),true);
    await tap('#lessonNext');
   }
   // Reproduces h13: completing keypad/stylus input locks the hidden choice
   // container, and the next question leaves it grey with pointer-events:none.
   await number();await tap('#nextQuestion');await available('number → choice');
   await choice(false);assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.tries),1);await available('retry after wrong choice');
   await tap('#hintButton');await available('hint after wrong choice');
   await choice();assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.done),true);
   const count=await page.evaluate(()=>HanaStudio.getLearning().events.length);
   assert.equal(await page.locator('#nextQuestion').isVisible(),true);
   assert.equal(await page.locator('#pad button:enabled').count(),0);
   // Completed questions stay locked and cannot award twice, even through a DOM click.
   await page.evaluate(()=>{document.querySelector('#pad button').click();});
   assert.equal(await page.evaluate(()=>HanaStudio.getLearning().events.length),count);
   await clearCatch();await tap('#nextQuestion');await available('choice → choice');
   await tap('#dockHome');await tap('#resumeSession');await available('pause and resume');
   await tap('#replayLesson');await lesson();await available('lesson replay');
   await page.reload();await page.waitForFunction(()=>!document.querySelector('#startDaily').disabled&&!!NET);
   await tap('#resumeSession');await available('reload and resume');
   await choice();await clearCatch();await tap('#nextQuestion');
   await number();
   const learning=await page.evaluate(()=>HanaStudio.getLearning().events.map(e=>e.id));assert.equal(learning.length,4);
   // Same lock must also clear when changing topic through the map.
   await tap('#dockMap');await page.locator('[data-skill="p3-lines"]').tap();await lesson();await available('completed number → map → new topic');
   await choice();assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.done),true);
   assert.equal(await page.evaluate(()=>HanaStudio.getLearning().events.length),5);
   assert.ok((await page.evaluate(()=>HanaStudio.getLearning().events.map(e=>e.id))).slice(0,4).every((id,i)=>id===learning[i]));
   assert.equal(await page.evaluate(()=>localStorage.getItem('hq_caught').split(',').includes('133')),true);
   assert.deepEqual(errors,[]);
   console.log(`PASS ${method}: Next/map transitions, touch choices, retries/hints, lesson replay, resume/reload, completed locking, no duplicate rewards, progress preserved`);
   await context.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
