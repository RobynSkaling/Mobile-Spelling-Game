# Sound Effects (SFX)

Short, one-off sound effects tied to specific gameplay events. Not character-scoped, so this
folder is flat.

## File naming convention

Name files after the gameplay event that triggers them:

```
effects/
  letter-catch.mp3
  letter-miss.mp3
  pot-reject.mp3
  word-complete.mp3
  celebration-confetti.mp3
  button-tap.mp3
```

## Format guidance

- Compressed format (`.mp3`) or `.wav` for the shortest/most latency-sensitive taps (button
  presses, letter catches) where a few extra milliseconds of decode delay would feel laggy.
- Keep clips very short (under ~1 second for most; a couple seconds for celebration/fanfare-style
  effects).
- Aim for satisfying, distinct sounds per the spec doc — "a pop, swish, or buzz when I succeed" —
  and make sure success and failure sounds are clearly distinguishable from each other by ear
  alone, since a child may not always be looking at the screen at the exact moment.

Nothing currently `require()`s files from this folder. When effects land, add a small registry
(e.g. `src/data/audio/sound-effects.ts`) following the same pattern as
`src/data/characters/character-roster.ts` — a typed list of effect ids, with the actual
`require()` wiring added once files exist.
