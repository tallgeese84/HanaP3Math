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

## Optional private Drive mirror

Downloads and adaptation work immediately without setup. The mirror is a read-only reporting copy; existing Firebase family sync remains authoritative. Sync the family devices before taking a combined review. Snapshot timestamps prevent older exports overwriting newer ones, but the relay does not merge simultaneous unsynced devices.

1. In the parent's Google Drive, create a **private** folder named `Hana Learning Mirror`. Copy its folder ID.
2. Create a **new, separate** Google Apps Script project. Paste `tools/hana-drive-mirror.gs`. Do not replace or reuse Euna's relay: it accepts a different app and writes Euna's filenames.
3. In Project Settings → Script properties, set `MIRROR_FOLDER_ID` to that folder ID and `MIRROR_SECRET` to a new random secret of at least 24 characters. Do not commit either setting to GitHub or paste it into a learning-review chat.
4. Deploy as a web app executing as you, with access set to Anyone. The relay checks the body secret before accessing Drive. Keep the folder private; no public sharing is needed.
5. In Hana's progress view, open **Optional private Drive mirror**, enter the `/exec` URL and the same secret, then choose **Save & send review**. Configure only the devices intended to send reports. Credentials stay in that browser and are excluded from exports and family backups.
6. Confirm the private folder contains `hana-learning-latest.json`. The browser uses a cross-origin send and cannot inspect the relay's response; “request sent” does not confirm authentication or a successful write. The relay also keeps one refreshed snapshot per UTC day.

Learning updates and family merges schedule a mirror request after 12 seconds, when configured. Offline learning stays local; reconnecting attempts a new snapshot. A fast close before sending may delay the mirror until the next app visit. Disconnecting stops future sends from that device and leaves existing Drive files intact. Delete the deployment and copies in Drive to remove them.

A mirror is not connected by publishing the app. Its private owner configuration is intentionally absent from this repository.
