/* Optional private, one-way analytics copy. Firebase remains family sync.
 * Uses Hana-only configuration and payload; never reads Euna's settings. */
(function(){
'use strict';
const KEY='hq_review_mirror_v1',LAST='hq_review_mirror_sent_v1',$=id=>document.getElementById(id);
let timer=null,busy=false,again=false,status='';
function config(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}}
function valid(c){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(c.url||'')&&typeof c.secret==='string'&&c.secret.length>=24;}
function showSettings(){const c=config();$('mirrorURL').value=c.url||'';$('mirrorSecret').value=c.secret||'';const at=Number(localStorage.getItem(LAST));$('mirrorStatus').textContent=status||(!valid(c)?'Not connected. Downloads work without a mirror.':at?'Last request sent '+new Date(at).toLocaleString()+'. Check the private Drive file to confirm delivery.':'Configured. No request has been sent yet.');}
async function send(reason='learning changed'){
 const c=config();if(!valid(c))return;if(busy){again=true;return;}if(!navigator.onLine){status='Offline. Saved on this device; will try the mirror when online.';showSettings();return;}
 busy=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{await fetch(c.url,{method:'POST',mode:'no-cors',credentials:'omit',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({secret:c.secret,reason,backup:HanaProgress.snapshot()}),signal:controller.signal});localStorage.setItem(LAST,String(Date.now()));status='Review request sent. The browser cannot confirm delivery; check hana-learning-latest.json in your private Drive folder.';}
 catch{status='Mirror request did not finish. Your local progress is saved. Try Save & send again when online.';}
 finally{clearTimeout(timeout);busy=false;showSettings();if(again){again=false;schedule();}}
}
function schedule(){clearTimeout(timer);if(valid(config()))timer=setTimeout(()=>send(),12000);}
$('saveMirror').onclick=()=>{const c={url:$('mirrorURL').value.trim(),secret:$('mirrorSecret').value.trim()};if(!valid(c)){$('mirrorStatus').textContent='Enter a Hana Apps Script /exec URL and a secret of at least 24 characters.';return;}try{localStorage.setItem(KEY,JSON.stringify(c));status='';send('parent request');}catch{$('mirrorStatus').textContent='Could not save settings on this device. Downloads are still available.';}};
$('clearMirror').onclick=()=>{clearTimeout(timer);localStorage.removeItem(KEY);localStorage.removeItem(LAST);status='Disconnected on this device. Existing Drive copies are unchanged.';showSettings();};
window.addEventListener('hana:learning-changed',schedule);window.addEventListener('online',schedule);
window.HanaMirror={showSettings};
Promise.resolve(window.hanaBoot).then(()=>setTimeout(schedule,1500));
})();
