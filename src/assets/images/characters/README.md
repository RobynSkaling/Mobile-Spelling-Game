# Character Art Assets

Each character gets its own folder here, named with a lowercase kebab-case **slug** that matches
its `id` in [`src/data/characters/character-roster.ts`](../../../data/characters/character-roster.ts).
That file is the single source of truth for which characters exist — this folder just holds their
artwork.

## Folder layout

```
src/assets/images/characters/
  mama-bear/
  professor-owl/
  silly-goose/
  cheeky-monkey/
```

Adding a new character is two steps: add an entry to `character-roster.ts`, and add a folder here
with the same slug. No other restructuring needed — that's the "scalable" part.

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

More variants can be added later by simply dropping in another `<slug>-<variant>.png` file — no
folder restructuring needed. When new PNGs land, wire them up in
`src/data/characters/character-roster.ts` (see the `TODO` there); nothing currently `require()`s
these files since no artwork exists yet.

## Format guidance

- PNG with a transparent background.
- Export `@2x` / `@3x` variants alongside the base file if you want crisp rendering on
  high-density phone screens — React Native / Expo picks these up automatically
  (e.g. `mama-bear-idle.png`, `mama-bear-idle@2x.png`, `mama-bear-idle@3x.png`).
- Keep files reasonably compressed — this is a local-first, offline-playable app, so every
  character image ships inside the app bundle rather than being fetched over the network.

## Known naming gap to resolve

The character sheet doc ([`docs/mama-bears-spelling-bee-character-sheet.md`](../../../../docs/mama-bears-spelling-bee-character-sheet.md))
currently describes this character as **"Professor Puffin"**, not "Professor Owl." The folder here
uses `professor-owl` per the current direction from the team. Please reconcile the character sheet
doc (rename it, or confirm the swap) so the lore and the asset naming stay in sync.
