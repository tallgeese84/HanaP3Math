/* Optional private, one-way analytics copy. Firebase remains family sync.
 * A parent can explicitly copy a saved family connection. Other apps are never changed. */
(function(){
'use strict';
const KEY='hq_review_mirror_v1',LAST='hq_review_mirror_sent_v1',DRAFT_URL='hana_mirror_url_draft_v1',$=id=>document.getElementById(id);
let timer=null,busy=false,again=false,status='',settingsLoaded=false;
function config(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}}
function valid(c){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(c.url||'')&&typeof c.secret==='string'&&c.secret.length>=24;}
// Keep only the unfinished URL in this tab across reloads. A new secret stays
// in the input until the parent explicitly saves the complete connection.
function rememberURL(){try{sessionStorage.setItem(DRAFT_URL,$('mirrorURL').value);}catch{}}
function clearDraft(){try{sessionStorage.removeItem(DRAFT_URL);}catch{}}
function useFamilyConnection(){
 try{
  const euna={url:localStorage.getItem('mochi_drive_mirror_url_v1')||'',secret:localStorage.getItem('mochi_drive_mirror_secret_v1')||''};
  let jonah={};try{jonah=JSON.parse(localStorage.getItem('pokemath_drive_mirror_v1')||'{}')||{};}catch{}
  const c=valid(euna)?euna:valid(jonah)?jonah:null;
  if(!c){$('mirrorStatus').textContent='No family connection is saved in this browser. Copy the URL and secret from Euna’s or Jonah’s parent settings, or open their connected app in this same browser first.';return;}
  $('mirrorURL').value=c.url;$('mirrorSecret').value=c.secret;rememberURL();
  $('mirrorStatus').textContent='Family connection copied. The family relay must support Hana. Choose Save & send review to connect this device.';
 }catch{$('mirrorStatus').textContent='Could not read saved family settings. You can paste the URL and secret below.';}
}
function showSettings(){
 const c=config();
 // Progress refreshes and upload callbacks must never overwrite edits.
 if(!settingsLoaded){
  let url=c.url||'';try{const draft=sessionStorage.getItem(DRAFT_URL);if(draft!==null)url=draft;}catch{}
  $('mirrorURL').value=url;$('mirrorSecret').value=c.secret||'';settingsLoaded=true;
 }
 const editing=$('mirrorURL').value!==(c.url||'')||$('mirrorSecret').value!==(c.secret||''),at=Number(localStorage.getItem(LAST));
 $('mirrorStatus').textContent=editing?'Connection details not saved. Choose Save & send review when both fields are ready.':status||(!valid(c)?'Not connected. Downloads work without a mirror.':at?'Last request sent '+new Date(at).toLocaleString()+'. Check the private Drive file to confirm delivery.':'Configured. No request has been sent yet.');
}
async function send(reason='learning changed'){
 const c=config();if(!valid(c))return;if(busy){again=true;return;}if(!navigator.onLine){status='Offline. Saved on this device; will try the mirror when online.';showSettings();return;}
 busy=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{await fetch(c.url,{method:'POST',mode:'no-cors',credentials:'omit',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({secret:c.secret,reason,backup:HanaProgress.snapshot()}),signal:controller.signal});localStorage.setItem(LAST,String(Date.now()));status='Review request sent. The browser cannot confirm delivery; check hana-learning-latest.json in your private Drive folder.';}
 catch{status='Mirror request did not finish. Your local progress is saved. Try Save & send again when online.';}
 finally{clearTimeout(timeout);busy=false;showSettings();if(again){again=false;schedule();}}
}
function schedule(){clearTimeout(timer);if(valid(config()))timer=setTimeout(()=>send(),12000);}
$('mirrorURL').oninput=()=>{rememberURL();showSettings();};
$('mirrorSecret').oninput=showSettings;
$('saveMirror').onclick=()=>{const c={url:$('mirrorURL').value.trim(),secret:$('mirrorSecret').value.trim()};if(!valid(c)){$('mirrorStatus').textContent='Enter a Hana Apps Script /exec URL and a secret of at least 24 characters.';return;}try{localStorage.setItem(KEY,JSON.stringify(c));clearDraft();$('mirrorURL').value=c.url;$('mirrorSecret').value=c.secret;status='';window.dispatchEvent(new Event('hana:mirror-settings'));send('parent request');}catch{$('mirrorStatus').textContent='Could not save settings on this device. Downloads are still available.';}};
$('reuseFamilyMirror').onclick=useFamilyConnection;
$('clearMirror').onclick=()=>{clearTimeout(timer);localStorage.removeItem(KEY);localStorage.removeItem(LAST);clearDraft();settingsLoaded=false;window.dispatchEvent(new Event('hana:mirror-settings'));status='Disconnected on this device. Existing Drive copies are unchanged.';showSettings();};
window.addEventListener('hana:learning-changed',schedule);window.addEventListener('online',schedule);
window.HanaMirror={showSettings};
showSettings();
Promise.resolve(window.hanaBoot).then(()=>setTimeout(schedule,1500));
})();
