/* Optional private, one-way analytics copy. Firebase remains family sync.
 * A parent can explicitly copy a saved family connection. Other apps are never changed. */
(function(){
'use strict';
const KEY='hq_review_mirror_v1',LAST='hq_review_mirror_sent_v1',DRAFT_URL='hana_mirror_url_draft_v1',$=id=>document.getElementById(id);
let timer=null,busy=false,again=false,status='',fieldError='',settingsLoaded=false,connectionVersion=0;
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
  $('mirrorURL').value=c.url;$('mirrorSecret').value=c.secret;fieldError='';rememberURL();
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
 $('mirrorStatus').textContent=fieldError||(editing?'Connection details not saved. Choose Save & send review when both fields are ready.':status||(!valid(c)?'Not connected. Downloads work without a mirror.':at?'Last request sent '+new Date(at).toLocaleString()+'. Choose Save & send review for a fresh delivery check.':'Configured. No request has been sent yet.'));
 $('saveMirror').disabled=busy;$('saveMirror').textContent=busy?'Sending…':'Save & send review';
}
function receipt(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid reply');
 const family=body.ok===true&&body.latest==='hana-learning-latest.json',standalone=body.ok===undefined;
 if((family||standalone)&&body.status==='older snapshot skipped')return {confirmed:true,message:'Drive confirmed: the same or a newer review is already saved. Your local progress is safe.'};
 if((family&&!body.status)||(standalone&&body.status==='saved'))return {confirmed:true,message:'Drive confirmed: review saved at '+new Date().toLocaleTimeString()+'.'};
 if(body.status==='unauthorized'||(body.ok===false&&/unauthori[sz]ed/i.test(String(body.error||''))))return {confirmed:false,message:'Settings saved, but the mirror secret was rejected. Check the existing family mirror secret and try again.'};
 if(body.ok===false||(standalone&&typeof body.status==='string'))return {confirmed:false,message:'Settings saved, but the relay rejected the review. Check the relay configuration. Your local progress is safe.'};
 throw Error('Unrecognised reply');
}
async function send(reason='learning changed'){
 const c=config();if(!valid(c))return;if(busy){again=true;return;}if(!navigator.onLine){status='Offline. Saved on this device; will try the mirror when online.';showSettings();return;}
 busy=true;status='Settings saved. Sending review to your private Drive…';showSettings();
 const version=connectionVersion,current=()=>{const saved=config();return version===connectionVersion&&saved.url===c.url&&saved.secret===c.secret;};
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  // Same upload payload and one POST; read its acknowledgement, never resend
  // blindly if a network/CORS failure makes the write outcome uncertain.
  const response=await fetch(c.url,{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({secret:c.secret,reason,backup:HanaProgress.snapshot()}),signal:controller.signal});
  if(!response.ok||response.type==='opaque')throw Error('Unreadable reply');
  const text=await response.text();if(text.length>12000)throw Error('Oversized reply');
  const result=receipt(JSON.parse(text));if(!current())return;
  status=result.message;if(result.confirmed){try{localStorage.setItem(LAST,String(Date.now()));}catch{}}
 }
 catch{if(current())status='Settings saved. Delivery not confirmed. Check plan connection below, then try again if needed. Your local progress is safe.';}
 finally{clearTimeout(timeout);busy=false;showSettings();if(again){again=false;schedule();}}
}
function schedule(){clearTimeout(timer);if(valid(config()))timer=setTimeout(()=>send(),12000);}
$('mirrorURL').oninput=()=>{fieldError='';rememberURL();showSettings();};
$('mirrorSecret').oninput=()=>{fieldError='';showSettings();};
$('saveMirror').onclick=()=>{const c={url:$('mirrorURL').value.trim(),secret:$('mirrorSecret').value.trim()};if(!valid(c)){fieldError=!valid({url:c.url,secret:'x'.repeat(24)})?'URL is invalid. Paste the full Apps Script address ending in /exec.':'Mirror secret must contain at least 24 characters. Copy the existing family mirror secret.';showSettings();return;}try{localStorage.setItem(KEY,JSON.stringify(c));connectionVersion++;clearDraft();$('mirrorURL').value=c.url;$('mirrorSecret').value=c.secret;fieldError='';status='Settings saved.';showSettings();window.dispatchEvent(new Event('hana:mirror-settings'));send('parent request');}catch{fieldError='Could not save settings on this device. Downloads are still available.';showSettings();}};
$('reuseFamilyMirror').onclick=useFamilyConnection;
$('clearMirror').onclick=()=>{clearTimeout(timer);connectionVersion++;again=false;localStorage.removeItem(KEY);localStorage.removeItem(LAST);clearDraft();settingsLoaded=false;fieldError='';window.dispatchEvent(new Event('hana:mirror-settings'));status='Disconnected on this device. Existing Drive copies are unchanged.';showSettings();};
window.addEventListener('hana:learning-changed',schedule);window.addEventListener('online',schedule);
window.HanaMirror={showSettings};
showSettings();
Promise.resolve(window.hanaBoot).then(()=>setTimeout(schedule,1500));
})();
