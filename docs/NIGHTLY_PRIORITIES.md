# Hana nightly priorities — h20

Software integration prepared on a review branch, not deployed. Daily priority
updates are private JSON data and do not require GitHub commits or version changes.

Uses the saved `hq_review_mirror_v1` connection. POST action `readHanaNextSession`
contains only the existing body secret. For the owner's confirmed separate Hana
project, use [the standalone reader addition](../tools/HANA_STANDALONE_NIGHTLY_SETUP.md)
and `HANA_NIGHTLY_PLAN_DOC_ID` pointing to the verified private machine plan Doc.
An already-confirmed shared family relay 1.2.0 uses the same protocol, but must not
replace Hana's standalone daily-snapshot relay as a routine upgrade.
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

Pending owner approval: private plan configuration/publication, automation writes,
Google deployment. Merge/release and real tablet receipt/upload acceptance are also
pending. No live learner data was used by these tests.
