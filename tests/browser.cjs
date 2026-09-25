/* Run with Playwright installed and Chromium available:
 * npm install --no-save playwright && npx playwright install chromium
 * Optional PLAYWRIGHT_MODULE / CHROMIUM_EXECUTABLE for managed runtimes. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{
  const relative=decodeURIComponent(req.url.split('?')[0]);const file=path.join(root,relative==='/'?'index.html':relative);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end();}).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1200,height:900},locale:'en-SG',reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function clearCatch(){await page.waitForFunction(()=>document.querySelector('#catch').style.display!=='flex',{},{timeout:20000});}
 async function lesson(pass=true){
  while(await page.evaluate(()=>HanaStudio.getSession().lesson.slide<2))await page.locator('#lessonNext').click();
  const selected=await page.evaluate(pass=>{const d=HanaLessons.get(HanaStudio.getSession().lesson.skill);return d.check.options.findIndex(v=>pass?v===d.check.answer:v!==d.check.answer);},pass);
  if(await page.locator('#lessonNext').isDisabled())await page.locator('#lessonChoices button').nth(selected).click();
  await page.locator('#lessonNext').click();
 }
 async function correct(){
  await clearCatch();const spec=await page.evaluate(()=>HanaStudio.getSession().current.spec);
  if(spec.kind==='key'){await page.locator('#typedAnswer').fill(spec.money?(spec.ans/100).toFixed(2):String(spec.ans));await page.locator('#answerForm button').click();}
  else{const i=spec.choices.findIndex(x=>x.v===spec.ans);await page.locator('#pad button').nth(i).click();}
  await page.waitForFunction(()=>HanaStudio.getSession().current.done);
 }
 try{
  // Existing family progress must survive installation and new evidence must start honestly.
  await context.addInitScript(()=>{if(!localStorage.getItem('fixture')){localStorage.setItem('hq_stars','21');localStorage.setItem('hq_caught','25,133');localStorage.setItem('hq_pbuddy','133');localStorage.setItem('hq_prog',JSON.stringify({num:70}));localStorage.setItem('hq_vwho','mum');localStorage.setItem('hq_tts','off');localStorage.setItem('fixture','yes');}});
  await page.goto(url);await page.waitForFunction(()=>!document.querySelector('#startDaily').disabled);
  await page.waitForFunction(()=>!!voicePack&&!!NET);
  assert.equal(await page.locator('#starCount').innerText(),'21');
  assert.match(await page.locator('#teamTally').innerText(),/2\/1025/);
  assert.match(await page.locator('#homeProgress').innerText(),/0 of 17/);
  await page.screenshot({path:path.join(root,'docs/preview-desktop.png'),fullPage:true});
  await page.locator('#startDaily').click();
  assert.equal(await page.locator('#scr-lesson').isVisible(),true);
  assert.equal(await page.evaluate(()=>HanaStudio.getLearning().events.length),0);
  assert.equal(await page.locator('#listenLesson').isDisabled(),true,'TTS Off remains respected');
  await page.locator('#lessonNext').click();
  await page.setViewportSize({width:1200,height:1100});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(root,'docs/preview-lesson.png'),fullPage:true});await page.setViewportSize({width:1200,height:900});
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#startDaily').disabled);await page.locator('#resumeSession').click();
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().lesson.slide),1,'worked-example slide survives reload');
  await lesson();
  assert.equal(await page.evaluate(()=>HanaStudio.getLearning().lessons['p3-place'].passed),true);
  assert.equal(await page.evaluate(()=>HanaStudio.getLearning().events.length),0,'learning check is not practice evidence');
  await page.locator('#typedAnswer').fill('99999');await page.locator('#answerForm button').click();
  await page.locator('#hintButton').click();await correct();
  let events=await page.evaluate(()=>HanaStudio.getLearning().events);
  assert.equal(events.length,1);assert.equal(events[0].tries,1);assert.equal(events[0].hints,1);assert.equal(events[0].independent,false);
  await page.locator('#nextQuestion').click();
  // Modal work and a partly entered answer survive switching panels and a full reload.
  const before=await page.evaluate(()=>HanaStudio.getSession().current.id);
  await page.locator('#dockThink').click();await page.locator('#workingText').fill('I will draw equal groups.');await page.locator('[data-stage="solve"]').click();await page.locator('#workingText').fill('Then calculate.');await page.locator('#thinkDialog [data-close]').click();
  await page.locator('#dockMap').click();await page.locator('#mapDialog [data-close]').click();
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.id),before);
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#startDaily').disabled);await page.locator('#resumeSession').click();
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.id),before);
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.notes.understand),'I will draw equal groups.');
  // Numeric keyboard/keypad/stylus changes preserve recognised entry.
  await page.locator('#typedAnswer').fill('12');await page.locator('#useKeypad').click();assert.equal(await page.evaluate(()=>q.entry),'12');
  await page.locator('#useWriting').click();assert.equal(await page.evaluate(()=>q.entry),'12');
  await page.locator('#useKeyboard').click();assert.equal(await page.locator('#typedAnswer').inputValue(),'12');
  // All six questions can be completed; a done question cannot award twice.
  for(let i=1;i<6;i++){await correct();await page.evaluate(()=>HanaStudio.answer(true,null));await clearCatch();await page.locator('#nextQuestion').click();}
  assert.equal(await page.locator('#scr-summary').isVisible(),true);
  events=await page.evaluate(()=>HanaStudio.getLearning().events);assert.equal(events.length,6);assert.equal(events.filter(e=>e.independent).length,5);
  assert.ok(events.every(e=>e.year===3));assert.deepEqual(events.map(e=>e.tier),[1,1,1,1,2,2],'level increases within the session');
  await page.locator('#summaryHome').click();await page.locator('#scr-home [data-year="4"]').click();await page.locator('#dockMap').click();
  assert.equal(await page.locator('[data-skill="p3-time"]').count(),0);await page.locator('[data-skill="p4-piecharts"]').click();await lesson();
  await page.setViewportSize({width:800,height:1100});await page.screenshot({path:path.join(root,'docs/preview-tablet.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#dockThink').click();await page.locator('#workingText').fill('Half the children choose reading.');await page.locator('#thinkDialog [data-close]').click();
  // Real WAV decoding: both voice selections still play with robot speech off.
  for(const who of ['dad','mum']){
   const result=await page.evaluate(async who=>{stopAllAudio();soundOn=true;voiceOn=true;ttsMode='off';voiceWho=who;await audio().resume();const duration=await playVoice('first');return {duration,key:voiceLastKey.first};},who);
   assert.ok(result.duration>0);assert.ok(result.key.endsWith('::'+who));
  }
  await page.locator('#soundBtn').click();assert.equal(await page.evaluate(()=>voiceBusy()),false);
  await page.locator('#soundBtn').click();await page.evaluate(()=>{voiceOn=true;voiceWho='mum';});
  // Core is installed without hundreds of external artwork requests; sibling caches survive.
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;await caches.open('mochi-do-not-delete');});
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>!!voicePack&&!!NET&&!document.querySelector('#startDaily').disabled);
  await page.locator('#resumeSession').click();assert.match(await page.locator('#topicHeading').innerText(),/pie/i);
  const offline=await page.evaluate(async()=>{await audio().resume();return {duration:await playVoice('hint'),sibling:(await caches.keys()).includes('mochi-do-not-delete')};});
  assert.ok(offline.duration>0);assert.equal(offline.sibling,true);
  await context.setOffline(false);
  // Backup includes new learning history and the unfinished question.
  await page.locator('#dockMore').click();await page.locator('#openFamilySettings').click();
  const backup=await page.locator('#ppCode').inputValue(),decoded=JSON.parse(Buffer.from(backup.slice(5),'base64').toString());
  assert.ok(decoded.hq_learning);assert.ok(decoded.hq_session);assert.equal(JSON.parse(decoded.hq_learning).events.length,6);assert.ok(JSON.parse(decoded.hq_learning).lessons['p3-place']);
  await page.locator('#ppClose').click();
  // Focused practice at level two: a missed learning check selects a smaller step.
  await page.evaluate(async()=>{
   const events=[0,1,2].map(i=>({id:'seed-'+i,skill:'p4-dimension',tier:1,at:100+i,independent:true}));
   await HanaStudio.mergeLearning({events});HanaStudio.start('focus','p4-dimension');
  });
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.spec.tier),2);
  await lesson(false);assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.spec.tier),1);
  await page.locator('#typedAnswer').fill('123');
  const draft=await page.evaluate(()=>HanaStudio.getSession().current.id);
  await page.locator('#replayLesson').click();await lesson();
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.id),draft);
  assert.equal(await page.locator('#typedAnswer').inputValue(),'123');
  await correct();assert.equal(await page.evaluate(()=>HanaStudio.getLearning().events.at(-1).independent),false);
  await clearCatch();await page.locator('#nextQuestion').click();
  await page.locator('#hintButton').click();await correct();await clearCatch();await page.locator('#nextQuestion').click();
  assert.equal(await page.locator('#scr-lesson').isVisible(),true,'two supported questions trigger a recap');
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().lesson.reason),'reteach');
  await lesson();assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.spec.tier),1);assert.equal(await page.locator('#typedAnswer').inputValue(),'','a recap must not copy the previous question’s answer into a new question');
  // Every lesson page renders without horizontal overflow at phone width.
  for(const skill of await page.evaluate(()=>HanaCurriculum.skills)){
   await page.evaluate(skill=>{document.querySelector('#scr-home [data-year="'+skill.year+'"]').click();HanaStudio.start('focus',skill.id);},skill);
   assert.equal(await page.evaluate(()=>HanaStudio.getSession().lesson.skill),skill.id);
   for(let step=0;step<3;step++){
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,skill.id+' lesson '+step);
    if(step<2)await page.locator('#lessonNext').click();
   }
  }
  // Exercise the real read-aloud queue with a speech adapter (headless Chromium has no OS voices).
  await page.evaluate(()=>{
   stopAllAudio();soundOn=true;ttsMode='facts';renderSoundButton();window.spoken=[];
   window.originalSpeak=speechSynthesis.speak.bind(speechSynthesis);
   speechSynthesis.speak=utterance=>{window.spoken.push(utterance.text);utterance.onend?.();};
  });
  await page.locator('#listenLesson').click();assert.match(await page.evaluate(()=>window.spoken[0]),/reflection|squares/i);
  await page.locator('#soundBtn').click();assert.equal(await page.locator('#listenLesson').isDisabled(),true);
  await page.evaluate(()=>{speechSynthesis.speak=window.originalSpeak;});
  assert.deepEqual(errors,[]);console.log('PASS: 43 lessons at phone width, lesson reload/resume/checks, missed-check scaffolding, within-session adaptation, reteaching, supported replays with saved drafts, legacy progress/rewards, notes/input switching, year boundaries, both family voices, read-aloud queue/mute, offline shell/audio and backup.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
