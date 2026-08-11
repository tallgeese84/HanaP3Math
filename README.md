# PokéMath Quest — Hana (Primary 3)

A personal maths practice game for Hana, pitched at the Singapore MOE
Primary 3 (2021) syllabus, wrapped in the same catch-them-all game as her
brother's PokéMath Adventure — but a fully separate app with its own
progress, its own cloud-sync slot, and its own install icon.

**Topics** (each levels up on its own as answers become quick and first-try):

- Numbers to 10 000 — place value, compare/order, patterns, odd/even, number words
- Add & Subtract — up to 4-digit, with regrouping and missing-number questions
- Multiply & Divide — tables 2–10 (focus 6–9), up to 3-digit × 1-digit, remainders
- Fractions — shading, equivalent, simplest form, comparing, adding/subtracting related fractions
- Money — dollars & cents, adding/subtracting, making change (Singapore dollars)
- Time & Measure — clock reading to the minute, duration, km/m/cm · kg/g · ℓ/mℓ conversions
- Decimals — tenths to thousandths, compare, round, fraction↔decimal, + − × ÷ (P4)
- Shapes & Angles — perimeter & area (incl. composite figures), angle types and degrees, symmetry, nets (P4)
- Graphs & Data — tables, bar graphs and line graphs (P3–P4)
- Wild Catch — quick-fire times tables · Pattern Race — skip counting vs Meowth

Levels 1–3 cover Primary 3; Level 4 in every topic carries the full
Primary 4 syllabus, so the app spans P3 through P4 end to end.

**Handwritten answers.** Number questions show a writing pad: Hana writes
the answer with the stylus and a small neural network (`digit-net.json`,
trained on 150 000 handwritten digits including Singapore school-form
shapes, running fully offline) reads her digits. The keypad is still there
— toggle on the quiz screen or in the grown-ups panel.

**Hana's voice pack.** `hana-voice.json` holds Dad's recorded clips.
The app plays them at the matching moments: *hello* on opening, *first* for
first-try answers, *recover* for a comeback, *retry* after a wrong answer,
*hint* with hints, *streak* on hot streaks, *sky* for catches and race wins,
*bye* when leaving. Robot voice (TTS) reads the questions and math facts,
and steps in if a clip is missing. The grown-ups panel (triple-tap the
title, or ☁️) has an on/off switch and test buttons for every category.

Pokémon names and artwork are © Nintendo / Game Freak / The Pokémon Company.
Artwork is loaded at runtime from [PokeAPI](https://pokeapi.co) sprite hosting
and is not included in this repository. Personal, non-commercial project.

## Hosting on GitHub Pages
1. Create a **new** repository (separate from PokéMath) and upload the contents
   of this folder (index.html at the root, including `hana-voice.json`).
2. Repo Settings → Pages → Source: `main` branch, `/ (root)` → Save.
3. Your app is at `https://<username>.github.io/<repo>/` after a minute or two.

## Installing on the tablet
1. Open the URL in Safari (iPad) or Chrome (Android) **with internet on** —
   the first visit downloads and caches everything, including the voice pack
   and the Pokémon pictures.
2. Safari: Share → **Add to Home Screen**. Chrome: menu → **Add to Home screen** / **Install app**.
3. From then on it launches from its own icon and works fully offline.
   It can live on the same tablet as PokéMath Adventure without touching
   Jonah's stars or Pokémon.

## Cloud sync
The grown-ups panel accepts the same Firebase database URL and family code as
the other family apps; Hana's progress is stored under its own
`pokequest-hana` slot so nothing collides.

## Shipping updates
Every fix gets a version number (h1, h2, h3, …). To ship one:
1. Bump `APP_VERSION` in `index.html`.
2. Set `CACHE = 'pokequest-hana-<same version>'` in `sw.js` so installed
   tablets pick up the new files.
3. Add a line to `CHANGELOG.md` saying what changed.

The running build shows under the home-screen title (e.g. "build h3") and in
the grown-ups panel via 🔎 Check build — so you can always tell whether a
tablet has updated yet.
