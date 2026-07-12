# Character Artwork

Each character gets its own folder here, named with a lowercase kebab-case **slug** that matches
its `id` in [`src/data/characters/character-roster.ts`](../../../data/characters/character-roster.ts).

## Folder layout

```
src/assets/artwork/characters/
  mama-bear/
  professor-owl/
  silly-goose/
  cheeky-monkey/
```

Adding a new character is two steps: add an entry to `character-roster.ts`, and add a folder here
with the same slug. No other restructuring needed.

## File naming convention

Inside each character's folder, name files `<character-slug>-<variant>.png`, for example:

```
mama-bear/
  mama-bear-idle.png
  mama-bear-happy.png
  mama-bear-icon.png
```

## Starting variant set

| Variant | Used for | Applies to |
|---|---|---|
| `idle` | Default/neutral pose — wherever the character just needs to be present (e.g. a host greeting) | Everyone |
| `happy` | Celebratory/proud expression — success and reward moments | Everyone |
| `icon` | Small square version for compact UI (badges, future profile pickers) | Everyone |
| `defeated` | Comic-fail pose for the moment the child answers correctly and the villain's mischief is foiled (Silly Goose bundled off by the Bee Police, Cheeky Monkey sliding away on a banana peel — see the character sheet doc) | Villains only |

The exact expected set per character is enumerated in `character-roster.ts` (`variants` field) —
that's the source of truth, not this table.

More variants can be added later by simply dropping in another `<slug>-<variant>.png` file — no
folder restructuring needed. When new PNGs land, wire them up in
`src/data/characters/character-images.ts`; nothing currently `require()`s these files since no
artwork exists yet.

## Format guidance

- PNG with a transparent background.
- Export `@2x` / `@3x` variants alongside the base file if you want crisp rendering on
  high-density phone screens — React Native / Expo picks these up automatically
  (e.g. `mama-bear-idle.png`, `mama-bear-idle@2x.png`, `mama-bear-idle@3x.png`).
- Keep files reasonably compressed — this is a local-first, offline-playable app, so every
  character image ships inside the app bundle rather than being fetched over the network.

## Sprite sheet convention (animated states)

Animated characters use a **separate** `sprites/` subfolder inside each character's folder, so
static poses (above) and animated sprite sheets never collide:

```
src/assets/artwork/characters/
  mama-bear/
    mama-bear-idle.png              (static pose, as above)
    sprites/
      mama-bear-idle-sheet.png
      mama-bear-idle.json
      mama-bear-celebrating-sheet.png
      mama-bear-celebrating.json
```

Each animated state gets two files, `<character-slug>-<state-slug>-sheet.png` and a companion
`<character-slug>-<state-slug>.json`:

- **`-sheet.png`**: a single horizontal strip — every frame the same size, laid out left to
  right, transparent background. Multi-row sheets aren't supported yet (see
  `src/data/characters/character-animations.ts`).
- **`.json`**: a handoff spec for engineering, not something the app loads at runtime — when a
  sheet is wired up, its `frameCount`/`frameWidth`/`frameHeight`/`fps`/`loop` fields are
  hand-transcribed into a `SpriteSheetAnimation` entry in `character-animations.ts`, the same way
  `character-images.ts` entries are hand-filled one `require()` at a time. Example:

  ```json
  {
    "frameCount": 6,
    "frameWidth": 96,
    "frameHeight": 96,
    "fps": 12,
    "loop": false
  }
  ```

State names in filenames are kebab-case versions of `CharacterAnimationState`
(`src/data/characters/character-roster.ts`): `idle`, `talking`, `poked`, `celebrating`,
`defeated`, `being-naughty`, `challenging`.

### Animation state guidance

| State | Loop? | Suggested frames | Suggested fps | Applies to |
|---|---|---|---|---|
| `idle` | loop | 4–8 | 6–10 | Everyone |
| `talking` | loop | 4–6 | 8–10 | Everyone |
| `poked` | one-shot | 4–6 | 12 | Everyone |
| `celebrating` | one-shot | 6–10 | 12–15 | Everyone |
| `defeated` | one-shot | 5–8 | 10–12 | Villains only |
| `being-naughty` | loop | 4–6 | 8 | Villains only |
| `challenging` | one-shot | 5–8 | 10 | Villains only |

These are starting points, not hard requirements — the exact expected set per character is
enumerated in `character-roster.ts` (`animationStates` field); that's the source of truth, not
this table. Keep reactive animations short: architecture doc Section 25.7 asks for roughly half a
second to a couple of seconds so animation never blocks gameplay.

### Sprite sheet sizing

Match `frameWidth`/`frameHeight` to how large the character actually renders on screen — oversized
textures cost memory and load time for no visual benefit (architecture doc Section 25.8).
`<Character>`'s size presets (`src/shared/ui/Character.tsx`) are a good target:

| `relativeSize` | Target frame dimensions |
|---|---|
| `small` | ~56×56 |
| `medium` | ~96×96 |
| `large` | ~152×152 |

Export at those dimensions (or a clean multiple, e.g. 2x, for crisper scaling) rather than a much
larger source sheet — the same "keep it compressed, it all ships in the app bundle" guidance from
Format guidance above applies here too.

## Naming note

The character sheet doc (in the private planning-docs repo) previously described this character as
"Professor Puffin." That's been resolved — the character sheet doc now says "Professor Owl"
throughout, matching the `professor-owl` folder/roster id used here.
