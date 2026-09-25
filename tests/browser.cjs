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
  // All six questions can be completed; a done question cannot award twice.
  for(let i=1;i<6;i++){await correct();await page.evaluate(()=>HanaStudio.answer(true,null));await clearCatch();await page.locator('#nextQuestion').click();}
  assert.equal(await page.locator('#scr-summary').isVisible(),true);
  events=await page.evaluate(()=>HanaStudio.getLearning().events);assert.equal(events.length,6);assert.equal(events.filter(e=>e.independent).length,5);
  assert.ok(events.every(e=>e.year===3));
  await page.locator('#summaryHome').click();await page.locator('#scr-home [data-year="4"]').click();await page.locator('#dockMap').click();
  assert.equal(await page.locator('[data-skill="p3-time"]').count(),0);await page.locator('[data-skill="p4-piecharts"]').click();
  await page.setViewportSize({width:800,height:1100});await page.screenshot({path:path.join(root,'docs/preview-tablet.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  // Numeric keyboard/keypad/stylus changes preserve recognised entry.
  await page.locator('#typedAnswer').fill('12');await page.locator('#useKeypad').click();assert.equal(await page.evaluate(()=>q.entry),'12');
  await page.locator('#useWriting').click();assert.equal(await page.evaluate(()=>q.entry),'12');
  await page.locator('#useKeyboard').click();assert.equal(await page.locator('#typedAnswer').inputValue(),'12');
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
  assert.ok(decoded.hq_learning);assert.ok(decoded.hq_session);assert.equal(JSON.parse(decoded.hq_learning).events.length,6);
  assert.deepEqual(errors,[]);console.log('PASS: legacy progress, six-question flow, hints/retries, no duplicate rewards, working/resume, year boundary, tablet/phone layouts, input switching, both family voices, offline shell/audio, sibling cache and backup.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
