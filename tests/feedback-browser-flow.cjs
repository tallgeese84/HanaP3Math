'use strict';
// Synthetic isolated profile. No family accounts, credentials or real learner history.
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).on('error',()=>res.writeHead(404).end()).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Chicago',reducedMotion:'reduce'});await context.route('**/*',r=>r.request().url().startsWith(base)||r.request().url().startsWith('data:')?r.continue():r.abort());
  await context.addInitScript(()=>{localStorage.setItem('hq_sound','off');localStorage.setItem('hq_tts','off');});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.HanaStudio?.ready());
  await page.evaluate(async()=>{const at=Date.now();await HanaStudio.mergeLearning({events:Array.from({length:8},(_,i)=>({id:'synthetic-browser-'+i,skill:'p3-wppartwhole',year:3,tier:1,at:at-10000+i,independent:i===0,correct:i===0,revealed:i!==0}))});HanaStudio.start('focus','p3-wppartwhole');const s=HanaStudio.getSession();s.kind='daily';s.phase='practice';s.current.spec=HanaCurriculum.generate('p3-wppartwhole',1);s.current.phase='practice';HanaStudio.renderCurrent();});
  assert.equal(await page.locator('#wordSupport').count(),1);const signature=await page.evaluate(()=>HanaStudio.getSession().current.spec.signature);
  for(let i=0;i<3;i++){const choice=await page.evaluate(()=>{const w=HanaStudio.getSession().current.wordSupport;return w.model.steps[w.stage].answer;});await page.locator('#wordSupport button').nth(choice).click();}
  assert.match(await page.locator('#wordSupport').textContent(),/Now calculate/);
  if(process.env.FEEDBACK_SCREENSHOT)await page.screenshot({path:process.env.FEEDBACK_SCREENSHOT,fullPage:true});
  const answer=await page.evaluate(()=>HanaStudio.getSession().current.spec.ans);await page.locator('#typedAnswer').fill(String(answer));await page.locator('#answerForm button').click();
  const e=await page.evaluate(()=>HanaStudio.getLearning().events.at(-1));assert.equal(e.independent,false);assert(e.wordSupport.completed);assert.equal(e.wordSupport.checks.length,3);
  await page.evaluate(()=>{const s=HanaStudio.getSession();s.queue[s.index+1]='p3-wppartwhole';document.getElementById('nextQuestion').click();s.phase='practice';s.current.spec=HanaCurriculum.generate('p3-wppartwhole',1);s.current.phase='practice';HanaStudio.renderCurrent();});
  assert.equal(await page.locator('#wordSupport').count(),0);assert.notEqual(await page.evaluate(()=>HanaStudio.getSession().current.spec.signature),signature);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  await context.close();console.log('PASS: mobile Chromium scaffold, three observed substeps, honest supported credit, faded changed example, no layout overflow or script errors.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
