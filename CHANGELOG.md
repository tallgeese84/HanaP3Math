# PokéMath Quest — Hana · changelog

One line per build. The running build shows under the home-screen title and
in the grown-ups panel (☁️ → 🔎 Check build).

| Build | Date | What changed |
|-------|------------|--------------|
| h11 | 2026-08-11 | Full Primary 4 syllabus: three new tiles — Decimals (place value to thousandths, compare/round/convert, + − × ÷), Shapes & Angles (perimeter/area incl. composite figures, angle types & degrees, symmetry, nets) and Graphs & Data (tables, bar graphs, line graphs) — each with 4 levels. Common factors/multiples and 3-digit × 2-digit added to existing modes. Writing pad and keypad accept decimal answers. |
| h10 | 2026-08-11 | Handwritten answers! Number questions now show a writing pad — Hana writes the answer with the stylus and an offline digit-recognition network (98.3% on 10k-image test set; tuned on school-form digits) reads it. Undo/Clear/OK controls, decimal point support for money, keypad still available (toggle on the quiz screen or in the grown-ups panel). |
| h9 | 2026-08-11 | Harder! Level 4 "P4 bridge" in every topic (numbers to 100 000, rounding, factors/multiples, 2-digit × 2-digit, mixed numbers, fraction-of-a-set, money multiply, 24-hour time). Wild Catch: 7 holes, several Pokémon up at once, near-miss decoys, no free answer on the first pop. Streak fixed: resets at target, 3 completions raise it by 3 (12→15→…→30). 4-digit numbers now written closed up (1396, not 1 396). |
| h8 | 2026-08-11 | Voice-pack updates no longer stuck behind the offline cache (fixes Mum not being heard after h7). Robot voice now configurable: All / Answers only (new default — questions aren't auto-read) / Off. |
| h7 | 2026-08-11 | Voice pack now has Mum AND Dad (62 clips, re-cleaned: high-pass, silence-trimmed, loudness-matched). New "Who speaks" setting in the grown-ups panel: Both (random mix) / Dad / Mum. |
| h6 | 2026-08-11 | Grown-ups (☁️) panel is now scrollable — it had grown taller than the screen and the top/bottom were cut off with no way to scroll. |
| h5 | 2026-08-11 | Hana's avatar (from the Starwing artwork) cut out from its background and added to the home screen beside her Pokémon buddy; cached offline. |
| h4 | 2026-08-11 | Hana's own app icon added (gold sparkle Pokéball, icon-192/512.png) so the two apps look different on the tablet. |
| h3 | 2026-08-11 | Version number centralised (`APP_VERSION` in index.html + matching sw.js cache name); changelog added. |
| h2 | 2026-08-11 | Fixed Dad's recorded voice overlapping the robot voice — the speech queue now waits for clips to finish, and clips silence the robot when they start. |
| h1 | 2026-08-11 | First Primary 3 build for Hana, adapted from PokéMath Adventure: Numbers to 10 000, Add & Subtract, Multiply & Divide, Fractions, Money, Time & Measure, Wild Catch (× tables), Pattern Race (skip counting); Hana voice pack integrated; separate app identity, storage and sync slot. |

## How to ship a fix

1. Bump `APP_VERSION` in **index.html** (h4, h5, …).
2. Set `CACHE = 'pokequest-hana-<same version>'` in **sw.js**.
3. Add a line to this table.
4. Push to the repo — installed tablets update on their next online visit,
   and you can confirm which build a tablet runs from the home screen label.
