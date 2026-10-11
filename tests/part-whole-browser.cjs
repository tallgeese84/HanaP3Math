/* Real controls verify optional help, saved recaps and unaided recall. */
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Chicago',reducedMotion:'reduce'});
  await context.addInitScript(()=>{localStorage.setItem('hq_sound','off');localStorage.setItem('hq_tts','off');});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>HanaStudio?.ready());
  const lesson=async()=>{
   await page.locator('#lessonNext').click();await page.locator('#lessonNext').click();
   const i=await page.evaluate(()=>{const l=HanaStudio.getSession().lesson,d=HanaLessons.get(l.skill,l.variant);return d.check.options.indexOf(d.check.answer);});
   assert.equal(await page.locator('#lessonFeedback').textContent(),'','no check solution before an attempt');
   await page.locator('#lessonChoices button').nth(i).click();await page.locator('#lessonNext').click();
  };
  const answer=async()=>{
   const n=await page.evaluate(()=>HanaStudio.getSession().current.spec.ans);
   await page.locator('#typedAnswer').fill(String(n));await page.locator('#answerForm button').click();
   await page.waitForFunction(()=>document.getElementById('catch').style.display!=='flex');
  };
  // The same-tier changed problem needs no extra questions or compulsory help.
  await page.evaluate(async()=>{const now=Date.now();await HanaStudio.mergeLearning({events:[true,true,true,false,false].map((independent,i)=>({id:'synthetic-part-'+i,session:'synthetic',skill:'p3-wppartwhole',year:3,tier:1,at:now-1000+i,correct:true,independent,hints:independent?0:1}))});HanaStudio.start('focus','p3-wppartwhole');});
  await lesson();assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.phase),'transfer');
  assert.equal(await page.locator('#qvis svg').count(),0);assert.equal(await page.locator('#helpBox').count(),0);
  assert.equal(await page.locator('#quizSpeech').textContent(),'');
  const first=await page.evaluate(()=>HanaStudio.getSession().current.spec.signature);
  await page.locator('#hintButton').click();assert.equal(await page.locator('#helpBox svg').count(),1);
  await answer();let e=await page.evaluate(()=>HanaStudio.getLearning().events.at(-1));
  assert.equal(e.hints,1);assert.equal(e.independent,false);assert.equal(e.phase,'transfer');
  await page.locator('#nextQuestion').click();
  if(await page.locator('#scr-lesson').isVisible())await lesson();
  assert.notEqual(await page.evaluate(()=>HanaStudio.getSession().current.spec.signature),first,'fresh question after supported work');
  assert.equal(await page.locator('#helpBox').count(),0,'previous hint does not carry onto a fresh attempt');
  const before=await page.evaluate(()=>HanaStudio.getSession().current.spec.signature);
  await page.locator('#dockHome').click();await page.locator('#resumeSession').click();
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.spec.signature),before);
  await answer();e=await page.evaluate(()=>HanaStudio.getLearning().events.at(-1));assert.equal(e.independent,true);
  await page.locator('#nextQuestion').click();
  if(await page.locator('#scr-lesson').isVisible())await lesson();
  // Replay help stays attached, while the variant and check survive a reload.
  await page.locator('#replayLesson').click();await page.locator('#lessonNext').click();await page.locator('#lessonNext').click();
  if(process.env.PART_WHOLE_SCREENSHOT)await page.screenshot({path:process.env.PART_WHOLE_SCREENSHOT,fullPage:true});
  const saved=await page.evaluate(()=>({variant:HanaStudio.getSession().lesson.variant,heading:document.getElementById('lessonHeading').textContent}));
  await page.reload();await page.waitForFunction(()=>HanaStudio?.ready());await page.locator('#resumeSession').click();
  assert.equal(await page.locator('#lessonHeading').textContent(),saved.heading);
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().lesson.variant),saved.variant);
  const i=await page.evaluate(()=>{const l=HanaStudio.getSession().lesson,d=HanaLessons.get(l.skill,l.variant);return d.check.options.indexOf(d.check.answer);});
  await page.locator('#lessonChoices button').nth(i).click();await page.locator('#lessonNext').click();await answer();
  e=await page.evaluate(()=>HanaStudio.getLearning().events.at(-1));assert.equal(e.lessonHelp,true);assert.equal(e.independent,false);
  // Existing delayed recall still comes before all reminders and optional hints.
  await page.evaluate(async()=>{const state=HanaStudio.getLearning(),at=Date.now()-3*86400000;state.events=state.events.map(e=>e.skill==='p3-wppartwhole'?{...e,at}:e);state.checks=state.checks.filter(c=>c.skill!=='p3-wppartwhole');delete state.lessons['p3-wppartwhole'];delete state.exposures['p3-wppartwhole'];HanaStudio.start('focus','p3-wppartwhole');});
  assert.equal(await page.locator('#scr-quiz').isVisible(),true);assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.phase),'recall');
  assert.equal(await page.locator('#helpBox').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS: same-tier changed part-whole, no pre-attempt solution, optional bar hint counted as support, fresh independent attempt, pause/resume, rotating lesson check saved through reload, lesson replay supported, unaided delayed recall, mobile layout.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
