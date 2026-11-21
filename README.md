[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/haidildariell/gta6-cover-art-01-v9/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/haidildariell/gta6-cover-art-01-v9/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Tideline Cover Press — VELVET TIDE

An offline web app that turns any photo into GTA 6-style cover art: a
seven-panel sunset mosaic with chrome-banded lettering, exported as a PNG
to share. Built for the make.fun **gta6-cover-art-01** bounty.

## Try it

```
node serve.ts
```

Open http://localhost:8080. Pick a cast panel, replace its photo (or keep
the samples), drag the crop sliders until the face sits right, edit the
title / script / tagline / press quote, pick a grade and a layout, choose
an export size (1920×1080, 1080×1080, 1080×1350) and hit **Export PNG**.
Nothing leaves the machine: photos are read locally, fonts and samples are
shipped under `app/`.

## What makes this cover

- **One hard sunset grade on every panel.** Each photo is drawn through the
  same saturate / contrast / sepia grade plus a warm overlay wash, then the
  whole mosaic gets one unifying warm wash — no pale-daylight, blue-dusk or
  neon-night panel survives on its own.
- **Full-bleed mosaic.** Panels touch the left and right edges; the frame
  background is a warm gradient and sunset stripes sit behind the title
  zone — no dark dead space.
- **Title below the hero's chin.** The boss panel is 40% of the frame
  height and the chrome title starts below his chin, so no face is ever
  touched by the lettering and every face stays at least 60% visible.
- **Original lettering.** Quote, script subtitle and tagline are written
  for this cover (“EVERY FRAME DRIPS WITH SUNLIGHT AND SIN” — The Coral
  Bay Chronicle; “salt on the wind”; “SEVEN STRANGERS · ONE BURNING COAST
  · EVERY DEBT COMES DUE”), with a gold seal, 18+ box, billing block and
  barcode.
- **Fonts:** Anton and Pacifico under the SIL Open Font License
  (`app/fonts/`, OFL texts beside them). Sample photos were generated
  fresh for this entry with an image model — no real people, no Rockstar
  artwork, no game fonts.

## Hand in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output dir and writes
`dossier.json` with the kit's `vendor/makefun-app.ts`. Screenshots are
taken from the app's own `?shot=` scenes (see `shots.json`): the exported
cover first, then the editor with a photo loaded, then the square and
portrait covers.

## License

MIT — see `LICENSE`.
