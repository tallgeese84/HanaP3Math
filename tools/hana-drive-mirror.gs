/** Optional Hana-only Google Apps Script web app. See docs/LEARNING-REVIEW.md.
 * Script Properties: MIRROR_SECRET (24+ random characters), MIRROR_FOLDER_ID.
 * Never deploy this into Euna's existing Apps Script project. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('MIRROR_SECRET');
    var input = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (!secret || secret.length < 24 || input.secret !== secret) return reply_('unauthorized');
    var b = input.backup;
    if (!b || b.app !== 'Hana learning' || b.schemaVersion !== 1 || !b.learning || !Array.isArray(b.learning.events) || !Number.isFinite(b.exportedAt) || b.exportedAt > Date.now() + 300000) return reply_('invalid Hana review');
    lock.waitLock(20000);
    var previous = Number(props.getProperty('LAST_EXPORT_AT') || 0);
    if (b.exportedAt <= previous) return reply_('older snapshot skipped');
    var folder = DriveApp.getFolderById(props.getProperty('MIRROR_FOLDER_ID'));
    var content = JSON.stringify(b, null, 2);
    write_(folder, 'hana-learning-latest.json', content);
    // One snapshot per UTC day, refreshed throughout that day; retain privately.
    write_(folder, 'hana-learning-' + new Date(b.exportedAt).toISOString().slice(0, 10) + '.json', content);
    props.setProperty('LAST_EXPORT_AT', String(b.exportedAt));
    return reply_('saved');
  } catch (err) { return reply_('not saved; check script configuration'); }
  finally { if (lock.hasLock()) lock.releaseLock(); }
}
function write_(folder, name, content) {
  var files = folder.getFilesByName(name);
  if (files.hasNext()) files.next().setContent(content);
  else folder.createFile(name, content, MimeType.PLAIN_TEXT);
}
function reply_(status) { return ContentService.createTextOutput(JSON.stringify({status: status})).setMimeType(ContentService.MimeType.JSON); }
