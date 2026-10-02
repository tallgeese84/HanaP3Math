# h19 question bank: reasoning from the school papers

The h18 review found that many upper-level generators repeated one calculation structure. The supplied 2025 P3/P4 papers also require interpreting relationships, reversing operations, deciding what remainders mean and connecting steps. h19 adds **29 original parameterised families across 37 existing skills** to normal practice, application questions and checkpoints. No pack import is required for these generated questions.

The reference set is the 15 distinct private papers reviewed for h18. This update uses their mathematical demands, not their scan images or question wording. The 60 individually checked private questions and original paper reader remain separate.

## What becomes richer

| Area | New question structures |
| --- | --- |
| Numbers | Regrouped thousands/hundreds; digit arrangements with a zero and parity condition; missing values in calculations; reconstructing a dividend; whole-number rounding intervals; common multiples with constraints |
| P3 applications | Equal packets with leftovers; linked comparisons; repeated item costs and change; reverse unit prices; conversion followed by repacking; time with a break; area comparisons and fencing with a gate |
| Fractions | Missing fractions and ribbon parts; reconstructing the whole from a remaining part or difference; whole-pizza decisions; leftover fractional quantities; two fractions of the same whole |
| Decimals | Rounding boundaries; unit mass then rescaling; calculating before rounding; total versus difference; comparing two bills to isolate an item; before/after changes using equal units |
| Geometry/data | Joined rectangles and shared internal edges; perimeter-to-area reasoning; equal perimeter with changed dimensions; parts of a right angle; graph targets; missing entries in two-way tables |

P3 fraction operands use related denominators no greater than 12. P3/P4 remain explicitly separated. New P4 geometry uses rectangles, squares and right-angle properties; the additions do not introduce percentage, ratio notation, speed or triangle-area formulas. For current topic placement, see the [MOE syllabus index](https://www.moe.gov.sg/primary/curriculum/syllabus) and [Valour Primary's P3/P4 topic map](https://www.valourpri.moe.edu.sg/subjects/mathematics/). Construction and written methods still need a grown-up.

## Adaptive use

- Level 1 retains the existing foundation questions and mini-lessons.
- At levels 2 and 3, eligible skills draw 75% of normal generated candidates from the new families, with the existing bank retained for fluency and variety. Actual session proportions can vary because repetition avoidance and private imports also apply.
- Level 2 generally uses direct applications and linked calculations. Level 3 adds reverse conditions, constrained answers and longer reasoning. Families with no easier variant are available only at level 3.
- Application questions use the new bank at the same skill/year/level. Consecutive forms are avoided when alternatives can be found. Changing numbers alone does not count as a new mathematical form.
- Existing promotion, support, prerequisite and delayed-recall rules are retained. Hints, retries and reveals remain supported work. No old mastery or rewards are reset.

Every new question contains a hint and a worked solution. Recognisable errors receive a targeted retry prompt, such as distinguishing a leftover from the amount needed to complete a group, or excluding an internal shared edge from perimeter. These prompts are checks, not diagnoses. Families and bank version are retained in practice and checkpoint reports so later analysis can distinguish older calculation work from new reasoning work.

Essential diagrams remain visible in checkpoint Section C. Worked bar-model scaffolding is still hidden there. Answers use the existing numeric, money, decimal, fraction and clock interfaces; there is no new learner menu or import step.

## Verification and limits

The new suite checks each family, applicable skill and level over 180 deterministic seeds: arithmetic conservation, inverse substitutions, rounding boundaries, unique constrained answers and the real answer checker. It also tests mixed checkpoint grading, required diagrams, feedback, support rules and report provenance. The DOM flow submits wrong/correct numeric answers and typed fraction/time answers across all 29 families, then checks worked solutions and exported records. The original audio checksum and private-import regression tests remain required.

This broadens an authored bank; it does not reproduce an entire exam or establish measured educational effectiveness. The generator bounds and relative levels are curriculum/content judgments, not difficulty parameters fitted to a population of pupils. Hana's independent performance, later recall and supported mistakes should guide subsequent calibration. Earlier learning evidence remains intact and is not retrospectively relabelled as exam-level performance.

For Node consumers, require `exam-style.js` after `problems.js` to install the expanded bank; the shipped HTML loads them in that order. All generation is local and works offline.
