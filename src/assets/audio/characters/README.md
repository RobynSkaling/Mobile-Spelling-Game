# Character Voice Lines

Pre-recorded audio clips for character personality moments — a real recorded voice for the
moments where it adds more character than the app's on-device text-to-speech can (see the note in
[`src/assets/README.md`](../../README.md) about how this differs from TTS).

Mirrors the `artwork/characters/` layout: one folder per character, same slug, same source of
truth (`src/data/characters/character-roster.ts`).

## Folder layout

```
src/assets/audio/characters/
  mama-bear/
  professor-owl/
  silly-goose/
  cheeky-monkey/
```

## File naming convention

Inside each character's folder, name files `<character-slug>-<variant>.mp3` (or `.wav`), for
example:

```
mama-bear/
  mama-bear-greeting.mp3
  mama-bear-praise.mp3
```

## Starting variant set

| Variant | Used for | Applies to |
|---|---|---|
| `greeting` | A short welcome/host line | Heroes |
| `praise` | A spoken line of encouragement, as an alternative or layer on top of TTS praise | Heroes |
| `taunt` | A mischievous line poking fun at the player before a challenge | Villains |
| `defeated` | A comic reaction sound/line for the moment the villain's mischief is foiled | Villains |

The exact expected set per character is enumerated in `character-roster.ts`
(`audioVariants` field) — that's the source of truth, not this table.

## Format guidance

- Prefer compressed formats (`.mp3` / `.aac`) to keep the app bundle small — every clip ships
  inside the app for offline play.
- Keep clips short (a few seconds). These are personality accents, not narration.
- Normalize loudness across clips so no character suddenly sounds much louder/quieter than another.

Nothing currently `require()`s files from this folder — see the `TODO` in
`src/data/characters/character-roster.ts` for where that wiring goes once clips land.
