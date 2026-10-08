# Hana learning review (h15)

Open **More → Hana’s progress & next steps**. The report separates independent work, supported work, guesses, shown solutions, familiar questions, and drawing tasks needing adult review. Today and both seven-day windows use the device's displayed timezone. Counts span different skills and difficulty levels; a rising aggregate percentage is not proof of improvement.

The JSON download contains completed questions, submitted attempts, lesson-check history, optional confidence/reflections, thinking notes and drawings, skill evidence and next-step reasons. Upload it in the family learning-review chat to discuss specific changes. CSV is a simpler answer log. Neither download contains Firebase connection codes, voice data or mirror credentials. Use the existing family backup for a full game restore.

Older question history is retained. Missing responses/confidence/time are unknown, not reconstructed. At most 5,000 completed questions and 2,000 lesson checks are retained; each question stores up to 30 submissions. Unfinished work is still resumable in the app but is not included in the review. Active minutes estimate visible, recently active practice (idle threshold 60 seconds); time never changes difficulty.

## How adaptation works

- Three independent answers at the attempted level raise the next level. Two supported answers, two errors on one question, or a shown solution can lower it. Hints, retries, replayed lessons, guesses and exact questions seen in the preceding 24 hours do not earn independent evidence.
- Daily sessions prioritise repairs, due reviews and unexplored skills. A struggling skill can prompt two foundation questions from its same-year prerequisite. Explicitly chosen focus sessions keep that focus.
- New skills begin with a lesson and a separate check. Repeated struggle prompts a recap. Optional difficulty reflections describe Hana's experience and do not diagnose a misconception.
- After independent practice, authored application problems are available for 20 skills (see `HanaCoach.transferSkills` for the live count). Other skills continue standard practice and recall. Applications use changed contexts or a reversed step; they are not a validated transfer assessment.
- A later recall question needs at least 24 hours since the last recorded exposure to that skill, including a viewed but unfinished lesson. It comes before a reminder. Opening the lesson marks the answer supported. Normal review due dates are 1 day after supported work, 2 after independent work, and 7 after a skill meets the conservative remembered-later criteria.
- “Remembered later” requires at least six recent questions, five independent successes in the last eight, independent work on different days, an independent delayed recall, varied problem forms or an independent application, and at least three independent level-2-or-higher answers. This is an app heuristic, not an MOE grade or a placement decision.
- Adult review remains necessary for drawings and free-text reasoning. No paid AI service or automatic grading of written reasoning is used.

## Private family Drive mirror (h16)

Owner source inspection on 2026-10-08 confirms a separate Hana relay project,
but Hana's saved device endpoint still needs checking. The shared family relay
1.2.0 is now live as Google Version 5. If Hana uses her standalone relay, follow
[the standalone setup](../tools/HANA_STANDALONE_NIGHTLY_SETUP.md) for its h20
nightly-plan addition and keep its saved connection and daily snapshots. A
previously unconfigured device can use the existing family connection below.

The mirror is a reporting copy; existing Firebase family sync remains authoritative. Sync the family devices before taking a combined review. Hana's relay rejects older snapshots but does not merge simultaneous unsynced devices. Jonah's session merge and Euna's backup format are unchanged.

### Reuse Euna and Jonah's connection

1. Upgrade the **existing family Apps Script project** with `tools/family-drive-mirror.gs`. Read its live code first and retain any custom changes. Keep `MIRROR_SECRET`, `MIRROR_FOLDER_ID`, optional `JONAH_FOLDER_ID`, permissions and the existing deployment URL unchanged.
2. Choose **Deploy → Manage deployments → Edit → New version → Deploy** on that existing deployment. Its public health response must list `Hana learning` alongside `Mochi learning` and `PokéMath learning`. GET never returns learning records.
3. On Hana's usual device, open **More → Hana’s progress & next steps → Optional private Drive mirror → Use family connection**. This copies Euna's saved connection, or Jonah's if Euna's is unavailable, from the same browser. It does not save or upload until **Save & send review** is selected. If neither is saved in this browser, paste the URL and secret from their parent settings.
4. Choose **Save & send review**. Verify `hana-learning-latest.json` in the existing private mirror folder. Build h22 shows immediate sending feedback and reads the relay acknowledgement. “Drive confirmed: review saved” means the relay accepted the upload. A rejected secret or uncertain delivery gets a separate message; an uncertain response is not automatically resent. Keep the actual Drive file check and `receivedAt` timestamp as the first-connection verification.

The family relay keeps separate `euna-mochi`, `jonah-pokemath` and `hana-learning` filenames plus a refreshed weekly snapshot for each child. Optional `HANA_FOLDER_ID` sends Hana's files to a separate private folder. No new folder or Google authorization is normally required when upgrading an already-authorized family deployment with the same scopes.

Credentials remain in the configured browser and are excluded from learning exports and family backups. Never commit secrets to GitHub or paste them into a chat. Sharing the relay does not automatically connect every device. The connection-copy button works only where the other app's settings are already saved on the same GitHub Pages origin; separate browser profiles and installed-app storage can differ.

### Existing separate Hana relay

The original `tools/hana-drive-mirror.gs` remains compatible for families who have already configured it. It keeps daily UTC snapshots. A separate relay is optional, not required. To switch, copy the family connection and save it after the family relay has been upgraded. Old private Drive files are left intact.

Learning updates and family merges schedule a mirror request after 12 seconds, when configured. Offline learning stays local; reconnecting attempts a new snapshot. A fast close before sending may delay the mirror until the next app visit. Disconnecting stops future sends from that device and leaves existing Drive files intact.

A mirror is not connected by publishing the app. No private owner configuration is included in this repository.
