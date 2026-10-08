# Hana nightly priorities — h20

Build h20 supports nightly priorities. Publishing app code and activating its
private connection/reviewer are separate steps. Daily priority updates are private
JSON data and do not require GitHub commits or version changes.

Uses the saved `hq_review_mirror_v1` connection. POST action `readHanaNextSession`
contains only the existing body secret. First inspect the connection saved on
Hana's actual device. The shared family relay 1.2.0 is now live as Google Version 5
and its Hana reader can access the private empty plan Doc. If Hana instead uses
her separate relay project, use [the standalone reader addition](../tools/HANA_STANDALONE_NIGHTLY_SETUP.md)
and `HANA_NIGHTLY_PLAN_DOC_ID` pointing to the verified private machine plan Doc.
Preserve that relay's daily snapshots and existing settings. Do not replace or
migrate a configured standalone relay merely because the shared endpoint exists.
No source code contains the real endpoint, secret, plan Doc ID or learner records.

Schema 1 (synthetic example, not a plan for Hana):
```json
{"schema":1,"id":"hana-nightly-2026-10-08","revision":1,"student":"Hana","timeZone":"America/Chicago","reviewedDate":"2026-10-07","sessionDate":"2026-10-08","generatedAt":"2026-10-08T05:10:00Z","sourceExportedAt":"2026-10-08T01:00:00Z","subjects":{"maths":{"focus":"Explore number patterns.","skills":["p3-patterns"]}}}
```
Only these keys are accepted. Choose 1–3 real nonmanual skill IDs in curriculum.js;
focus is plain text, 1–160 characters. Do not include questions, answers, levels,
scores, time goals, permissions, URLs or reward settings. Date gap is 1–3 days;
source export must cover the reviewed Chicago date and be within 72 hours of actual
generation. Fresh export alone does not prove practice occurred on the review date.
A same-date correction retains its ID and increases revision. An identical plan is
idempotent; conflicting same-revision plans and older source exports are refused.

## App behavior

The main Today's session button resumes an unfinished session/checkpoint first.
At the next new course session, the receiver adopts the latest valid plan for that
Chicago date. It replaces at most three ordinary focus slots. Scheduled review,
word problems, course locks, prerequisites, lesson teaching, adaptive difficulty,
help flags, reward calculation and total session size remain under the local app.
Completed priority questions count against the three-question daily budget across
revisions and synced devices. A priority outside the current course unlocks is
ignored; this is reported as received/adopted without claiming activity use.
Free practice and parent-selected focus/checkpoints remain explicitly chosen paths.

Fetches never rewrite an active session. Future plans wait; expired plans do not
carry forward. An unavailable relay, opaque response, invalid plan or offline
connection uses a same-date saved plan or built-in learning. Cache is separate from
learning/game state and bound to a hash of the existing endpoint and secret.
No raw credentials appear in receipts or the cache. Connection changes invalidate
old in-flight responses and make old plans unusable immediately.

`learning.nightlyPlanReview` in the existing review snapshot separates received,
adopted and started receipts. Each completed priority answer has an allowlisted
`nightlyPlan` reference (planId/revision/sessionDate). This nested receipt survives
the unchanged family relay allowlist. Started is a selected lesson/question;
completed events and assistance flags are the evidence of actual work.

## Verification

`npm test` — 113 passing tests (including 17 app protocol/priority tests and
42 standalone relay compatibility and end-to-end protocol checks).
`node tests/nightly-flow.cjs` — full DOM flow with mocked private plan, real lesson,
real answer submission, safe resume, exported receipt, and checkpoint preservation.
`node tests/jsdom-flow.cjs` — normal course, fractions, checkpoint and all 29 exam
families through the actual UI. Local synthetic profile only.
`node --test tools/family-relay-tests/family-relay.test.cjs` — 102 shared-template checks.

The owner approved the nightly review/next-day app workflow and completed the
shared Google relay setup. Euna's app has confirmed live receipt. Hana's actual
connection, ordinary progress upload, real-device plan receipt and reviewer
activation remain the stage 2 acceptance checks. No live learner data was used
by these tests. See tools/RELAY_CONNECTION_AUDIT.md for the deployment evidence.
