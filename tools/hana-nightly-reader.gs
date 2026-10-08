/* Hana standalone relay nightly reader 1.0.0.
 * Add this as a separate .gs file to the EXISTING Hana project, after approval.
 * In its existing doPost, immediately after the existing secret check, insert:
 *   if (input.action === 'readHanaNextSession') return hanaNightlyRequest_(props, input);
 * Keep every other line, including initialiseHanaMirror, unchanged.
 * Add only HANA_NIGHTLY_PLAN_DOC_ID for the private Hana machine-plan Google Doc.
 * No setup, upload, property mutation, sharing change or deployment is performed here.
 */
function hanaNightlyJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function hanaNightlyRequest_(props, input) {
  var envelope={service:'family-learning-mirror',planApi:1,student:'Hana'};
  var secret=String(props.getProperty('MIRROR_SECRET')||'');
  if(!secret||secret.length<24||!input||input.secret!==secret||input.action!=='readHanaNextSession'||
     Object.keys(input).some(function(k){return k!=='action'&&k!=='secret';})) {
    return hanaNightlyJson_(Object.assign(envelope,{ok:false,error:'Invalid or unauthorized plan request.'}));
  }
  return hanaNightlyJson_(Object.assign(envelope,hanaNightlyRead_(props)));
}
function hanaNightlyRead_(props) {
  try {
    var id=String(props.getProperty('HANA_NIGHTLY_PLAN_DOC_ID')||'');
    if(!id)throw Error('Missing plan setting');
    var file=DriveApp.getFileById(id);
    if(file.isTrashed()||file.getMimeType()!==MimeType.GOOGLE_DOCS||file.getSharingAccess()!==DriveApp.Access.PRIVATE)throw Error('Unavailable');
    var text=DocumentApp.openById(id).getBody().getText().trim();
    if(text.length>20000)throw Error('Oversized');
    var plan=text?JSON.parse(text):null;
    if(plan!==null)hanaNightlyValidate_(plan);
    return {ok:true,plan:plan};
  }catch(_){return {ok:false,error:'Private Hana plan is unavailable or invalid.'};}
}
function hanaNightlyValidate_(p) {
  function exact(o,keys){return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(function(k){return keys.indexOf(k)>=0;});}
  function date(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
  function time(s){return typeof s==='string'&&/^\d{4}-\d\d-\d\dT.*Z$/.test(s)&&Number.isFinite(Date.parse(s));}
  if(!exact(p,['schema','id','revision','student','timeZone','reviewedDate','sessionDate','generatedAt','sourceExportedAt','subjects'])||
     p.schema!==1||p.student!=='Hana'||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(p.id)||
     !Number.isInteger(p.revision)||p.revision<1||p.revision>10000||p.timeZone!=='America/Chicago'||
     !date(p.reviewedDate)||!date(p.sessionDate)||p.sessionDate<=p.reviewedDate||Date.parse(p.sessionDate)-Date.parse(p.reviewedDate)>3*86400000||
     !time(p.generatedAt)||!time(p.sourceExportedAt)||Date.parse(p.sourceExportedAt)>Date.parse(p.generatedAt)||Date.parse(p.generatedAt)-Date.parse(p.sourceExportedAt)>3*86400000||
     !exact(p.subjects,['maths']))throw Error('Invalid priority plan');
  var m=p.subjects.maths;
  if(!exact(m,['focus','skills'])||typeof m.focus!=='string'||!m.focus.length||m.focus.length>160||/[<>\u0000-\u001f]/.test(m.focus)||
     !Array.isArray(m.skills)||m.skills.length<1||m.skills.length>3||new Set(m.skills).size!==m.skills.length||
     !m.skills.every(function(v){return typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);}))throw Error('Invalid maths priorities');
}
/* Owner/editor-only diagnostic. Reads saved code/configuration; never tests the
 * deployed URL and never logs secrets, private IDs, answers or learner records. */
function checkHanaNightlyReadOnly() {
  var props=PropertiesService.getScriptProperties(),answer=hanaNightlyRead_(props);
  var out={readerVersion:'1.0.0',check:'saved-source-only',deploymentVerified:false,
    planConfigured:!!props.getProperty('HANA_NIGHTLY_PLAN_DOC_ID'),planReadOk:answer.ok,
    planState:answer.ok?(answer.plan?'available':'empty'):'unavailable',
    uploadMarkerPresent:!!props.getProperty('LAST_EXPORT_AT')};
  if(answer.ok&&answer.plan){out.sessionDate=answer.plan.sessionDate;out.revision=answer.plan.revision;}
  try {
    var files=DriveApp.getFolderById(props.getProperty('MIRROR_FOLDER_ID')).getFilesByName('hana-learning-latest.json');
    if(!files.hasNext())out.upload='No latest mirror in configured folder; verify normal device upload.';
    else {
      var b=JSON.parse(files.next().getBlob().getDataAsString());
      out.upload=b&&b.app==='Hana learning'&&b.schemaVersion===1&&b.learning&&Array.isArray(b.learning.events)&&Number.isFinite(b.exportedAt)?
        'Existing Hana mirror readable; format recognised.':'Existing mirror has unexpected format.';
      if(files.hasNext())out.upload='Duplicate latest filenames; inspect before deployment.';
    }
  }catch(_){out.upload='Check failed; inspect existing folder setting and access.';}
  console.log(JSON.stringify(out,null,2));
  return out;
}
