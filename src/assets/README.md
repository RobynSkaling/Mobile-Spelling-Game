# Game Assets

All bundled media for the game lives here, under four categories. Every file in here ships
inside the app bundle — this is a local-first, offline-playable app, so nothing here is fetched
over the network at runtime.

```
src/assets/
  artwork/    — character art (PNGs)
  audio/      — character voice lines (pre-recorded clips)
  music/      — background music tracks
  effects/    — short sound effects (SFX) for gameplay events
```

| Category | What goes here | Convention doc |
|---|---|---|
| [`artwork/`](./artwork/characters/README.md) | Character PNGs — poses/expressions per character | `artwork/characters/README.md` |
| [`audio/`](./audio/characters/README.md) | Pre-recorded character voice lines | `audio/characters/README.md` |
| [`music/`](./music/README.md) | Background music tracks | `music/README.md` |
| [`effects/`](./effects/README.md) | Short one-off sound effects | `effects/README.md` |

`artwork/` and `audio/` both organize by character in a `characters/<slug>/` subfolder, where
`<slug>` matches a character's `id` in
[`src/data/characters/character-roster.ts`](../data/characters/character-roster.ts) — that file
is the single source of truth for which characters exist. `music/` and `effects/` aren't
character-scoped, so they sit flat.

Note: **voice lines here are pre-recorded audio clips** for character personality moments
(greetings, taunts, defeat reactions). They're a different thing from the app's on-device
**text-to-speech** (`src/shared/lib/speech/`), which dynamically speaks whatever word or praise
phrase is needed at runtime. TTS doesn't need assets; these folders are for the moments where a
real recorded voice adds more character than TTS can.
