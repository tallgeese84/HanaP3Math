# Preserve Hana's existing standalone relay

The owner supplied the saved Hana-only source on 2026-10-08. It keeps daily UTC
snapshots and `LAST_EXPORT_AT`. Its upload functions exactly match the existing
`hana-drive-mirror.gs` in this repository. The owner also has an initializer in
their project; retain it unchanged. Source inspection does not establish which
version or URL a child's device currently uses.

Do not replace this project with `family-drive-mirror.gs`: that template uses
different snapshot and export-order rules. Keep both existing Google projects,
their individual secrets, folder IDs, deployment URLs and access settings.

## Small addition, after approval

1. Save a copy of the existing source and current deployment version.
2. Add `hana-nightly-reader.gs` as a NEW script file in the existing Hana project.
   It defines no `doPost`, so it does not replace the upload handler.
3. In the existing `doPost`, immediately AFTER the secret check and BEFORE
   `var b = input.backup;`, add this one line:

   ```js
   if (input.action === 'readHanaNextSession') return hanaNightlyRequest_(props, input);
   ```

   Preserve every other existing line and `initialiseHanaMirror`. Do not rerun
   the initializer, reset `LAST_EXPORT_AT`, or copy another child's connection.
4. Add only the missing Script Property `HANA_NIGHTLY_PLAN_DOC_ID`, pointing to
   the verified private **Hana — App next-session plan (JSON)** Google Doc.
   Confirm an existing value before changing it. Keep all other properties.
5. Run `checkHanaNightlyReadOnly` in the editor. This may request Google Docs
   authorization from the owner. It does not write files, properties or history.
   `planReadOk: true, planState: "empty"` is expected for a blank or `null` Doc.
   A missing latest mirror needs an ordinary device upload verified separately;
   do not reset the timestamp marker or send fabricated learning data.
6. Only after reviewing the check and approving deployment, update the existing
   web-app deployment to a new version. Preserve URL, execution identity and access.

## App and scheduler

Hana h20 already uses her saved mirror connection and the `readHanaNextSession`
action. This reader returns exactly the same validated plan envelope as family
relay 1.2.0. No app-side connection migration is needed. The h20 app release and
nightly task are separate pending steps; this source file does not schedule reviews.

After release, **More → Hana's progress & next steps → Nightly priorities →
Check plan connection** must show the expected current-day plan. An empty plan
confirms only a readable connection. Verify subsequent adoption and genuine
activity receipts in the ordinary uploaded review. No daily GitHub changes.

## Verification

`node --test tests/hana-relay-nightly.test.cjs` compares the patched source with
the original using synthetic files and records. It checks unchanged uploads,
UTC daily filenames, timestamp ordering, old daily history, lock behavior,
empty/private plan reads, child/request validation and a no-write diagnostic.
The test is included in `npm test`. No live Google project was changed.
