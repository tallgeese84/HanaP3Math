/* Synthetic browser regression: earned progress stays put while review adapts. */
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
  await context.addInitScript(()=>{
   localStorage.setItem('hq_sound','off');localStorage.setItem('hq_tts','off');
   if(localStorage.getItem('earned-fixture'))return;localStorage.setItem('earned-fixture','yes');
   const at=Date.now()-3*86400000,events=[];
   for(const skill of ['p3-place','p3-patterns'])for(let i=0;i<3;i++)events.push({id:skill+i,skill,at:at+i,tier:2,independent:true,correct:true});
   for(let i=0;i<6;i++)events.push({id:'needs-review-'+i,skill:'p3-place',at:at+10+i,tier:1,independent:false,hints:1,correct:true});
   localStorage.setItem('hq_learning',JSON.stringify({events}));
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>HanaStudio?.ready()&&HanaPlan);
  assert.match(await page.locator('#courseTitle').textContent(),/Unit 2 of 16 reached/);
  assert.match(await page.locator('#courseMeta').textContent(),/5% progress earned/);
  assert.match(await page.locator('#courseFocus').textContent(),/Today’s review.*Numbers to 10/);
  assert.match(await page.locator('#courseFocus').textContent(),/2 of your last 8/);
  assert.equal(await page.locator('#hanaNightlyFocus').isVisible(),false,'redundant fallback copy is hidden');
  const original=await page.evaluate(()=>({earned:HanaCourse.earnedStatus(HanaStudio.getLearning(),HanaCurriculum.skills).progressPct,queue:HanaCourse.plan(HanaStudio.getLearning(),HanaCurriculum.skills).queue}));
  assert.equal(original.queue.length,10);assert.equal(original.queue[0],'p3-place');
  if(process.env.EARNED_SCREENSHOT)await page.screenshot({path:process.env.EARNED_SCREENSHOT,fullPage:true});
  // Current review remains available with help; earned credit does not shrink.
  await page.locator('#startCourse').click();assert.equal(await page.locator('#scr-quiz').isVisible(),true);
  await page.locator('#hintButton').click();assert.equal(await page.locator('#helpBox').isVisible(),true);
  const spec=await page.evaluate(()=>HanaStudio.getSession().current.spec);
  if(spec.kind==='choice')await page.locator('#pad button').nth(spec.choices.findIndex(c=>c.v===spec.ans)).click();
  else{await page.locator('#typedAnswer').fill(String(spec.ans));await page.locator('#answerForm button').click();}
  await page.waitForFunction(()=>document.getElementById('catch').style.display!=='flex');
  assert.equal(await page.evaluate(()=>HanaStudio.getLearning().events.at(-1).independent),false);
  assert.equal(await page.evaluate(()=>HanaCourse.earnedStatus(HanaStudio.getLearning(),HanaCurriculum.skills).progressPct),original.earned);
  await page.locator('#dockHome').click();
  // An unfinished saved lesson labels the task actually resumed, not the base course focus.
  await page.evaluate(()=>HanaStudio.start('focus','p3-wppartwhole'));
  const currentId=await page.evaluate(()=>HanaStudio.getSession().current.id);
  await page.locator('#dockHome').click();assert.match(await page.locator('#courseFocus').textContent(),/Continue.*Part-whole/);
  assert.equal(await page.locator('#startCourse').textContent(),'Continue session →');
  await page.reload();await page.waitForFunction(()=>HanaStudio?.ready()&&HanaPlan);
  assert.match(await page.locator('#courseTitle').textContent(),/Unit 2 of 16 reached/);
  assert.match(await page.locator('#courseFocus').textContent(),/Continue.*Part-whole/);
  await page.locator('#startCourse').click();assert.equal(await page.locator('#scr-lesson').isVisible(),true);
  assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.id),currentId);
  await page.locator('#dockHome').click();
  // Older cloud snapshots cannot erase milestones, and the private report separates metrics.
  await page.evaluate(async()=>HanaStudio.mergeLearning({events:[]}));
  const report=await page.evaluate(()=>HanaReview.build(HanaStudio.getLearning(),HanaCurriculum.skills,{timeZone:'America/Chicago'}));
  assert.equal(report.appVersion,'h26');assert.equal(report.learning.course.earnedCurrent,'u2');assert.equal(report.learning.course.current,'u1');
  assert.equal(report.learning.course.earnedProgressPct,original.earned);assert.ok(report.learning.courseEarned['p3-place']);
  // Checkpoint continuation takes precedence over the unfinished practice session.
  await page.evaluate(()=>HanaPlan.openPaper(HanaPapers.build('cp1',HanaCurriculum.skills)));await page.locator('#paperLater').click();
  assert.equal(await page.locator('#startCourse').textContent(),'Continue checkpoint →');
  assert.match(await page.locator('#courseFocus').textContent(),/Continue your checkpoint/);
  await page.locator('#startCourse').click();assert.equal(await page.locator('#scr-paper').isVisible(),true);await page.locator('#paperLater').click();
  // Restore retains only the earned ledger; the rest of the learning history is replaced as before.
  await page.evaluate(()=>window.grownupGate.unlock(3600000));await page.locator('#dockMore').click();await page.locator('#openFamilySettings').click();
  const older={hq_learning:JSON.stringify({events:[{id:'backup-answer',skill:'p3-addsub',at:1,tier:1,independent:true}]}),hq_session:'null'};
  await page.locator('#ppIn').fill('HQP1.'+Buffer.from(JSON.stringify(older)).toString('base64'));await page.locator('#ppRestore').click();
  await page.waitForFunction(()=>HanaStudio.getLearning().events.length===1);
  assert.equal(await page.evaluate(()=>HanaStudio.getLearning().events[0].id),'backup-answer');
  assert.equal(await page.evaluate(()=>HanaCourse.earnedStatus(HanaStudio.getLearning(),HanaCurriculum.skills).progressPct),original.earned);
  await page.locator('#ppClose').click();
  for(const width of [320,390,800]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  assert.deepEqual(errors,[]);await context.close();
  // A received nightly plan previews the real first question without adoption.
  const Core=require('../nightly-priority-core.js'),now=Date.now(),today=Core.day(now),plan={schema:1,id:'synthetic-hana-'+today,revision:1,student:'Hana',timeZone:'America/Chicago',reviewedDate:Core.day(now-86400000),sessionDate:today,generatedAt:new Date(now-1000).toISOString(),sourceExportedAt:new Date(now-3600000).toISOString(),subjects:{maths:{focus:'Try a changed number problem.',skills:['p3-place']}}};
  const nightly=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Chicago'});
  await nightly.addInitScript(()=>{localStorage.setItem('hq_sound','off');localStorage.setItem('hq_tts','off');localStorage.setItem('hq_review_mirror_v1',JSON.stringify({url:'https://script.google.com/macros/s/SYNTHETIC_H25_BROWSER/exec',secret:'synthetic-browser-secret-long-enough'}));localStorage.setItem('hq_learning',JSON.stringify({events:[0,1,2].map(i=>({id:'nightly-fixture-'+i,skill:'p3-place',at:Date.now()-1000+i,tier:2,independent:true,correct:true}))}));});
  const np=await nightly.newPage();await np.route('https://script.google.com/**',route=>{const body=JSON.parse(route.request().postData());return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body.action?{ok:true,service:'family-learning-mirror',planApi:1,student:'Hana',plan}:{ok:true,latest:'hana-learning-latest.json'})});});
  await np.goto(`http://127.0.0.1:${server.address().port}/`);await np.waitForFunction(()=>HanaStudio?.ready()&&HanaNightly?.report().received);
  assert.equal(await np.evaluate(()=>HanaCourse.plan(HanaStudio.getLearning(),HanaCurriculum.skills).focus),'p3-patterns');
  assert.match(await np.locator('#courseFocus').textContent(),/Numbers to 10/);
  assert.equal(await np.evaluate(()=>HanaNightly.report().active),null);assert.equal(await np.evaluate(()=>HanaNightly.report().received.adoptedAt),null);
  await np.locator('#startCourse').click();assert.equal(await np.evaluate(()=>HanaStudio.getSession().current.spec.skill),'p3-place');assert.ok(await np.evaluate(()=>HanaNightly.report().active.adoptedAt));
  await nightly.close();
  console.log('PASS: historical earned frontier, current review and help, incremental recent evidence, reload/older cloud merge, actual saved-task continuation, checkpoint precedence, read-only nightly first-question preview, versioned report, old-backup restore semantics, mobile layout.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
