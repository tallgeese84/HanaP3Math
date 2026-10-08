/* Real browser regression for answer controls across question/input transitions.
 * Fixtures only set an ordinary saved diagnostic session; clicks/taps use the UI. */
// h17: typed answers use #partsForm.
async function fillParts(page,spec){const e=spec.expect,v=spec.layout==='units'?{a:e.a,b:e.b}:spec.layout==='remainder'?{q:e.q,r:e.r}:spec.layout==='clock'?{h:e.h,m:e.m}:(()=>{const w=Math.floor(e.N/e.D),r=e.N%e.D;return r?{w:w||'',n:r,d:e.D}:{w};})();for(const [k,x] of Object.entries(v))await page.locator(`#partsFields [data-part="${k}"]`).fill(String(x));await page.locator('#partsForm button').click();}
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
  const context=await browser.newContext({viewport:{width:800,height:1100},hasTouch:true,timezoneId:'America/Chicago',reducedMotion:'reduce'});
  await context.addInitScript(()=>{if(!localStorage.getItem('fixture')){localStorage.setItem('fixture','yes');localStorage.setItem('hq_sound','off');localStorage.setItem('hq_tts','off');localStorage.setItem('hq_caught','25,133');}});
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR:',e.message);});page.setDefaultTimeout(15000);
  await context.route('https://script.google.com/**',route=>{const body=JSON.parse(route.request().postData());if(!body.action)requests.push(body);return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body.action?{ok:true,service:'family-learning-mirror',planApi:1,student:'Hana',plan:null}:{ok:true,latest:'hana-learning-latest.json'})});});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>!document.querySelector('#startDaily').disabled);
  const clear=()=>page.waitForFunction(()=>document.querySelector('#catch').style.display!=='flex',{},{timeout:20000});
  async function correct(){const s=await page.evaluate(()=>HanaStudio.getSession().current.spec);if(s.kind==='key'){await page.locator('#useKeyboard').click();await page.locator('#typedAnswer').fill(s.money?(s.ans/100).toFixed(2):String(s.ans));await page.locator('#answerForm button').click();}else if(s.kind==='parts')await fillParts(page,s);else await page.locator('#pad button').nth(s.choices.findIndex(v=>v.v===s.ans)).click();await clear();}
  async function lesson(){await page.locator('#lessonNext').click();await page.locator('#lessonNext').click();const i=await page.evaluate(()=>{const l=HanaLessons.get(HanaStudio.getSession().lesson.skill);return l.check.options.indexOf(l.check.answer);});await page.locator('#lessonChoices button').nth(i).click();await page.locator('#lessonNext').click();}
  async function report(){await page.locator('#dockMore').click();await page.locator('#openProgress').click();}
  await page.locator('#startCheckin').click();await page.locator('[data-confidence="guess"]').click();await correct();
  let e=await page.evaluate(()=>HanaStudio.getLearning().events.at(-1));assert.equal(e.independent,false);assert.equal(e.confidence,'guess');assert.equal(e.attempts.length,1);assert.equal(e.attempts[0].response,e.answer);assert.equal(e.attempts[0].correct,true);
  
  // A wrong numeric response is retained even after recovery, and confidence freezes on submission.
  await page.evaluate(()=>HanaStudio.start('focus','p3-place'));await lesson();
  const wrong=await page.evaluate(()=>HanaStudio.getSession().current.spec.ans*10);await page.locator('[data-confidence="sure"]').click();
  await page.locator('#typedAnswer').fill(String(wrong));await page.locator('#answerForm button').click();assert.match(await page.locator('#quizSpeech').innerText(),/place/);assert.equal(await page.locator('[data-confidence="guess"]').isDisabled(),true);
  await page.locator('[data-obstacle="method"]').click();await page.locator('#dockThink').click();await page.locator('#workingText').fill('I looked at the place of the digit.');await page.locator('#thinkDialog [data-close]').click();
  
  // Retry feedback, confidence and attempts survive a reload before completing the question.
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#startDaily').disabled);await page.locator('#resumeSession').click();assert.match(await page.locator('#quizSpeech').innerText(),/place/);await correct();
  e=await page.evaluate(()=>HanaStudio.getLearning().events.at(-1));assert.equal(e.attempts.length,2);assert.equal(e.attempts[0].response,wrong);assert.equal(e.attempts[0].feedback,'place-value');assert.equal(e.attempts[1].correct,true);assert.equal(e.obstacle,'method');assert.equal(e.notes.understand,'I looked at the place of the digit.');assert.equal(e.independent,false);
  await report();assert.match(await page.locator('#progressBody').innerText(),/America\/Chicago/);assert.match(await page.locator('#progressBody').innerText(),/1 guessed/);assert.match(await page.locator('#mirrorStatus').textContent(),/Not connected/);assert.equal(requests.length,0,'mirror sends nothing without opt-in configuration');
  const downloadPromise=page.waitForEvent('download');await page.locator('#downloadReview').click();const dl=await downloadPromise,backup=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));assert.equal(backup.app,'Hana learning');assert.equal(backup.learning.events.length,2);assert.equal(backup.learning.events.at(-1).attempts[0].response,wrong);assert.equal(backup.learning.checks.length,1);
  for(const width of [390,800]){await page.setViewportSize({width,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  await page.evaluate(()=>document.querySelector('#progressDialog').scrollTop=0);await page.screenshot({path:path.join(root,'docs/preview-progress.png'),fullPage:true});
  
  // Review credential stays outside the reusable learning payload. Cross-origin status is honest.
  await page.locator('#mirrorSettings summary').click();await page.locator('#mirrorURL').fill('https://script.google.com/macros/s/HANA_TEST_ONLY/exec');await page.locator('#mirrorSecret').fill('test-secret-that-never-leaves-this-test');await page.locator('#saveMirror').click();await page.waitForFunction(()=>document.querySelector('#mirrorStatus').textContent.includes('Drive confirmed: review saved'));
  assert.equal(requests.length,1);assert.equal(requests[0].backup.app,'Hana learning');assert.ok(!JSON.stringify(requests[0].backup).includes('test-secret'));assert.ok(!JSON.stringify(requests[0].backup).includes('HANA_TEST_ONLY'));await page.locator('#clearMirror').click();await page.locator('#closeProgress').click();
  
  // A real delayed recall opens directly on the question, before any lesson.
  await page.evaluate(async()=>{const now=Date.now();await HanaStudio.mergeLearning({events:[0,1,2].map(i=>({id:'recall-'+i,skill:'p4-dimension',year:4,tier:1,at:now-3*86400000+i,independent:true,correct:true}))});document.querySelector('[data-year="4"]').click();HanaStudio.start('focus','p4-dimension');});
  assert.equal(await page.locator('#scr-quiz').isVisible(),true);assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.phase),'recall');await correct();e=await page.evaluate(()=>HanaStudio.getLearning().events.at(-1));assert.equal(e.independent,true);assert.ok(e.reviewGapMs>=86400000);assert.equal(e.phase,'recall');assert.equal(await page.evaluate(()=>HanaLearning.evidence(HanaStudio.getLearning(),'p4-dimension').delayed),1);
  
  // A fresh same-day skill with enough independent evidence gets an authored application.
  await page.evaluate(async()=>{const now=Date.now();await HanaStudio.mergeLearning({events:[0,1,2].map(i=>({id:'apply-'+i,skill:'p4-round',year:4,tier:1,at:now-100+i,independent:true,correct:true}))});HanaStudio.start('focus','p4-round');});await lesson();assert.equal(await page.evaluate(()=>HanaStudio.getSession().current.phase),'transfer');await correct();assert.equal(await page.evaluate(()=>HanaLearning.evidence(HanaStudio.getLearning(),'p4-round').transfer),1);
  
  // Two supported questions repair an in-year prerequisite inside a daily session.
  await page.locator('#dockHome').click();await page.evaluate(async()=>{document.querySelector('[data-year="3"]').click();await HanaStudio.mergeLearning({});const spec=HanaCurriculum.generate('p3-muldiv',2);await store.set('hq_session',JSON.stringify({id:'repair-session',year:3,kind:'daily',queue:Array(6).fill('p3-muldiv'),index:0,results:[],phase:'practice',taught:{'p3-muldiv':true},current:{id:'repair-first',spec,tries:0,hints:0,entry:'',done:false,revealed:false,started:Date.now(),elapsed:0,notes:{},strokes:[],answerStrokes:[]}}));await HanaStudio.reload();});
  await page.locator('#resumeSession').click();await page.locator('#hintButton').click();await correct();await page.locator('#nextQuestion').click();await page.locator('#hintButton').click();await correct();assert.deepEqual(await page.evaluate(()=>HanaStudio.getSession().queue.slice(2,4)),['p3-tables','p3-tables']);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS: confidence/guess evidence, exact submitted answers, retry feedback, saved working and resume, timezone report/export, private opt-in mirror contract, delayed recall before lessons, authored applications, daily prerequisite repair.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
