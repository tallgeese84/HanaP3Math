# PokéMath Quest — Hana · changelog

One line per build. The running build shows under the home-screen title and
in the grown-ups panel (☁️ → 🔎 Check build).

| Build | Date | What changed |
|-------|------------|--------------|
| h3 | 2026-08-11 | Version number centralised (`APP_VERSION` in index.html + matching sw.js cache name); changelog added. |
| h2 | 2026-08-11 | Fixed Dad's recorded voice overlapping the robot voice — the speech queue now waits for clips to finish, and clips silence the robot when they start. |
| h1 | 2026-08-11 | First Primary 3 build for Hana, adapted from PokéMath Adventure: Numbers to 10 000, Add & Subtract, Multiply & Divide, Fractions, Money, Time & Measure, Wild Catch (× tables), Pattern Race (skip counting); Hana voice pack integrated; separate app identity, storage and sync slot. |

## How to ship a fix

1. Bump `APP_VERSION` in **index.html** (h4, h5, …).
2. Set `CACHE = 'pokequest-hana-<same version>'` in **sw.js**.
3. Add a line to this table.
4. Push to the repo — installed tablets update on their next online visit,
   and you can confirm which build a tablet runs from the home screen label.
