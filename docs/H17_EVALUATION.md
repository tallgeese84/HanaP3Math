# Review of Claude’s h17 update

Reviewed baseline: `9727111`, 2 October 2026. Follow-up release: h18.

The update is a useful improvement: it adds an explicit P3-to-P4 sequence, a target-date plan, eleven word-problem families with bar models, typed fractions/units/remainders/time, and mixed-topic checkpoints. The running app registers 54 skills: 23 P3 and 31 P4. All 43 existing Node tests passed, as did the complete DOM learning/checkpoint flow after installing its previously undeclared `jsdom` dependency. The 62 Mum/Dad audio clips are byte-for-byte unchanged.

| Finding | Effect | h18 change |
| --- | --- | --- |
| Old checkpoint mistakes remained after a successful retake | Unnecessary repair recommendations | Use the latest reassessment of each skill within a checkpoint; retain untested or still-missed skills |
| Private review omitted course participation and checkpoint drawings | Parent analysis lost context and working | Preserve these fields, solutions and imported question references in the existing review payload |
| Minimum schedule scale overran short target dates | Planned units could finish after the requested target | Scale all units into the available time, preserving the consolidation period |
| Checkpoint money accepted a third decimal and rounded it | An incorrect answer could receive full points | Require at most two decimal places for money, matching practice |
| School format claims were too uniform | Generated marks/times could be mistaken for school grading | Label answer-check points and suggested practice times; explain that method marks need adult review |
| Test dependency was not declared | A clean checkout could not run the DOM flow | Add locked development dependencies and a standalone exam integration test |

The lessons remain brief introductions, worked examples and checks, not classroom-length lectures. Adaptation uses transparent heuristics; passing tests does not establish educational effectiveness or certify P4 readiness. Construction and written reasoning still need an adult.

## Supplied examination papers

The connected folder held 15 distinct P3/P4 papers and one duplicate. The private packs contain all 253 original pages, including diagrams and keys, and 60 individually verified questions with worked explanations (16 P3, 44 P4). The 60 questions span numbers, operations, fractions, decimals, time, area/dimensions and word problems. They are a selected practice bank, not a complete digitisation of every question.

Selected question pages were inspected visually and answers independently recomputed. One supplied answer-key discrepancy is documented in its private pack. Original key pages remain unchanged. Multiple-choice items in the verified bank use typed answers; required diagram information is included in the self-contained wording. No question that depends on an omitted diagram is auto-graded.

Pack data is excluded from this public repository. Imported content is stored locally in a separate IndexedDB and must be imported once per device. Learning responses and source references use the existing progress/Drive reporting path. Pack images are excluded from that path. Original-page reading creates no mastery evidence.

## Validation

- 49 Node tests, including validation, level/year isolation, repeat prevention, corrected retake repairs, report privacy, schedule boundaries and money precision.
- Full existing DOM flow: lesson, course session, typed-fraction feedback, checkpoint completion and parent plan.
- New DOM/IndexedDB flow: valid and invalid imports, answer-key visibility, wrong/right attempts, support attribution, report provenance, no immediate item repetition and reload persistence. All three real private packs imported successfully through the app handler.
- All 60 imported expected answers pass the app checker. All page images decode successfully.
- Local Chromium browser suites could not be rerun because the browser download returned an invalid archive. DOM tests do not establish layout quality or audible playback on Hana’s tablet.

The review did not find a Hana learning JSON in the connected Drive search, so it evaluates the software and content, not Hana’s measured learning progress.
