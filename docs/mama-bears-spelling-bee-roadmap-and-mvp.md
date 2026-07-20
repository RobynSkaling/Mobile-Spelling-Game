# Mama Bears' Spelling Bee — Roadmap and Lean MVP Backlog

## 1. Product Strategy Summary

The product should be positioned as a playful, character-led spelling adventure for children aged 5–10. The experience should feel like a fun cartoon challenge first and a spelling tool second.

The strongest opportunity is to create a product that feels tactile, humorous, and rewarding while still helping children spell better over time.

### Product Principles
- Make the child feel like they are playing a game, not doing homework.
- Keep each session short, fast, and satisfying.
- Build a strong emotional world around Mama Bear and the silly villains.
- Make parent setup simple and progress visible.
- Prioritise one great core loop over many half-finished features.

---

## 2. Product Roadmap

### Phase 1 — Foundation and Validation (Weeks 1–2)
Focus: prove the core experience works and feels fun.

#### Goals
- Create a polished first-play experience
- Validate one core gameplay mode
- Support simple word lists
- Add basic profile and progress tracking

#### Deliverables
- Child profile creation
- Home screen and simple navigation
- One primary gameplay mode
- Basic word list selection
- Simple reward feedback
- Parent basic progress view

### Phase 2 — Engagement and Retention (Weeks 3–4)
Focus: make the game more replayable and emotionally sticky.

#### Goals
- Add variety and replay value
- Improve progression and rewards
- Create more character-driven moments
- Support repeated practice without boredom

#### Deliverables
- Second gameplay mode
- Daily streaks or rewards
- More character reactions and comedy moments
- More word list categories and seasonal lists
- Better progress analytics for parents

### Phase 3 — Content and Growth (Weeks 5–8)
Focus: make the app useful for real families and schools.

#### Goals
- Support long-term use
- Make word list management practical
- Build stronger habit and mastery loops
- Improve retention across months, not just days

#### Deliverables
- Custom word list import or simple upload
- Final test mode
- Better mastery tracking
- Expanded content library and themes
- Parent controls and purchase flow readiness

### Phase 4 — Monetisation and Scale (Later)
Focus: turn the product into a sustainable family app.

#### Goals
- Support safe purchase flow
- Add premium content and expansion packs
- Prepare for wider distribution and localisation

#### Deliverables
- Store-ready purchase flow
- Premium content packs
- Optional subscriptions or expansions
- Expanded content for multiple school years

---

## 3. Lean MVP Definition

The lean MVP should be intentionally narrow and high-impact. It should prove three things:
1. Children enjoy the core gameplay loop.
2. Parents see clear value in progression and word practice.
3. The concept feels distinctive and memorable.

### MVP Scope
The MVP should include:
- One polished core gameplay mode
- A simple child profile flow
- A short list of sample words
- A basic parent dashboard
- A clear reward loop
- A simple “final test” experience

---

## 4. Lean MVP Backlog for a Single Weekend

This backlog assumes a very focused prototype or demo build, not a full production app. The goal is to ship an experience that feels real enough to test with children and parents.

### Epic 1 — Start Experience
#### User Story
As a child, I want to choose my profile and start playing quickly.

#### Tasks
- Create a simple home screen with a large “Play” button
- Add a basic profile setup screen with name and avatar choice
- Add a “Start” flow that moves into the first game
- Add a simple welcome message from Mama Bear

### Epic 2 — Core Gameplay Loop
#### User Story
As a child, I want to play one fun spelling challenge that feels active and rewarding.

#### Tasks
- Implement one primary gameplay mode: Honey Pot Flick
- Display a target word clearly on screen
- Show letter tiles or letters that can be dragged or flicked
- Validate the word as the child places letters in order
- Add immediate success and failure feedback
- Add a reward animation when the child completes the word

### Epic 3 — Word Lists
#### User Story
As a parent or child, I want to choose a small list of words to practice.

#### Tasks
- Create a small built-in list of sample words
- Add a word selection screen with large cards
- Support choosing one list and starting a round
- Add a simple “next word” flow

### Epic 4 — Progress and Motivation
#### User Story
As a child, I want to feel rewarded for practicing.

#### Tasks
- Add a simple score counter
- Add a success badge or honey jar reward after each completed round
- Add a streak counter for repeated play
- Add celebratory sound or animation

### Epic 5 — Parent View
#### User Story
As a parent, I want to see whether my child is improving.

#### Tasks
- Add a simple parent screen with basic stats
- Show completed words, correct answers, and missed words
- Display session count or recent play activity
- Keep the interface simple and uncluttered

### Epic 6 — Final Test Experience
#### User Story
As a parent, I want my child to complete a more serious challenge at the end of a session to be ready for a spelling test at school.

#### Tasks
- Add a short final test screen
- Present 3–5 words from the current list
- Show a simple pass/fail outcome
- Give a celebratory reward if the child succeeds

---

## 5. Recommended Weekend Scope

### Build this first
- Home screen
- Profile setup
- One full gameplay mode
- Sample word list selection
- Reward feedback
- Basic parent stats
- Final test flow

### Keep intentionally simple
- No multiplayer
- No full teacher portal
- No complex analytics dashboard
- No advanced content import
- No store purchase flow

This keeps the weekend build realistic and focused on validation.

---

## 6. Suggested User Stories for the Weekend Build

### Child Experience
- I want to start the game quickly.
- I want to see a word and interact with it in a fun way.
- I want to feel rewarded when I spell correctly.
- I want the game to feel silly and exciting.

### Parent Experience
- I want to understand whether my child is practicing.
- I want to see what words they are struggling with.
- I want the setup to be easy.

---

## 7. Definition of Done for the Weekend MVP

The weekend build is successful if:
- A child can launch the app and play a full round
- The gameplay feels understandable within seconds
- The game provides clear success feedback
- A parent can see basic progress data
- The app feels like a fun experience rather than a worksheet

---

## 8. Final Recommendation

The best path is to build a very small but highly polished prototype that proves the emotional hook and core interaction. The goal is not to build everything at once; it is to validate that children enjoy the experience and parents see value.

If this weekend build works, the next step should be to expand the gameplay modes and the content system in a more deliberate product phase.

---

## 9. Epic 7 — Character Asset System

Added after the original weekend backlog (Epics 1–6 above) to capture new scope: the UI design and art team is starting to produce character artwork and audio, and the codebase needs a clean, scalable place for it to land.

*Revised: the asset structure was expanded from a single `images/` folder into four top-level categories — `artwork`, `audio`, `music`, `effects` — to also cover character voice lines, background music, and gameplay sound effects, not just character art.*

*Revised: the character roster was extended with a `relativeSize`, `accentColor`, and `emoji` fallback per character, and the `require()` wiring called out in the original Steps below was built — `src/data/characters/character-images.ts` and `character-audio.ts` are now the static lookup maps (empty until real files land), and a shared `<Character>` component (`src/shared/ui/Character.tsx`) renders any character by id, using its accent-colored badge and emoji glyph until real artwork is registered for that variant. `HomeScreen` and `InstructionsScreen` were switched over from hardcoded emoji `<Text>` elements to `<Character>` as the first two call sites.*

### Objective

Give the design and art team a predictable, self-documenting home for every kind of game media (character art, character voice lines, music, sound effects), and give engineering a typed data source describing which characters exist — without hardcoding `require()` calls to files that don't exist yet, and without needing to restructure anything when new characters, poses, or sounds are added later.

### Steps

1. Create four top-level asset categories under `src/assets/`: `artwork/`, `audio/`, `music/`, `effects/`.
2. Under `artwork/` and `audio/`, organize by character in a `characters/<slug>/` subfolder — one subfolder per confirmed character, named with a lowercase kebab-case slug. `music/` and `effects/` are not character-scoped, so they stay flat.
3. Document a consistent naming convention per category (`<character-slug>-<variant>.png` for artwork, `<character-slug>-<variant>.mp3` for audio, event-named files for music/effects) and a starting variant set per character category (artwork: `idle`, `happy`, `icon`, + `defeated` for villains; audio: `greeting`, `praise` for heroes, `taunt`, `defeated` for villains) so the art team knows exactly what to deliver and engineers know exactly what to expect.
4. Add a typed character registry (`src/data/characters/character-roster.ts`) — id, display name, hero/villain role, tagline, expected artwork variants, and expected audio variants — as the single source of truth for "which characters exist," decoupled from whether the assets have actually landed yet.
5. Leave clearly marked extension points (`TODO`s in the registry, and in the `music`/`effects` READMEs) for wiring real `require()`-based lookups once files actually arrive, so adding assets later is additive, not a refactor.
6. Record this work in the roadmap (this section) so the docs stay current with what's been built.
7. Build the static `require()` lookup maps (`character-images.ts`, `character-audio.ts`) that the extension points in Step 5 called for, keyed by character id and variant, returning `null` for anything not yet registered rather than throwing.
8. Build a shared `<Character>` component that takes a character id (plus optional variant, size, and style overrides), reads the character's data from the roster, and renders its artwork if registered or its accent-colored emoji badge as a graceful fallback if not — so screens request characters "by name" instead of importing image files directly.
9. Replace the hardcoded character emoji `<Text>` elements on `HomeScreen` and `InstructionsScreen` with `<Character>` as the first proof points, confirming the fallback badges render correctly end-to-end.

### User Story

As the UI design and art team, I want a clean, scalable folder structure for character artwork, character voice lines, music, and sound effects so that new assets can be dropped in and picked up by the game without restructuring code.

### Tasks

- Create `src/assets/artwork/characters/`, `src/assets/audio/characters/`, `src/assets/music/`, and `src/assets/effects/`, with one subfolder per character under `artwork/` and `audio/`: `mama-bear/`, `professor-owl/`, `silly-goose/`, `cheeky-monkey/`
- Write a naming-convention README in each of the four categories (plus a top-level `src/assets/README.md` overview linking to all four)
- Add `src/data/characters/character-roster.ts`: a typed roster (id, name, role, tagline, relative size, accent color, emoji fallback, expected artwork variants, expected audio variants) with helper lookups (`getCharacterById`, `getCharactersByRole`), and `TODO`s marking where `require()` wiring goes once art and audio land
- Add `src/data/characters/character-images.ts` and `character-audio.ts`: static, hand-filled lookup maps from character id + variant to a `require()`d asset (empty today, filled in one line at a time as real files land), each returning `null` for unregistered lookups instead of throwing
- Add `src/shared/ui/Character.tsx`: a reusable component that renders a character by id — looking up its data and artwork through the registry rather than the caller importing an image — with a `size` preset/pixel override, a `style` prop for layout overrides, and an accent-colored emoji badge fallback when no artwork is registered for the requested variant yet
- Wire `<Character>` into `HomeScreen` (`mama-bear`) and `InstructionsScreen` (`silly-goose`, `cheeky-monkey`), replacing hardcoded emoji `<Text>` elements
- Confirm the project still type-checks and bundles cleanly with the new (currently asset-free) folders in place, and verify the fallback badges render correctly in the browser

### Known Follow-Up

~~The character sheet doc currently names this hero **"Professor Puffin"**, not **"Professor Owl"** as used here.~~ **Resolved in Epic 9**: the character sheet doc has been renamed to "Professor Owl" throughout, matching the asset folders and registry.

A data registry for `music/` and `effects/` (mirroring `character-roster.ts`) hasn't been built yet since no track/effect list exists to enumerate — add one following the same pattern once that list is known.

`character-images.ts` and `character-audio.ts` are now built and wired into `<Character>`, but every lookup map entry is still empty — no real artwork or audio has been delivered yet. As files land, add one `require()` line per variant to the relevant character's entry; no other code changes are needed since `<Character>` already falls back gracefully to the emoji badge for anything unregistered.

---

## 10. Epics 8–12 — Character Animation System

Added to turn the UI architecture decision in [Section 25 of the architecture doc](./mama-bears-spelling-bee-architecture.md#25-user-interface--character-animation-and-interactivity-architecture) (sprite sheet animation on Reanimated, event-driven character state, graceful fallback) into a concrete, orderable backlog. This is new scope beyond Epic 7: Epic 7 built the character *data and static rendering* system; these epics build *movement and reaction* on top of it.

### Gap Analysis — Architecture (Section 25) vs. Current Code

A source-level audit against the current `main` branch found:

- **No animation data model exists.** `CharacterDefinition` (`src/data/characters/character-roster.ts`) has no animation fields, and there is no `character-animations.ts` sibling to `character-images.ts`/`character-audio.ts`. No `CharacterAnimationState` type exists anywhere in the codebase.
- **`<Character>` cannot animate.** `src/shared/ui/Character.tsx` renders exactly one static `<Image>` or one static emoji `<Text>` per render — no `Animated.View`, no reanimated hooks, no frame-stepping logic of any kind.
- **`react-native-reanimated` is installed but completely unused.** It's in `package.json` (`~4.1.1`, plus `react-native-worklets`), but a full-source search for `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withRepeat`, or any import from `'react-native-reanimated'` returns zero hits in `src/`. All animation today (honey-pot drift, letter-throw ghost, banner fade, celebration/confetti) runs on React Native's legacy `Animated` API, entirely inside `src/features/play/screens/PlayScreen.tsx` and `src/shared/ui/Confetti.tsx`.
- **`react-native-gesture-handler` is only wired for the flick mechanic.** It's used in exactly two places: the app-wide `GestureHandlerRootView` setup in `app/_layout.tsx`, and a `Gesture.Pan()` per letter tile in `PlayScreen.tsx`. There is no tap gesture anywhere, so a "poke a character" interaction does not exist.
- **Characters are invisible during actual gameplay.** `PlayScreen.tsx` never imports or renders `<Character>` — Mama Bear and the villains only appear on the Home and Instructions screens today. There is no villain-defeated moment, no character reaction to a correct/incorrect flick — only text feedback, a pot-blink timer, and a confetti burst that isn't tied to any character.
- **The character-audio registry has zero callers.** `getCharacterAudio()` (`character-audio.ts`) is fully built per Epic 7 but is never invoked anywhere in `src/`. The only voice audio in the game today is dynamic TTS via `expo-speech`, wrapped by `src/shared/lib/speech/speech-service.ts` (used for word pronunciation and a generic praise phrase) — it has no awareness of the character-audio registry, and `expo-av`/`expo-audio` (needed to actually play a pre-recorded clip) is not a dependency yet.
- **No reduce-motion support exists.** A full-source search for `AccessibilityInfo`, `isReduceMotionEnabled`, or `useReducedMotion` returns zero hits in `src/` or `app/` — the accessibility criterion in architecture doc Section 25.1 is currently unmet.
- **No sprite sheet asset convention is documented yet.** `src/assets/artwork/characters/README.md` documents the static `<slug>-<variant>.png` convention only; there is no equivalent convention for a sprite sheet + frame metadata pair, and the character folders currently contain nothing but a `README.md` and a `.gitkeep` each.
- **No test framework exists in the repo at all.** `package.json` has no `jest`, `vitest`, or `@testing-library/react-native`, no test script, and there are zero `*.test.ts*`/`*.spec.ts*` files anywhere. Architecture Section 25.1's "testable and decoupled" criterion currently has no infrastructure to run against.

The five epics below close these gaps in dependency order.

### Epic 8 — Character Animation Data Model and Playback Component

#### Objective

Build the foundational, art-agnostic layer that the rest of the animation system depends on: the animation-state vocabulary, the sprite sheet data registry, and a Reanimated-driven playback component with the same graceful-fallback contract `<Character>` already guarantees today. This is the first real usage of `react-native-reanimated` in the codebase.

#### User Story

As an engineer, I want a typed animation state and a sprite-sheet-capable character component so that gameplay code can say "this character is celebrating" without knowing or caring whether real animated artwork has been delivered yet.

#### Tasks

- Define `CharacterAnimationState` (`Idle`, `Talking`, `Poked`, `Celebrating`, `Defeated`, `BeingNaughty`, `Challenging`) as a new type, matching architecture doc Section 25.5.
- Add `src/data/characters/character-animations.ts`, mirroring the existing `character-images.ts` pattern: a map of `characterId` + `CharacterAnimationState` to sprite sheet metadata (asset reference, frame count, frame width/height, playback fps, loop vs. one-shot), with a `getCharacterAnimation()` lookup that returns `null` for anything unregistered — start with all entries empty, exactly like `character-images.ts`/`character-audio.ts` did on day one.
- Build the sprite-sheet playback primitive: a `useSpriteAnimation`-style hook or small internal component using `useSharedValue` + `withRepeat`/`withTiming` to drive a frame index on the UI thread, cropping/offsetting a source image accordingly.
- Extend `<Character>` with an optional `animationState` prop (or add a sibling `AnimatedCharacter` component) implementing the fallback chain from architecture Section 25.6: **animated sprite → static pose image → emoji badge**. Do not change the existing `<Character>` call signature in a way that breaks `HomeScreen`/`InstructionsScreen`.
- Regression-check `HomeScreen.tsx` and `InstructionsScreen.tsx` render unchanged (still fall through to the emoji badge) now that zero animation entries are registered — same discipline used when `character-images.ts` first shipped empty.
- Stand up minimal unit-test coverage for the state-machine/lookup logic (`getCharacterAnimation`, frame-index math) using the project's existing pattern of standalone, dependency-free verification scripts (as used to verify `character-roster.ts` in Epic 7), or introduce a lightweight test runner if the team decides the animation logic has grown complex enough to warrant one — either way, close the "no test framework" gap enough to make Section 25.1's "testable and decoupled" criterion actually checkable.

#### Depends On

Nothing — this is the foundational epic and can start immediately.

#### Revised: Implemented

All six tasks above are built and verified. What actually landed:

- `CharacterAnimationState` lives in `character-roster.ts` (alongside `CharacterImageVariant`/`CharacterAudioVariant`) as `'Idle' | 'Talking' | 'Poked' | 'Celebrating' | 'Defeated' | 'BeingNaughty' | 'Challenging'`. `CharacterDefinition` gained an `animationStates` field, mirroring the existing `variants`/`audioVariants` split: heroes get the four shared states, villains additionally get `Defeated`, `BeingNaughty`, and `Challenging` — the same role-based split already used for image/audio variants.
- `src/data/characters/character-animations.ts` mirrors `character-images.ts` exactly: a `SpriteSheetAnimation` metadata shape (sheet asset, frame count, frame width/height, fps, loop flag) and a `getCharacterAnimation(characterId, state)` lookup returning `null` for anything unregistered. All four characters currently have empty entries — no sprite sheets exist yet. The sheet layout convention (a single horizontal frame strip) is documented directly on `SpriteSheetAnimation` since Epic 9 (asset pipeline conventions) will need to follow it.
- The frame-index/crop math is split out as pure, RN-independent functions in `src/shared/ui/sprite-animation.ts` (`resolveSpriteFrameIndex`, `resolveSpriteFrameOffsetX`, `resolveSpriteAnimationDurationMs`), consumed by the actual Reanimated playback hook in `src/shared/ui/useSpriteAnimation.ts` — the first real usage of `react-native-reanimated` in this codebase. The hook ramps a shared value from 0 to `frameCount` via `withTiming`/`withRepeat` and floors it each frame to resolve the current sprite frame.
- `<Character>` (`src/shared/ui/Character.tsx`) gained an optional `animationState` prop and now renders the full fallback chain: animated sprite (via a small private `AnimatedSprite` sub-component) → static pose image → emoji badge. The existing call signature is unchanged and additive only.
- **Regression-verified**: `HomeScreen` and `InstructionsScreen` render pixel-identical to before (confirmed via `tsc --noEmit`, `expo export --platform web`, and a live Playwright check against the running dev server, screenshots reviewed) — since `character-animations.ts` starts empty, every character currently falls straight through to the pre-existing static/emoji rendering, exactly as required.
- **Test framework stood up**: this repo had zero test infrastructure before this epic. Rather than pulling in Jest (heavyweight React Native preset, not needed for testing plain data/logic modules), added `tsx` as a devDependency and wired `npm test` to Node's own built-in test runner (`node --import tsx --test`) — zero new test-framework dependency, just a TypeScript execution shim. `@types/node` was also added explicitly as a devDependency (it was already present transitively, but the test files now depend on it directly). 12 tests across `sprite-animation.test.ts` and `character-animations.test.ts` cover the frame-index math and the state/lookup logic; all pass.

---

### Epic 9 — Sprite Sheet Asset Pipeline and Conventions

#### Objective

Give the art/animation contractor a documented, predictable place and file format to deliver sprite sheets, the same way Epic 7 documented the static-artwork convention, so asset delivery and Epic 8's data model line up without renegotiation.

#### User Story

As the animation contractor, I want a clear folder structure, naming convention, and metadata format for sprite sheets so I know exactly what to export and where it goes, without needing to read engineering code first.

#### Tasks

- Decide and document the sprite sheet folder/file convention under `src/assets/artwork/characters/<slug>/` (for example a `sprites/` subfolder, `<slug>-<state>-sheet.png` plus a companion `<slug>-<state>.json` frame atlas) — update `src/assets/artwork/characters/README.md` with a new section alongside the existing static-pose convention, not replacing it.
- Document the expected frame count, frame size, and fps guidance per animation state (`Idle`, `Talking`, `Poked`, `Celebrating`, `Defeated`, `BeingNaughty`, `Challenging`) so the contractor delivers assets Epic 8's data model can consume directly.
- Add a short note on sprite sheet sizing (match actual render size, avoid oversized textures) and compression expectations, consistent with architecture Section 25.8.
- Resolve the outstanding "Professor Owl" vs. "Professor Puffin" naming discrepancy (flagged since Epic 7's Known Follow-Up) before sprite delivery begins for that character, so the contractor doesn't build assets under the wrong name.

#### Depends On

Nothing — this is documentation and convention work and can run in parallel with Epic 8.

#### Revised: Implemented

All four tasks above are done:

- `src/assets/artwork/characters/README.md` gained a new "Sprite sheet convention (animated states)" section: a `sprites/` subfolder per character (kept separate from the existing static `<slug>-<variant>.png` poses), a `<slug>-<state>-sheet.png` + `<slug>-<state>.json` file pair per animation state, and a single-horizontal-strip sheet layout (matching what `character-animations.ts`'s `SpriteSheetAnimation` type already assumes per its Epic 8 doc comment). The companion `.json` is explicitly documented as a hand-off spec for engineering to transcribe into `character-animations.ts` — the app doesn't load it at runtime, consistent with this project's hand-filled `require()` map pattern rather than adding a JSON-loading pipeline nobody asked for.
- Added a frame-count/fps guidance table covering all seven animation states (including the two added since this epic was first scoped, `BeingNaughty` and `Challenging`), and a sizing table mapping each `relativeSize` preset to target frame dimensions, so the contractor has concrete numbers instead of "reasonable size."
- Added a sizing/compression note pointing back to architecture Section 25.8.
- **Naming discrepancy resolved**: per product direction, the character sheet doc has been renamed from "Professor Puffin" to "Professor Owl" throughout (Section 4.7 and the character list), matching the `professor-owl` id already used everywhere else. The old "Known naming gap" callouts in the artwork README and Epic 7's Known Follow-Up have been updated to note this is resolved.
- `sprites/` placeholder subfolders (with `.gitkeep`) were added under all four character artwork folders so the documented convention has somewhere to actually receive files.
- In passing, fixed two stale doc references left over from Epic 7/8 that pointed at a `TODO` comment in `character-roster.ts` that no longer exists — both the artwork and audio character READMEs now correctly point at `character-images.ts`/`character-audio.ts` as where `require()` wiring actually goes.

#### Known Follow-Up

A stale, untracked `src/assets/images/characters/` folder (leftover from before the artwork/audio/music/effects restructure) still exists on disk with placeholder `.gitkeep` files and its own README carrying the old "Professor Puffin" naming gap note. It was deliberately left alone rather than deleted without confirmation — it's harmless (nothing references it) but should be removed once confirmed safe.

#### Re-audit note (pre-Epic 10)

Before starting Epic 10, all four "Revised: Implemented" claims above were re-verified against the actual repo state (not just re-read from this doc) — all four hold up: the sprite sheet convention section, the frame-count/fps and sizing tables, the Section 25.8 sizing/compression note, and the Professor Owl naming resolution (no remaining "Professor Puffin" references anywhere in the repo outside this doc's own historical mentions of the old name). `sprites/.gitkeep` placeholders exist under all four character folders, and the artwork/audio READMEs correctly point at `character-images.ts`/`character-audio.ts`.

Two things surfaced during this re-audit that don't affect Epic 9's own tasks but are worth flagging:

- The "Known Follow-Up" above describes a stale `src/assets/images/characters/` folder as still existing on disk. It does not — `src/assets/images/` doesn't exist anywhere in the working tree (confirmed both via a direct listing and via git history, which shows this path was never tracked). Either it was removed after this note was written, or the note was inaccurate when written. No action needed since the folder is already gone; this line item can be considered resolved.
- **`docs/mama-bears-spelling-bee-architecture.md` does not exist in this repository** (confirmed via file search and full git history — it has never been committed). Every "architecture Section 25.x" citation in Epics 8, 9, and 10 above refers to a document that isn't actually in the repo to check claims against. Epic 10 below was therefore built using this roadmap doc's own detailed descriptions of the intended behavior (which are specific enough to work from) plus the existing code's own conventions, rather than the architecture doc itself. This should be treated as an open flag for the user: either the architecture doc needs to be added to the repo (if it exists elsewhere, e.g. a private docs repo, the same way the "character sheet doc" is called out as living in a private planning-docs repo), or these Section 25.x references should be reconciled/removed if no such doc is coming.

---

### Epic 10 — Gameplay Event Wiring for Character Reactions

#### Objective

Make characters actually appear and react during real gameplay by connecting the animation state machine (Epic 8) to the gameplay events that already exist in `PlayScreen.tsx`, and add the tap-to-react interaction called for in architecture Section 25.7.

#### User Story

As a child playing Honey Pot Flick, I want Mama Bear and the villain to visibly react when I get a letter right or wrong, and to react if I just tap on them for fun, so the game feels alive instead of just showing text feedback.

#### Tasks

- Render the relevant `<Character>`/`AnimatedCharacter` instances inside `PlayScreen.tsx` — currently no character is rendered there at all, only the honey pot, letter tiles, and text feedback.
- Wire the correct-letter branch in `resolveFlick` (`PlayScreen.tsx`, the `nextGuess = guess + letter` path) to set `Celebrating`/`Talking` state on the relevant character.
- Wire the miss branches in `resolveFlick` (the off-target-flick path and the wrong-letter path, both of which currently call `rejectPot()`) to trigger a villain reaction state.
- Wire the word-complete branch (the `nextGuess.length === currentWord.length` path, which already calls `triggerCelebration()`) to set `Celebrating` state, and decide how the existing `Animated`-based confetti celebration in `Confetti.tsx` composes with the new sprite-based character celebration rather than fighting it for visual attention.
- Add a tap gesture on rendered characters (via the `react-native-gesture-handler` primitives already used for the letter-flick mechanic) that sets `Poked` state — purely playful, no scoring impact, per architecture Section 25.7.
- Introduce a small hook (for example `useCharacterAnimationState`) that owns state transitions and the auto-return-to-`Idle` timer, so `PlayScreen.tsx` doesn't hand-roll animation timing logic alongside its existing gameplay timers.

#### Depends On

Epic 8 (needs the animation state type and the animated component to render).

#### Revised: Implemented

All six tasks above are built and verified. What actually landed:

- `PlayScreen.tsx` now renders two `<Character>` instances in a new `characterRow`, just under the mode/score line: Mama Bear (`size="medium"`) and one villain (`size="small"`). Which villain appears is chosen per game mode by a small `VILLAIN_ID_BY_MODE` lookup (`silly-goose` for `easy`/`crazy`, `cheeky-monkey` for `hard`/`impossible`), mirroring the per-mode villain flavor text already shown on `InstructionsScreen`. Both characters are wrapped in a `GestureDetector` with `Gesture.Tap()` that sets `Poked` — purely cosmetic, no scoring/state interaction.
- Added `src/shared/ui/useCharacterAnimationState.ts`: a hook that owns one character's current `CharacterAnimationState` plus the return-to-`Idle` timer. `trigger(state, holdMs?)` switches state immediately and (re)schedules the auto-return, cancelling any pending return from a previous trigger so the most recent reaction always wins — this is what keeps `PlayScreen.tsx` from hand-rolling more `setTimeout`s alongside its existing gameplay timers. The default hold duration per state is pure, table-driven data in a sibling module, `src/shared/ui/character-animation-state.ts` (`resolveAnimationHoldMs`), split out the same way Epic 8 split `sprite-animation.ts` from `useSpriteAnimation.ts` — dependency-free and unit-tested, while the hook itself (React state/timers) is exercised via typecheck, the test suite passing, and a manual dev-server/build check, consistent with how `useSpriteAnimation.ts` was verified in Epic 8.
- `PlayScreen.tsx` holds two independent `useCharacterAnimationState()` instances, one for Mama Bear and one for the on-screen villain, and wires them into the existing gameplay branches:
  - The correct-letter branch in `resolveFlick` calls `mamaBear.trigger('Talking')` on every correct flick.
  - The shared `rejectPot()` — called from both of `resolveFlick`'s miss branches (off-target flick, wrong letter) — calls `villain.trigger('Challenging')` once, at the shared handler, rather than duplicating the call at both call sites.
  - `triggerCelebration()` (called from the word-complete branch) calls `mamaBear.trigger('Celebrating', CELEBRATION_TOTAL_MS)` and `villain.trigger('Defeated', CELEBRATION_TOTAL_MS)`, passing the confetti overlay's own duration explicitly so both character reactions return to `Idle` right as the overlay finishes, instead of drifting out of sync on their own default hold durations.
- **Confetti composition decision**: the full-screen `Confetti`/celebration-card overlay stays the "big" reward moment exactly as it was — the new Mama Bear/villain reactions play out in the persistent character row instead of inside the overlay, so the two don't compete for the child's attention at the same moment. A code comment at the `triggerCelebration()` call site records this reasoning for future maintainers.
- `<Character>` (`src/shared/ui/Character.tsx`) gained one small additive fix needed to make the fallback chain actually meaningful for reactions: when `animationState` is passed without an explicit `variant`, the static-pose fallback now resolves a state-appropriate pose (`'happy'` for `Celebrating`, `'defeated'` for `Defeated`, `'idle'` otherwise) instead of always defaulting to `'idle'` regardless of what state was requested. This only changes behavior when `animationState` is passed and `variant` isn't — `HomeScreen`/`InstructionsScreen` pass neither or just `variant`, so they're unaffected.
- **Regression-verified**: `tsc --noEmit` is clean, `npm test` passes all 14 tests (the 4 new ones covering `resolveAnimationHoldMs`, plus the 10 pre-existing ones), and `npx expo export --platform web` builds successfully. The dev server (`expo start --web`) was started and both `/` and `/play` were confirmed to respond with the bundled app shell. A live browser/screenshot check (as was done for Epic 8) wasn't available in this session — no browser-automation tool was on hand — so the PlayScreen visual check is code-review-level plus a successful bundle/serve, not a rendered screenshot. Since no sprite sheets are registered yet (Epic 9's asset pipeline is ready but no art has landed), both characters currently render via their emoji-badge fallback exactly as before on Home/Instructions — the new reactions are state changes with no visible frame animation yet, which is the expected, correct behavior until real sprite sheets land.

---

### Epic 10.5 — Villain Pool, Behavior Escalation, and Honey-Pot Protection (Revision to Epic 10)

#### Why This Is a Revision, Not a New Epic

Epic 10 shipped real character reactions during gameplay, but took a deliberate shortcut for villain selection to keep that epic scoped: a hardcoded `VILLAIN_ID_BY_MODE` map, one fixed villain per mode, animation-only reactions. After Epic 10 shipped, the product direction for villains was fleshed out in the architecture doc (Sections 25.10 and 25.11, in the private `docs-private/mama-bears-spelling-bee-architecture.md` planning repo): a randomized villain pool (never the same villain twice in a row) shared across all modes, a per-mode behavior-tier ladder tied to a deliberate age-targeting curve, and a concrete honey-pot-protection mechanic that gives villains a real gameplay interaction at higher tiers instead of just cosmetic animation. Rather than rewriting Epic 10's own record of what was built and verified, this gap and the follow-on work are recorded here as Epic 10.5 — Epic 10 stands as delivered history, this epic supersedes its villain-selection tasks and adds new ones.

#### Objective

Replace Epic 10's placeholder villain selection with the pool/tier model from architecture Section 25.10, and implement the honey-larder steal/defend/recover mechanic from Section 25.11, so villain presence and behavior scale with difficulty mode instead of being fixed and animation-only.

#### User Story

As a child playing Honey Pot Flick, I want a different villain to show up each time I play (never the same one twice in a row), and I want that villain to act more mischievously the harder I play — from just teasing me on easy, up to actually trying to steal Mama Bear's honey on the hardest mode — so the game keeps feeling fresh and the challenge escalates with more than just harder words.

#### Tasks

**Supersedes Epic 10's fixed villain lookup:**
- Add `src/data/characters/villain-pool.ts`: the `VillainPoolConfig` (a single shared `defaultPool` across all modes, per architecture 25.10.2 — modes do not narrow the pool) and the pure `pickNextVillain(eligible, lastVillainId, random)` selector (25.10.3): uniform random pick, excluding the immediately previous villain, with a single-villain-pool fallback that allows the repeat.
- Track `lastVillainId` for the session and call the selector once per new game/round, replacing `VILLAIN_ID_BY_MODE` in `PlayScreen.tsx`.
- Add the `mode -> tier` ladder and `tier -> capabilities` per-game data (25.10.4): `Passive`/`Taunting`/`Interfering`/`Relentless` mapped from `easy`/`hard`/`crazy`/`impossible`, with Honey Pot Flick's capability set per tier.

**New — the honey-pot-protection mechanic (architecture Section 25.11):**
- Add `honeyStash` (plus a never-below-floor guard and earn-on-word-complete) to `session-store.ts`, kept fully separate from `score`/mastery records so a steal can never distort the progress data parents see.
- Add a small persistent honey-larder UI to `PlayScreen.tsx` (the row of collected pots the villain can menace), within the existing Section 25.8 on-screen animation budget.
- Implement the pure `StealAttempt` state machine (`Safe -> Telegraphing -> {Defended | Stolen} -> Safe`) and a per-tier `StealTuning` table, unit-tested with injected timing.
- Wire the Honey Pot Flick `StealAttemptHost`: open attempts from the existing `rejectPot()` miss handler at `Interfering`+, resolve via the next correct flick or a villain shoo-tap, apply consequences/recovery, drive `BeingNaughty` state and larder visuals.
- Gate steal machinery behind tier (no steal machinery instantiated at `Passive`) and behind reduce-motion (soft pose-swap instead of a travel/scamper animation when enabled).

#### Depends On

Epic 10 (the character rendering, tap gesture, and `useCharacterAnimationState` hook this builds on) and Epic 8 (the animation-state plumbing). Architecture doc Sections 25.10–25.11 (`docs-private/mama-bears-spelling-bee-architecture.md`) are the full design reference — read those before implementing; they specify the exact algorithms, per-tier tuning tables, and trade-off rationale that this epic's tasks only summarize.

#### Product Decisions Locked In (architecture Section 25.10, confirmed)

- The same villain pool applies to every difficulty mode — all escalation comes from behavior tier, never from which villains are eligible to appear.
- The four-tier ladder (`easy`/`hard`/`crazy`/`impossible`) is a deliberate, portfolio-wide age-targeting curve (~6/7/8/9-year-olds respectively, with most 10-year-olds expected to age out of the product), shared across all planned future games — the tier names and order are a stable cross-game contract, not per-game/per-mode tuning knobs.

#### Revised: Implemented

All five tasks above are built and verified. What actually landed:

- **`src/data/characters/villain-pool.ts`** (+ `.test.ts`): `VillainPoolConfig`, `getEligibleVillains`, and the pure `pickNextVillain(eligible, lastVillainId, random)` selector exactly per 25.10.3 — empty pool returns `null`, a single-villain pool always returns that villain (repeat allowed), no `lastVillainId` picks uniformly over the full pool, otherwise picks uniformly excluding the last. `VILLAIN_POOL_CONFIG`'s `defaultPool` is derived from `CHARACTER_ROSTER`'s `role === 'villain'` entries rather than hardcoded a second time, so a new villain added to the roster is automatically eligible with no second edit.
- **`src/data/characters/villain-behavior.ts`** (+ `.test.ts`): the `VillainBehaviorTier` enum (`Passive`/`Taunting`/`Interfering`/`Relentless`), `VillainCapability` union, `VillainBehaviorProfile` type, and the shared `MODE_TIER` ladder (`easy→Passive, hard→Taunting, crazy→Interfering, impossible→Relentless`), game-agnostic as specified.
- **`src/features/play/logic/villain-capabilities.ts`** (+ `.test.ts`): Honey Pot Flick's per-tier `tier -> capabilities` data (`Passive/Taunting → ['Taunt']`, `Interfering/Relentless → ['Taunt', 'StealResource']`). This module is tested but not yet consumed by `PlayScreen.tsx` — the actual steal-machinery gate ended up being "does this tier have non-null `StealTuning`" (see below), with `villain-capabilities.ts` kept as descriptive metadata for future games per 25.10.6's abstract-capability boundary.
- **`src/data/characters/steal-attempt.ts`** (+ `.test.ts`): the pure, RN-independent `StealAttempt` state machine (`Safe → Telegraphing → {Defended | Stolen} → Safe`) with injected timing, plus `StealTuning` (`windUpMs`, `canComplete`, `allowTapDefense`, `triggerOnStall`, `maxConcurrentInterferences`) and `STEAL_TUNING_BY_TIER` matching the 25.11.4 launch table: `Passive → null` (no machinery instantiated at all), `Taunting → 4000ms, canComplete: false` (telegraph-only tutorial tier), `Interfering → 3000ms, canComplete: true`, `Relentless → 1800ms, canComplete: true, triggerOnStall: true`.
- **`session-store.ts`** gained `honeyStash` (starts above the floor), `HONEY_LARDER_FLOOR`, `stolenOutstanding`, `earnHoneyPot()` (recovers one outstanding stolen pot before adding a fresh one, per the 25.11.3 mermaid diagram), `stealHoneyPot()` (refuses below the floor), `resetHoneyStash()`, and the villain-selection slice (`villainId`, `lastVillainId`, `pickSessionVillain(mode)`). None of this touches `score` or `progress-store.ts` — verified with a dedicated `session-store.test.ts` covering the earn/steal/floor/recovery loop.
- **`PlayScreen.tsx`** wiring: `VILLAIN_ID_BY_MODE` is gone, replaced by `pickSessionVillain(gameMode)` called once on mount (selection persists for the whole screen session, per 25.10.3's "once per new game" guidance). A steal attempt opens from `rejectPot()` (both miss branches) whenever the current tier has non-null `StealTuning` — i.e. `Taunting` and up, matching 25.11.4's table rather than the "`Interfering`+" shorthand in this epic's own task list above (see discrepancy note below). Primary defense is the next correct flick (`resolveFlick`'s hit branch); secondary defense is a tap/flick on the villain (`villainTap`, previously `Poked`-only, now also resolves an open attempt). A stolen pot decrements `honeyStash` and plays a `BeingNaughty` scamper; `Relentless` additionally opens an attempt on stall, reusing the existing `potPlacedAtRef`/`modeConfig.potDriftEscalationMs` drift-escalation clock rather than a new timer. Word completion calls `earnHoneyPot()`. A small honey-larder row (capped at 6 visible pot icons + a `+N` overflow label) sits under the existing `characterRow`; the villain's interference is a transient lunge animation from its stable home position in that row (not a relocation onto the play field), gated by a local `AccessibilityInfo.isReduceMotionEnabled` check scoped only to the new lunge/pulse animation — general reduce-motion support is still Epic 12's job.
- **Known discrepancy, flagged rather than silently resolved:** this epic's own task list (above) says steal attempts trigger "at `Interfering`+", but architecture 25.11.4's tuning table has `Taunting` also opening telegraph-only attempts (`canComplete: false`) as a deliberate zero-stakes tutorial tier. The implementation followed 25.11.4 (the more authoritative, detailed source) — `Taunting` villains now telegraph a reach that always fails/retreats, teaching the wind-up visual before `crazy` makes it real. If that reading is wrong, the fix is a one-line change to `STEAL_TUNING_BY_TIER`'s `Taunting` entry.
- **Regression-verified**: `npm test` passes 43/43 (11 new tests across `villain-pool`, `villain-behavior`, `steal-attempt`, `villain-capabilities`, and `session-store`), `tsc --noEmit` is clean, and `npx expo export --platform web` builds successfully. `expo start --web` was started and `/` and `/play` both returned HTTP 200 with no console errors; no browser-automation tool was available in this session, so this is a bundle/serve-level check plus code review, not a rendered screenshot — the same limitation noted in Epic 10's own write-up above.

---

### Epic 11 — Character Voice Line Playback

#### Objective

Finish wiring the character-audio registry that Epic 7 built but nothing calls today, so pre-recorded character voice lines can actually play once audio is delivered, and define how they coexist with the existing TTS-based `speech-service.ts`.

#### User Story

As a child, I want Mama Bear and the villains to sound like themselves — not just the same generic narrator voice — so the game feels more like a cartoon and less like a screen reader.

#### Tasks

- Add an audio-playback dependency capable of playing bundled clips (`expo-av`, or `expo-audio` if that's the currently-recommended Expo SDK API by the time this is built) — not currently a project dependency.
- Build a small character-audio playback service, mirroring the structure of `speech-service.ts`, that takes a `characterId` + `CharacterAudioVariant`, calls the existing `getCharacterAudio()`, and plays the clip if registered, silently no-ops if not (matching the fallback discipline used everywhere else in the character system).
- Wire character-audio playback into the same trigger points introduced in Epic 10 (`Celebrating` → `praise` clip, `Defeated` → `defeated`/`taunt` clip) so voice and animation fire together, per architecture Section 25.5's "audio and animation stay in sync" guidance.
- Document the policy for when to use pre-recorded character clips versus the existing dynamic TTS in `speech-service.ts` (for example: word pronunciation and on-demand hints stay TTS since word content is data-driven and unbounded; fixed character personality lines — greetings, praise, taunts — use pre-recorded clips for personality and quality).

#### Depends On

Epic 8 (for the state values that drive playback) and Epic 10 (for the trigger points to hook into) — can be built in parallel with Epic 10's animation wiring once Epic 8 lands, since audio and sprite playback are independent side effects of the same state change.

#### Policy: Pre-Recorded Character Clips vs. Dynamic TTS

The app now has two independent playback paths that both produce spoken audio, and each moment in the game should use exactly one of them:

- **`speech-service.ts` (TTS, `expo-speech`) — for anything data-driven or unbounded.** Word pronunciation (`speakWord`, used by the reveal banner and the megaphone button) has to stay TTS because the word list is arbitrary, user-editable content — there is no way to pre-record a clip for every word a parent might ever add. The same reasoning applies to any future on-demand hint text.
- **`character-audio-service.ts` (pre-recorded clips, `expo-audio`) — for fixed character personality lines.** Greetings, praise, and taunts are a small, closed set of lines per character, known in advance — exactly the case where recording a real voice actor (or a distinct synthesized personality) for quality and character consistency is worth it. `CharacterAudioVariant` (`greeting` | `praise` | `taunt` | `defeated`) enumerates this closed set; if a future line doesn't fit one of those variants, that's a sign it belongs in the TTS path instead, not a reason to grow the enum ad hoc.
- **When both could apply to the same moment, the clip wins and TTS is the fallback**, not both firing together — see `triggerCelebration()`'s `playCharacterLine('mama-bear', 'praise')` call in `PlayScreen.tsx`, which only falls through to `speechService.speakPraise()` when no clip is registered for Mama Bear's `praise` variant. This keeps the two paths from talking over each other once real clips are delivered; today, with no clips registered anywhere, every praise moment still resolves to the pre-existing TTS behavior unchanged.

#### Revised: Implemented

All four tasks above are built and verified. What actually landed:

- **`expo-audio` (`~1.1.1`)** is the audio-playback dependency, added via `npx expo install expo-audio` (SDK-54-compatible version resolved automatically, not hand-typed) and registered as a config plugin in `app.json`. `expo-av` was not used — it's deprecated as of the SDK this project is on, and `expo-audio`'s hooks-based API also ships a non-hook `createAudioPlayer(source, options)` escape hatch for exactly this "play a clip from a plain service class, not a component" use case, which is what the new service uses.
- **`src/shared/lib/character-audio/character-audio-service.ts`** (+ `index.ts` barrel, mirroring `src/shared/lib/speech/`'s shape): a `CharacterAudioService` class exposing `playCharacterLine(characterId, variant): boolean`, which calls the existing `getCharacterAudio()`, no-ops (returns `false`) if it's `null` — the case for every character today — and otherwise creates a one-shot `AudioPlayer` via `createAudioPlayer()`, plays it, and releases it automatically on the `playbackStatusUpdate` event's `didJustFinish` flag. The whole call is wrapped in try/catch, exactly like `speech-service.ts`'s `speak()`, since `expo-audio`'s native module isn't guaranteed to be available in every environment (notably headless/sandboxed web). Unlike `speechService`, which serializes all TTS through one queue, `CharacterAudioService` tracks a `Set` of concurrently-active players rather than one slot — two different characters' voice lines (e.g. Mama Bear's praise and a villain's defeated line, both firing off the same word-complete event) can legitimately overlap, so one clip starting shouldn't cut another one off. A single shared instance, `characterAudioService`, is exported, matching `speechService`'s pattern. No `.test.ts` was added for this file — same precedent as `speech-service.ts` itself, which also has no direct test — since it's a thin wrapper around a native module rather than pure logic; it's exercised via `tsc --noEmit`, the full test suite passing, and the build/serve check below.
- **No pure "animation state → audio variant" mapping module was introduced.** The roadmap task suggested one only conditionally ("if you introduce one"); with just three call sites total (two mandatory, one optional extension — see below), each already stating its own variant literally at the point of use (`playCharacterLine('mama-bear', 'praise')`, `playCharacterLine(villainId, 'defeated')`, `playCharacterLine(villainId, 'taunt')`), an indirection layer would have had no independent logic left to unit-test and would have diverged from how `rejectPot()`/`triggerCelebration()` already call `.trigger()` directly inline rather than through a lookup table.
- **`PlayScreen.tsx` wiring**, matching Epic 10's own trigger points:
  - `triggerCelebration()` (word-complete) calls `characterAudioService.playCharacterLine('mama-bear', 'praise')` and, if `villainId` is set, `characterAudioService.playCharacterLine(villainId, 'defeated')`, alongside the existing `mamaBear.trigger('Celebrating', ...)` / `villain.trigger('Defeated', ...)` animation calls, so animation and voice fire together per architecture 25.5.
  - `rejectPot()` (the shared miss handler) calls `characterAudioService.playCharacterLine(villainId, 'taunt')` alongside `villain.trigger('Challenging')`.
  - The screen's unmount cleanup effect now also calls `characterAudioService.stopAll()`, alongside the pre-existing `speechService.stop()`.
- **Known judgment call, flagged rather than silently resolved — the `Challenging` → `taunt` hookup.** The roadmap task's literal wording only mandates two hookups (`Celebrating` → `praise`, `Defeated` → `defeated`). `Defeated` → `defeated`/`taunt` in the task's own phrasing reads as anticipating this ambiguity rather than mandating a third. `Challenging` → `taunt` was added as the low-risk extension the task text itself calls out as reasonable: it's an existing Epic 10 trigger point, on a villain, with no TTS currently tied to that moment (so no coexistence question), and `taunt` is otherwise an audio variant villains have (`VILLAIN_AUDIO_VARIANTS`) with no trigger point wired to it at all without this. `BeingNaughty` (the Epic 10.5 steal-attempt state) was deliberately **not** wired to `taunt` or any other variant — it wasn't introduced until Epic 10.5, so it's outside "the same trigger points introduced in Epic 10" that this task scopes to; if a villain "mischief" line is wanted for the steal mechanic later, that's a one-line addition at `openStealAttempt()`/`resolveStealTimeout()`, not something this pass silently added.
- **TTS/clip coexistence decision (the constraint this epic calls out explicitly): the clip wins, TTS is the fallback, never both.** `triggerCelebration()` now calls `characterAudioService.playCharacterLine('mama-bear', 'praise')` first; only when that returns `false` (no clip registered for Mama Bear's `praise` variant) does it fall through to `speechService.speakPraise()` and populate the on-card `celebrationPhrase` caption text. The alternative — always firing both — was rejected because a spoken TTS phrase layered under Mama Bear's own recorded voice line would be exactly the "sounds like a screen reader, not a cartoon" problem this epic exists to fix. **Trade-off flagged for a future pass:** when a clip does play, `celebrationPhrase` is set to `''` and the celebration card shows no caption text for that line (the clip is audible but has no on-screen text equivalent), which is a minor accessibility regression versus today's always-captioned TTS phrase. This is unreachable today (no clips are registered for any character), so it's a documented trade-off rather than a bug — Epic 12's accessibility pass is the natural place to add a per-clip caption string to `character-audio.ts` if that's wanted. `Defeated` and `Challenging` had no pre-existing TTS tied to them, so no equivalent decision was needed for those two.
- **`character-audio.ts` and `character-roster.ts` are unchanged** — no placeholder `require()` entries were added, and `getCharacterAudio()` still returns `null` for every character/variant, which remains the correct, expected state until real clips are recorded and registered. Nothing at any of the three `PlayScreen.tsx` call sites will need to change when that happens.
- **Regression-verified**: `npm test` passes all 43/43 (no count change — no new pure logic was introduced to test, per the "no mapping module" call above), `tsc --noEmit` is clean, and `npx expo export --platform web` builds successfully (2.13 MB web bundle, no errors). `expo start --web` was started and both `/` and `/play` returned HTTP 200 with no bundling or console errors in the Metro log; as in Epics 10 and 10.5's own write-ups, no browser-automation tool was available in this session, so this is a bundle/serve-level check plus code review, not a rendered/audible screenshot — and since no clips are registered, there is nothing to audibly verify yet regardless.

---

### Epic 12 — Accessibility, Performance, and Reduced Motion

#### Objective

Close the accessibility and performance gaps called out in architecture Section 25.1 (criteria 2 and 9) before animated characters roll out broadly, since neither reduce-motion support nor an enforced on-screen animation budget exist in the codebase today.

#### User Story

As a parent of a sensory-sensitive child, I want the game to remain fully playable with calmer visuals when my device's reduce-motion setting is on, and as a player on an older tablet, I want the game to stay smooth even with characters animating.

#### Tasks

- Add reduce-motion detection using `AccessibilityInfo.isReduceMotionEnabled()` (or the current Expo/React Native equivalent) — currently unused anywhere in the codebase.
- When reduce-motion is enabled, force the playback component built in Epic 8 down its static-pose-image fallback path (still switching poses on state change) instead of playing sprite loops, per architecture Section 25.8.
- Enforce the on-screen animation budget from architecture Section 25.8 (roughly one to two large actively-animating characters plus a couple of small looping villains at once) at the `PlayScreen` level once Epic 10's rendering is in place.
- Smoke-test frame smoothness on a mid-range/lower-spec Android profile (physical device or emulator) once real sprite sheets exist, confirming the plain Reanimated crop-offset approach is smooth enough before architecture Section 25.3's pre-approved Skia escalation path is ever needed.

#### Depends On

Epic 8 (the playback component needs to exist before its fallback behavior can be gated), and benefits from Epic 10 being in place to test against real on-screen character counts.

#### Revised: Implemented

Three of the four tasks above are built and verified; the fourth is genuinely blocked on missing prerequisites. What actually landed:

- **Consolidation, not just addition — the stale first task.** By the time this epic was picked up, Epic 10.5 had already added an ad-hoc `AccessibilityInfo.isReduceMotionEnabled()` + `'reduceMotionChanged'` listener directly inside `PlayScreen.tsx`, scoped narrowly to gating the villain steal-attempt's lunge/pulse animation — it never touched the Epic 8 sprite-playback component this epic's task 1 and 2 are actually about. Rather than adding a second, independent `AccessibilityInfo` wiring next to it (which the roadmap task's literal "currently unused anywhere in the codebase" wording would have implied), the existing logic was extracted into one shared hook and `PlayScreen.tsx`'s own wiring was refactored to consume it, so the codebase ends this epic with exactly one place that talks to `AccessibilityInfo` for reduce-motion. This wasn't spelled out verbatim in the task list — it's a judgment call flagged explicitly here per this epic's own instructions.
- **`src/shared/lib/accessibility/useReduceMotion.ts`** (+ `index.ts` barrel, mirroring `src/shared/lib/speech/` and `src/shared/lib/character-audio/`'s shape): a `useReduceMotion()` hook that reads the initial value via `AccessibilityInfo.isReduceMotionEnabled?.()`, subscribes to `'reduceMotionChanged'` for the rest of the component's lifetime, and cleans up the subscription (plus an `isMounted` guard around the initial async resolve, a small hardening the ad-hoc version didn't have) on unmount. Behavior otherwise matches what Epic 10.5 already had working, just relocated so more than one call site can use it. No `.test.ts` was added — same precedent as `useCharacterAnimationState.ts` and `useSpriteAnimation.ts`, which also have no direct tests, since this is a thin RN-API wrapper with no independent pure logic to isolate, not a gap in the "pure logic gets a sibling test" convention.
- **`src/shared/ui/Character.tsx`** now calls `useReduceMotion()` and only resolves `getCharacterAnimation()` (the animated-sprite tier) when reduce-motion is off: `const animation = animationState && !reduceMotionEnabled ? getCharacterAnimation(characterId, animationState) : null;`. `resolvedVariant` (which drives the static-pose fallback) is computed exactly as before, still tracking `animationState` via `defaultVariantForAnimationState` regardless of `reduceMotionEnabled` — so under reduce-motion, `<Character>` falls straight to its static pose image (still switching poses on state changes, per 25.8's literal requirement) rather than a fourth, redesigned tier. The three-tier fallback chain (animated sprite → static pose → emoji badge) is unchanged in shape; reduce-motion just forces the first tier's precondition to include "and motion isn't reduced." Since no real sprite sheets are registered anywhere in the codebase yet (`getCharacterAnimation` still returns `null` for everything — confirmed via `character-animations.test.ts`, unchanged by this epic), this gating is correctness-now/effective-later plumbing exactly like Epic 11's audio wiring: nothing visibly changes today, but the branch is exercised and correct once real sprite sheets land.
- **`src/features/play/screens/PlayScreen.tsx`** no longer imports `AccessibilityInfo` or holds its own `reduceMotionEnabled` state/effect — it calls `const reduceMotionEnabled = useReduceMotion();` and the rest of the steal-lunge gating (`runStealTravel`'s early return) is untouched, preserving that behavior exactly.
- **On-screen animation budget (task 3) — scope deliberately kept small.** `src/shared/ui/animation-budget.ts` (+ `.test.ts`) adds a pure, RN-independent `checkAnimationBudget(entries, limits?)` following the same "pure logic in a sibling file" convention as `sprite-animation.ts`/`character-animation-state.ts`: `AnimationBudgetEntry` is just `{ relativeSize: CharacterRelativeSize, isAnimating: boolean }`, and `DEFAULT_ANIMATION_BUDGET` encodes 25.8's literal numbers (`maxLargeAnimating: 2`, `maxSmallVillainsAnimating: 2`). `'medium'` is folded into the "large" bucket rather than treated as a third tier, since 25.8's prose only names two buckets and a medium-scale character (Professor Owl, or the Silly Goose villain) reads as the "large actively-animating character" case, not the "couple of small looping villains" case — flagged here as a judgment call since the architecture doc doesn't spell out where `'medium'` falls. `PlayScreen.tsx` wires this in as a dev-only (`__DEV__`-gated) `console.warn` check, recomputed whenever `mamaBear.animationState`, `villain.animationState`, or `villainId` changes, built from the screen's actual two character slots (`characterRow` is mama-bear plus at most one villain — there is no dynamic or unbounded character list on this screen today). This is deliberately **not** a runtime-blocking gate, a global animation-budget registry, or a context provider consumed by future screens — `PlayScreen` is the only screen with animating characters today, so there is nothing yet to register against, consistent with how Epic 10.5's `villain-capabilities.ts` was kept as "descriptive metadata, not yet consumed" rather than over-built for hypothetical future games. `animation-budget.test.ts` also asserts, directly against `CHARACTER_ROSTER`, that mama-bear plus *any* villain in the pool (both actively animating at once, the worst case `PlayScreen` can currently produce — see `triggerCelebration()`'s simultaneous `Celebrating`/`Defeated` triggers) stays within budget, and that the full four-character roster animating at once would not — a sanity check that the utility actually bites rather than trivially passing everything.
- **Task 4 (Android smoke-test) — not done, explicitly blocked, not silently skipped or faked.** This task requires a physical or emulated Android device and real sprite-sheet artwork to measure frame smoothness against; neither exists yet. `character-animations.ts` still registers zero sprite sheets for any character (confirmed above), so there is no animation to actually play and profile — any "smoke test" performed today would only be measuring an idle/empty scene, which would not answer the question the task asks ("is the plain Reanimated crop-offset approach smooth enough") and would misrepresent this task as complete. No emulator/device session was fabricated and no placeholder sprite sheet was created to manufacture a result. This mirrors how earlier epics (e.g. Epic 9) flagged sub-tasks blocked on missing prerequisites rather than quietly omitting them — this task should stay open and be picked back up once an artist delivers at least one real sprite sheet and an Android device/emulator is available in the working environment.
- **Regression-verified**: `npm test` passes 51/51 (8 new tests: 6 for `checkAnimationBudget`'s own logic, 2 asserting `PlayScreen`'s actual character composition against the budget — no count regression from the pre-existing 43), `tsc --noEmit` is clean, and `npx expo export --platform web` builds successfully (2.13 MB web bundle, unchanged size, no errors). `expo start --web` was started and both `/` and `/play` returned HTTP 200 with no bundling or console errors in the Metro log; as in Epics 10, 10.5, and 11's own write-ups, no browser-automation tool was available in this session, so this is a bundle/serve-level check plus code review, not a rendered screenshot — and since reduce-motion's effect is only observable with a real sprite sheet registered (there are none), there is nothing to visually diff yet regardless.

---

### Epic 13 — Proprietary Licensing Correction

#### Objective

Replace the GNU GPLv3 license currently at the repository root with an explicit proprietary "All Rights Reserved" license, since this software is not intended to be open-source, and correct any other packaging metadata that currently implies otherwise.

#### User Story

As the product owner, I want the codebase to carry an explicit proprietary license instead of the GPLv3 text it currently has, so that no one can assume rights to copy, modify, or redistribute this software under GPL's copyleft terms.

#### Tasks

- Replace the full text of the root `LICENSE` file with a proprietary "All Rights Reserved" notice, copyright holder Robyn Skaling, 2026.
- Add/correct the `license` field in `package.json` (currently absent) to reflect the proprietary status — the npm convention for closed-source packages is `"UNLICENSED"`, which also causes `npm publish` to refuse to publish the package by default, a meaningful safety property worth having.
- Audit the rest of the repo (README, any other manifest files) for other GPL/open-source license references or badges that would now be inconsistent with the corrected LICENSE file, and correct them.
- Confirm this change only concerns the license under which this codebase itself is distributed — third-party dependencies (`react`, `expo`, etc.) remain under their own separate open-source licenses as installed packages, unaffected and requiring no action.

#### Depends On

None — standalone licensing/legal-correctness housekeeping, independent of the animation/gameplay epics.

#### Revised: Implemented

All four tasks above are done; one adjacent finding is flagged rather than silently fixed. What actually landed:

- **`LICENSE`** (repo root): the full GNU GPLv3 text is replaced end-to-end with a standard proprietary "All Rights Reserved" notice — copyright holder Robyn Skaling, year 2026 — including the standard "AS IS" warranty disclaimer and liability limitation paragraph (kept intact per this epic's own instruction not to leave the copyright holder with less liability protection than before).
- **`package.json`**: a `"license": "UNLICENSED"` field was added directly under `"private": true` (there was no pre-existing `"license"` key to conflict with, confirmed by reading the file before editing). `"UNLICENSED"` is the correct npm-convention value here rather than a real SPDX identifier like `"MIT"` or `"Apache-2.0"` — it's the standard way to mark a package closed-source, and it also makes `npm publish` refuse to publish by default, which is a meaningful accidental-publish safeguard for a private app that will never be an npm package.
- **Audit of README.md, `docs/`, and other manifests**: grepped the repo root and `docs/` (excluding `node_modules`) for `GPL`, `GNU`, `MIT`, `Apache`, `open source`/`open-source`, and generic `license` references. The only matches outside `LICENSE` and this epic's own spec text were unrelated hits on the literal substring "license" inside code/prose with no license-status meaning (e.g. `AnimationBudgetLimits`, a "custom limits override" test name, a `handleSubmit` handler, an `onSubmitEditing` prop) — no GPL/MIT/Apache badge, header, or reference exists anywhere in README.md or `package-lock.json`. No change was needed beyond the two files above.
- **`docs-private/` submodule audit — a real finding, flagged, not silently fixed.** `docs-private/LICENSE` (checked out at commit `0752a89`, remote `github.com/RobynSkaling/Private-Game-Planning-Documentation`) is the MIT-style **Unlicense** (public-domain dedication) — a separate, more permissive-than-GPL open-source license, and equally inconsistent with the proprietary status this epic establishes for the main repo. Nothing else in `docs-private/` (its five other `.md` docs) contains any GPL/MIT/Apache reference beyond that `LICENSE` file. This file was **not modified**: `docs-private` is a separate git repository with its own remote and commit history, and changing/committing its `LICENSE` is a distinct git operation from anything in this repo's own commit — outside what this epic's task list authorized. This is called out here for the product owner to action as a follow-up (likely a one-line swap to the same proprietary notice, committed and pushed within that submodule's own repo, then the submodule pointer bumped in this repo the same way Epic 10.5's `docs-private` bump was done).
- **Third-party dependency licenses** (`react`, `expo`, `zustand`, etc. in `node_modules`): confirmed untouched and out of scope, as instructed — this epic only concerns the license under which this repository's own code is distributed, not the separate open-source licenses those installed packages carry.
- **Regression-verified**: `npm test` passes 51/51 (no count change — this epic touches no test-covered logic), `tsc --noEmit` is clean, and `npx expo export --platform web` builds successfully (2.13 MB web bundle, unchanged size, no errors) — confirming the `package.json` edit didn't break JSON parsing or the build pipeline. No UI/runtime behavior changes are expected or were made, so there was nothing to smoke-test in the running app, per this epic's own scope.

---

## 11. Epics 14–17 — Phase 2: Second Gameplay Mode and Daily Rewards

These epics flesh out the two headline deliverables of **Phase 2 — Engagement and Retention** (Section 2, ~line 47), which until now existed only as one-line bullets ("Second gameplay mode" / "Daily streaks or rewards"). This is not new roadmap scope — it is the detailed definition of scope Phase 2 already anticipated. Epics 14–16 are the second gameplay mode; Epic 17 is the daily-rewards loop.

These are written at the product/UX-intent level for a UX designer and architect to review next. They deliberately stop short of data models, file locations, and algorithms — that is the architect's layer to add underneath these stories, in this same document, the same way Epics 8–12 added technical task breakdowns under product-defined objectives. Where a decision belongs to UX or architecture rather than product, it is flagged inline as an open question rather than pre-decided here.

### Terminology note the architect must read first — "medium" vs. `hard`

The founder's brief for the new mode described its four difficulty steps as **easy / medium / crazy / impossible**. That is the same four-tier ladder every game in this portfolio already shares — it is described colloquially, with "medium" standing in for the tier this codebase and the architecture doc already call **`hard`**. Throughout Epics 14–16, the founder's "medium" is written as **`hard`** to stay consistent with:

- `src/features/play/logic/game-modes.ts`, where the four modes are already `easy` / `hard` / `crazy` / `impossible` with a `GAME_MODE_CONFIG` per mode; and
- the private architecture doc's **cross-game tier contract** (`docs-private/mama-bears-spelling-bee-architecture.md`, Section 25.10.4): `easy → Passive`, `hard → Taunting`, `crazy → Interfering`, `impossible → Relentless`, tied to a deliberate age-targeting curve (≈6/7/8/9-year-olds) and explicitly declared a stable, portfolio-wide constant that must **not** be renamed, renumbered, or re-tiered per game or per mode.

**No fifth tier and no new tier names are introduced by the new mode.** The new game is a *sibling* of Honey Pot Flick built on the same four-mode selector already on the Home screen — the child picks the same `easy` / `hard` / `crazy` / `impossible` mode, and it means the same age-band thing it already means; only the gameplay behind the selection differs. Architect: if any implementation detail below seems to imply a new difficulty axis, treat that as a wording slip on our part and reconcile it back to the existing four-mode contract, not as a request to fork the ladder.

### Working name for the new mode — a suggestion, not a locked decision

The founder described this informally as a "centipede-style" mode where collected letters form a growing "snake" or "train." For an in-fiction, honey/bee-themed name consistent with the Mama Bear world, the product suggestion is **"Bee Line"** — a bee makes a *beeline* for each correct letter, and the collected letters trail behind it in a growing line, which fits the chain/train mechanic and the bee theme without needing the child to know the word "centipede." Alternatives worth putting in front of the UX designer: **"Honey Trail," "Nectar Run," "Busy Bee,"** or **"Buzz Train."**

**This is a naming suggestion for the UX designer to react to, not a locked decision.** "Bee Line" is used as a placeholder label throughout Epics 14–16 purely so the epics read cleanly; the final in-fiction name (and how it appears on the mode selector) is UX's call. Flagged here so nobody downstream treats "Bee Line" as a shipped, signed-off name.

### How the character/villain system connects to Bee Line — a question for UX/architecture, not decided here

Honey Pot Flick already drives the shared `CharacterAnimationState` contract (Epics 8–10) and the villain pool / behavior-tier / honey-steal machinery (Epic 10.5): Mama Bear reacts to correct letters and word completion, and a tier-scaled villain taunts, interferes, and at higher tiers tries to steal honey. Bee Line raises the obvious question of **how much of that reuse carries over** — e.g. does Mama Bear celebrate a completed word the same way, does a villain react to a wrong-order pickup or a wrong-letter scatter, and does the `impossible`-tier timeout explosion (Epic 16) get a villain reaction the way a Honey Pot Flick miss does? This is deliberately **not** decided in these epics: it touches the existing `CharacterAnimationState` contract and the villain-behavior/tier model, which are the architect's to extend, and the emotional staging of those reactions is UX's to design. See "Open Questions for UX/Architecture Review" at the end of Epic 15 and Epic 16.

---

### Epic 14 — Bee Line: Core Collect-in-Order Mechanic (All Four Tiers)

#### Objective

Deliver the second gameplay mode as a sibling of Honey Pot Flick: a 2D screen of scattered letters that the child collects **in the correct spelling order**, with the interaction escalating across the same four difficulty modes already on the Home screen (`easy` / `hard` / `crazy` / `impossible`). This epic owns the core collect-in-order interaction and its per-tier behavior. The running-score/penalty model is Epic 15; the `impossible`-tier time pressure and explosion moment is Epic 16 — this epic delivers everything up to but not including those two.

#### User Story

As a child aged 6–9, I want to hunt for the letters of my word around the screen and collect them one by one in the right order — with a bee that gathers them into a growing trail as I go — so that spelling feels like an active treasure hunt instead of typing.

#### Tasks

- Add Bee Line as a second gameplay mode reachable from the **existing four-mode selector on the Home screen** — the child picks `easy` / `hard` / `crazy` / `impossible` exactly as they do for Honey Pot Flick, and it maps to the same age-band tiers. The mode should feel like a sibling built on the same mode selection, not a separate difficulty system (see the terminology note above).
- Present the target word to the child (reveal/pronunciation consistent with how Honey Pot Flick already introduces a word) and scatter its letters across a 2D play field, with the collection target being "select the letters in correct spelling order to build the word."
- Implement the per-tier interaction escalation defined in the acceptance criteria below (`easy` = tap-in-order, `hard`+ = drag-and-chain, `crazy`+ = decoys mixed in, `impossible` = randomized positions each attempt).
- Give clear immediate feedback on each correct pickup (the letter joins the trail; sound/visual confirmation), consistent with the product's "silly, satisfying, fast" tone.
- Advance to the next word on completion and support a "next word" flow, matching the round/session shape Honey Pot Flick already uses so a session can mix or repeat words the same way.
- Leave the running-score behavior and the wrong-order / wrong-letter mistake handling to Epic 15, and the `impossible` timer/explosion to Epic 16 — this epic should treat a fully-collected word as "complete" and hand off to those epics for what happens on mistakes and under time pressure.

#### Acceptance Criteria by Tier

Each tier is independently testable — "done" for the mode means all four of these are demonstrably true. The tiers are additive: each higher tier keeps the prior tier's behavior and layers one new demand on top.

- **`easy` (Passive tier, ≈6-year-olds) — tap-to-collect, no chain.**
  - Letters are scattered on the field; the child collects them by **tapping/selecting** them one at a time.
  - No dragging and no chain/trail-forming is required at this tier — it is the simplest possible expression of the mechanic.
  - Tapping the correct next letter registers it as collected with positive feedback; the word builds up in order as correct letters are tapped.
  - Only the word's own letters are present (no decoys) — consistent with `easy`'s existing `decoyLetterCount: 0` in `GAME_MODE_CONFIG`.
  - *Note flagged for UX/architecture:* whether `easy`'s tap mode still shows a light version of the growing-trail visual (for consistency with higher tiers) or stays deliberately trail-free is a UX call — the founder specified "no chain-forming yet" for the mechanic, but the visual affordance is open.

- **`hard` (Taunting tier, ≈7-year-olds) — drag-to-collect, growing trail.**
  - The child **drags** to pick letters up in the correct order (rather than tapping).
  - Each correctly collected letter **joins a visibly growing trail/train** that now travels together — the "snake gets longer with each correct pickup," led by the bee.
  - The trail's letters move together as a single connected chain as the child continues collecting.
  - Still no decoys at this tier (consistent with `hard`'s current `decoyLetterCount: 3` being a *Honey Pot Flick* tuning value — see open question below on whether Bee Line reuses or overrides per-mode decoy counts).

- **`crazy` (Interfering tier, ≈8-year-olds) — decoys mixed in.**
  - Same drag-and-chain mechanic as `hard`.
  - **Decoy letters** (letters not in the target word, and/or incorrect/repeated letters) are scattered among the correct ones. The child must visually pick out and collect **only** the correct letters, in the correct order, ignoring the decoys.
  - Decoys are present on the field but collecting one is a *mistake* — the consequence of touching a decoy is defined in Epic 15 (wrong-letter scatter), not here.

- **`impossible` (Relentless tier, ≈9-year-olds) — decoys + randomized positions (timer/explosion is Epic 16).**
  - Builds on `crazy`: correct and incorrect letters on the field, **and the positions are re-randomized each attempt** rather than fixed, so the child can't memorize a spatial pattern across retries.
  - This epic delivers the decoy + position-randomization base only. The hard time-pressure mechanic (speeding music, word-length-scaled timer) and the letter-trail explosion on timeout are **Epic 16** and are not in scope here.

#### Open Questions for UX/Architecture Review

- **Decoy counts per tier for Bee Line.** `GAME_MODE_CONFIG` already carries a `decoyLetterCount` per mode, but those numbers were tuned for Honey Pot Flick's flick field. Does Bee Line reuse the same per-mode decoy counts, or does the drag-and-hunt field want its own tuning? Product's steer: Bee Line should honor the same *tier intent* (none at `easy`/`hard`, "lots" at `crazy`, "tons" at `impossible`) but the exact counts are tuning work for the architect/UX, not something to hard-code here.
- **Field layout, letter density, and reachability on small screens.** Scattering many letters (plus decoys at `crazy`/`impossible`) on a phone-sized field, with a draggable growing trail, raises real ergonomics and hit-target questions for 6–9-year-old hands. This is UX's to design and the architect's to sanity-check for feasibility on the target devices.
- **Does the trail's own body become an obstacle?** As the trail grows, can it overlap or block access to yet-uncollected letters, and is that intended difficulty or an annoyance to avoid? Flagged for UX.

#### Depends On

The existing Home-screen four-mode selector and `game-modes.ts` (`easy`/`hard`/`crazy`/`impossible` + `GAME_MODE_CONFIG`), and the word-reveal/session flow Honey Pot Flick already uses. Independent of Epics 15 and 16 in the sense that this epic can be built and reviewed first, but the mode is not shippable to children until Epic 15's scoring/mistake handling lands (a collect-in-order game with no consequence for a wrong pickup is incomplete).

---

### Epic 15 — Bee Line: Running Score and Mistake-Handling Model

#### Objective

Define how Bee Line scores a word attempt and how it responds to the two kinds of mistake the collect-in-order mechanic makes possible. This is a **deliberate departure from Honey Pot Flick's scoring model** and product wants that difference made explicit for the architect, because it changes an assumption baked into game #1.

#### User Story

As a child, I want every letter I collect to count, and I want a clear, fair, silly consequence when I grab the wrong letter or grab a letter out of order — so the game feels responsive and stakes-y without feeling punishing.

#### Tasks

- Make score a **running total that can go both up and down within a single word attempt** — every letter the child collects contributes to the score, so the score is an additive/subtractive running value per word attempt, not a monotonic counter.
- Handle **right letter, wrong order** (the child collects a letter genuinely in the word but not the next one needed): trigger a warning — a sound cue plus visual feedback — and **drop the score**.
- Handle **wrong letter entirely** (a decoy/non-word letter, at `crazy`/`impossible` where decoys exist): **scatter all collected letters** (destroy the in-progress trail), require the child to **restart the word from the beginning**, and **drop the score**.
- Keep the score-and-mistake behavior consistent with the product's "silly, recoverable, not punitive" tone — a mistake should read as a fun setback the child immediately understands, not a scary failure (match the tone precedent set by Epic 10.5's honey-steal mechanic).

#### Scoring Model — Explicit Difference From Honey Pot Flick (architect, read this)

- **Honey Pot Flick's score is monotonically increasing** — it only ever goes up as the child succeeds.
- **Bee Line's score must be able to drop mid-word.** The founder specifically wants "every letter they add" to contribute to score *so that* the score is capable of dropping when a later mistake happens. This is a real product/architecture difference worth the architect's attention — Bee Line needs an additive/subtractive running score per word attempt, which may not fit whatever assumption game #1's scoring code makes about scores only rising. Product is flagging the *requirement* (score goes up and down within an attempt); the architect owns how that reconciles with the shared score/mastery data model.
- **Mastery/progress data is a separate concern from this running score.** Product's steer (for the architect to confirm): the up-and-down running score is an in-game feel mechanic; it should not corrupt the spelling-accuracy/mastery data parents see, the same separation Epic 10.5 kept between the cosmetic `honeyStash` and real progress data. Whether the running score is purely cosmetic or also feeds a per-session total is a question for the architect — but it must not distort mastery truth.

#### Open Questions for UX/Architecture Review

- **On a right-letter-wrong-order pickup, does the in-progress trail break/reset, or does it stay intact while that pickup simply doesn't count toward progress?** The founder did **not** specify this and it is a genuine design fork. Do **not** assume an answer. Two readings are both plausible: (a) the wrong-order letter is rejected, the trail continues, only the score dips; or (b) the wrong-order pickup partially or fully breaks the chain like a wrong letter does. This needs a UX/architecture decision — it materially changes how forgiving the mid-tier feels for a 7–8-year-old.
- **Relative size of the two penalties.** The founder did not specify whether the "wrong letter entirely" penalty should be larger than the "right letter, wrong order" penalty. Product's *suggested* assumption (not a locked number): the wrong-letter penalty should be the larger of the two, because it's the more disruptive/costly mistake (it scatters the whole trail and forces a restart), whereas a wrong-order pickup is a smaller slip. But the actual numbers are tuning work for later — do not hard-code a value here; this is flagged for UX/architecture to set once the mechanic is playable.
- **How does `easy`'s tap-in-order mode score, given it has no chain and no decoys?** `easy` has no decoys (so no "wrong letter entirely" case) and no trail to scatter, but it should still track correctness/score sensibly. Exactly how `easy` participates in this running-score model — e.g. does a wrong-order tap still dip the score and cue a warning, with no scatter since there's no chain — is for the architect/UX designer to confirm. Product's steer: `easy` should feel consistent with the higher tiers' fairness, just gentler.
- **Do villains/Mama Bear react to these mistakes (and to a completed word)?** Bee Line mistakes are the natural analog of a Honey Pot Flick miss, which already drives villain `Challenging`/`BeingNaughty` reactions and, at higher tiers, a honey-steal attempt (Epic 10.5). Whether a wrong-order or wrong-letter mistake in Bee Line should trigger the same villain reactions — and whether a completed word triggers Mama Bear's celebration the same way — touches the shared `CharacterAnimationState` contract and the villain-behavior/tier model, so it is the architect's to extend and UX's to stage. Flagged, not decided here.

#### Depends On

Epic 14 (the collect-in-order mechanic and its per-tier decoy/trail behavior must exist before there's anything to score or penalize).

---

### Epic 16 — Bee Line: `impossible`-Tier Time Pressure and Explosion Moment

#### Objective

Deliver the `impossible`-tier (Relentless, ≈9-year-olds) escalation for Bee Line: a hard, word-length-scaled time limit with accelerating music, and a deliberately fun, visceral letter-trail explosion when the timer runs out. This is the top of Bee Line's age curve and must read as exciting, never punishing.

#### User Story

As a confident 9-year-old, I want a real race-against-the-clock version where the music speeds up and my letter trail dramatically explodes if I run out of time — so the hardest mode feels thrilling and re-playable, not stressful or discouraging.

#### Tasks

- Layer a **hard time limit** onto the `impossible`-tier Bee Line attempt (which already has decoys + randomized positions from Epic 14): the child must fully spell the word before time runs out.
- Scale the time budget to **word length** — longer words get proportionally more time, not a flat timer for every word.
- Play **fast-tempo music that progressively speeds up** over the course of the attempt, building tension toward the deadline.
- On timeout (word not completed in time), trigger the **letter-trail explosion**: the collected trail bursts apart in a "really fun, visceral" way, and the child **restarts that word from scratch**.
- Keep the explosion/failure moment squarely in the product's "silly, recoverable, not punitive" tone — see the Tone Requirement below.

#### Acceptance Criteria

- At `impossible`, an on-screen time budget is visible/felt and counts down over the attempt.
- The time budget is a function of the number of letters in the target word (a 3-letter word gets less time than an 8-letter word), not a fixed constant.
- Background music is fast-tempo and audibly accelerates as the deadline approaches.
- Completing the word before the timer expires resolves the word successfully (handing off to the normal completion flow).
- Failing to complete before the timer expires triggers the letter-trail explosion and restarts the same word from the beginning.
- The explosion reads as a fun, exciting "boom," not a scary or shaming failure state (verified against the tone precedent below).

#### Tone Requirement (stated explicitly by the founder — do not soften into "punishing")

The timeout explosion (the trail bursting apart) must read as **fun and visceral/exciting**, not punishing, scary, or discouraging for a 6–9-year-old. This is consistent with the product's established "silly, recoverable, not punitive" failure tone — match the house style precedent set by Epic 10.5's honey-pot-steal mechanic (`docs-private/mama-bears-spelling-bee-architecture.md`, Section 25.11.5, "Consequences and Comeback / Tone Safeguards"): failure is a comedic beat with an immediate, obvious path to try again, and Mama Bear reacts with playful exasperation rather than distress. UX owns the exact art/audio staging of the explosion; product's non-negotiable is only the *emotional read* — the child should want to hit "try again," not feel told off.

#### Open Questions for UX/Architecture Review

- **Exact time-per-letter formula and floor/ceiling.** "Proportional to word length" sets the shape; the actual seconds-per-letter, any minimum time for very short words, and any cap for very long words are tuning work for the architect/UX once the mode is playable — not hard-coded here.
- **Music acceleration curve and its relationship to the audio system.** How fast the music ramps, and how the accelerating-music requirement fits the existing audio architecture (TTS via `speech-service.ts` and the pre-recorded clip path from Epic 11), is the architect's to design. Product only specifies "fast and progressively speeding up."
- **Does a villain react to the timeout explosion?** A Honey Pot Flick miss already drives villain reactions and steal attempts (Epic 10.5). Whether the `impossible` timeout explosion should get a gleeful villain reaction (and whether that would over-punish the tone, i.e. the child both loses the word *and* gets taunted) is a UX/architecture question touching the `CharacterAnimationState` contract — flagged, not decided. Product's lean: if a villain reacts, keep it in the "silly rivalry" register (a cheeky cackle), never a "you failed" register.
- **Is the timer purely `impossible`-tier, or does any lighter time pressure exist below it?** The founder scoped the hard timer to `impossible` only. Confirming no timer leaks into `crazy` (which stays challenging via decoys + randomized-ish layout but not a clock) keeps the age-band contract intact — flagged for confirmation.

#### Depends On

Epic 14 (the `impossible`-tier decoy + randomized-position base) and Epic 15 (the mistake/restart model the explosion's "restart the word from scratch" outcome plugs into). Benefits from the audio work in Epic 11 being in place for the accelerating-music requirement.

---

### Epic 17 — Daily Streaks and the Silly Sticker Album

#### Objective

Deliver Phase 2's daily-engagement reward loop: a persistent, cross-session **sticker album** the child fills by playing on consecutive days, themed around collecting honey pots and bees as silly digital stickers. The loop must give a 6–9-year-old a warm reason to come back tomorrow, in a tone that is funny and non-punishing about missed days.

#### User Story

As a child aged 6–9, I want to earn a new silly sticker for my album each day I play and keep a streak going — so I have a fun reason to come back, and a growing collection I'm proud of.

#### Tasks

- Define the **earn trigger** for a sticker: product's recommended default (open to UX) is that a sticker is awarded on the child's **first completed play session of a calendar day** — completing at least one word/round, not merely opening the app — so the reward rewards *playing*, not just launching. See the open question on trigger choice.
- Track a **daily streak** (consecutive days with a completed session) and surface it to the child in an encouraging, low-pressure way.
- Make missed-day handling **non-punishing**, consistent with this product's "recoverable, not punitive" tone (see the streak-mechanics section below) — a missed day should not feel like a harsh reset that discourages a 7-year-old from coming back.
- Build the **sticker album** as a persistent, cross-session/day-over-day collection the child can browse — stickers earned accumulate and stay collected across sessions and app restarts.
- Add **streak-milestone moments** (e.g. a special/rarer sticker at a few-day streak) so the loop has small peaks to aim for, not just a flat daily drip.
- Keep the whole loop in a **silly, funny** register — the stickers, the streak celebration, and the milestone moments should all read as playful, matching the Mama Bear world.

#### Streak Mechanics — Product Steer (age-appropriate, non-punitive)

Consistent with the product's established "recoverable, not punitive" tone, product's recommendation (for UX to confirm/adjust) is **not** a hard reset-to-zero on a single missed day:

- Prefer a gentle model — for example a **streak-freeze / grace day** (one missed day is forgiven, perhaps themed as a bee "having a nap" or Mama Bear "keeping your honey warm"), or a streak that decays gently rather than snapping to zero.
- The emotional goal: a child who misses a day should feel invited back, not penalized. A punishing reset that makes a 7-year-old feel they "lost everything" is exactly the tone this product avoids.
- The exact grace-period length and decay behavior are tuning/UX decisions, not locked here — the locked product requirement is only "non-punishing about missed days."

#### Relationship to Epic 10.5's `honeyStash` — a distinction the architect must keep (do not conflate)

The sticker album is a **different system** from Epic 10.5's `honeyStash`, and product is flagging this explicitly so the two are not merged:

- **`honeyStash` (Epic 10.5, in `session-store.ts`)** is a **single-session, in-fiction currency** — "honey pots collected this session" — already fully scoped to the villain steal/defend/recover mechanic, and deliberately kept separate from `score`/mastery data. It resets each session and is owned entirely by the steal mechanic.
- **The sticker album (this epic)** is a **cross-session/day-over-day persistent collection** driven by daily engagement, not by in-session honey-steal events.

These are two different concerns — a session-local villain-mechanic currency vs. a persistent daily-reward collection — and must not be conflated or made to share state just because both are honey/bee-themed. Do not touch `honeyStash` for this work. The architect owns where the persistent album/streak state actually lives (it is clearly *not* session-store), but product is drawing the boundary here so the two systems don't get merged by accident.

#### Illustrative Silly Sticker Ideas (suggestions for the UX designer, not locked)

These are illustrative to give the UX designer something concrete to react to — **not** locked content decisions:

- **Named silly bee characters** with funny personalities — e.g. "Sir Buzzworth," "Queen Bee-atrice," "Bumble the Clumsy," "Nervous Nigel the Wasp-Who-Insists-He's-A-Bee."
- **Rarity/variety tiers** — common everyday bees/pots, plus rarer "golden honey pot" or "royal bee" stickers reserved for streak milestones, so a longer streak yields a more special sticker.
- **Silly honey-pot stickers** — a honey pot wearing sunglasses, an over-full pot dripping everywhere, a tiny pot labeled "extra sticky."
- **Seasonal/occasional stickers** — a holiday bee, a rainy-day bee with a tiny umbrella — as an optional way to keep the collection feeling fresh over months (which also supports Phase 3's longer-term retention goals).
- **Duplicate handling** as a silly beat rather than a dead end — e.g. a duplicate becomes a "twin bees" gag — is a UX call worth considering, flagged rather than specified.

#### Open Questions for UX/Architecture Review

- **Exact earn trigger.** Product recommends "first completed session of the day." Alternatives the UX designer should weigh: pure daily login (rewards showing up, not playing — weaker for a learning product), or gating some stickers behind longer streaks only. The choice affects how much the loop rewards genuine practice vs. mere app-opens.
- **Streak grace/freeze specifics.** Grace-day length, decay behavior, and how the streak is themed/visualized are UX's to design within the "non-punishing" constraint above.
- **Album size, pacing, and "completion."** How many stickers exist, how fast they're earned, and whether the album is ever "finished" (or refreshes seasonally) affects long-term retention and is a UX/content decision, with an eye toward Phase 3's longer-term-use goals.
- **Where the persistent album/streak state lives and how it survives reinstalls.** Explicitly the architect's call — flagged only to reinforce that it is *not* `session-store.ts`/`honeyStash`, and to raise whether a missed-day calculation needs to be robust to device clock changes / timezone travel for a kids' app (a real edge case worth the architect's attention, not a product decision).
- **Per-child vs. per-device.** With multiple child profiles (Epic 1), is the album per-child? Product's lean is yes (each child owns their own collection and streak), but flagged for confirmation since it affects the data model.

#### Depends On

The completed-session signal from the core gameplay loop (Honey Pot Flick today, plus Bee Line once Epics 14–16 land) to know a day's play counts, and the child-profile flow (Epic 1) if the album is per-child. Independent of Epics 14–16 in that it can be built against Honey Pot Flick alone and automatically extends to Bee Line once that mode exists.

---

## 12. Epics 18–26 — Engineering Breakdown of Phase 2 (Bee Line and Daily Rewards)

Epics 14–17 (Section 11) captured product intent for Phase 2 and were reviewed and answered by UX (`docs-private/mama-bears-spelling-bee-ux.md`, Section 13, Steps 13–22) and architecture (`docs-private/mama-bears-spelling-bee-architecture.md`, Sections 26–27). This section is the third and final layer: the buildable, sequenced engineering epics underneath that product+UX+architecture stack, at the same file-level task granularity Epics 8–12 used to turn Section 25's animation architecture into real work. Nothing here re-opens a product or UX decision — where product/UX/architecture left a question genuinely open (a tuning number, an unratified fork), it is carried forward explicitly on the relevant epic below rather than quietly resolved.

**A judgment call on epic boundaries, flagged up front rather than buried in one epic's own notes:** Architecture Section 26.10's own "Suggested Engineering Next Steps" lists six ordered steps for Bee Line, and Section 27.9 lists six more for daily rewards. Rather than mirroring those step lists 1:1 into exactly six-plus-six epics, or collapsing all of Section 26 into one "build Bee Line" epic, this breakdown does two things differently, both judgment calls:

1. **26.10's step 1 (pure module) is split into two epics here, not one.** The architecture doc's own step 1 bundles the field/collection model *and* the running-score model (`applyScore`) into a single suggested step. This breakdown keeps them as two separate epics (18 and 20) instead, because the roadmap's own product-level epics (14 vs. 15) already drew that exact line — the running score is called out in Epic 15 as "a deliberate departure from Honey Pot Flick's scoring model" with its own dedicated open questions (the wrong-order chain fork, penalty ratios). Splitting them lets each stay independently reviewable at the size Epic 8/Epic 10 set as this project's precedent, and mirrors the sequencing note in Section 11: "the running-score epic in principle [is independent] but the mode is not shippable without scoring."
2. **26.10's step 2 (the screen) is its own epic (19), not folded into step 1's epic (18).** This repeats the exact Epic 8 → Epic 10 precedent from the animation system: Epic 8 shipped a pure, art/screen-agnostic data model first and Epic 10 wired it into a real screen second. Doing the same for Bee Line's second gameplay mode keeps the first deliverable pure-logic, unit-testable off-React, and reviewable without needing a running app — the same reason Epic 8 was scoped that way.

The result is nine epics: six for Bee Line (18–19 core mechanic and screen, 20 scoring/mistakes, 21 decoys, 22 the standalone `GameMusicService`, 23 the `impossible` timer/explosion, 24 character staging) and two for daily rewards (25 persistence foundation, 26 badge/album UI) — plus 22 and 25 are independent infrastructure buildable in parallel with the rest. Every epic below cites the specific architecture subsection(s) and UX step(s) it is built from; read those alongside each epic rather than re-deriving intent from this summary.

---

### Epic 18 — Bee Line: Field/Letter Data Model and the Collect-in-Order State Machine

#### Objective

Build the pure, RN-independent foundation the rest of Bee Line depends on: the per-mode config scaffold, the scattered-field/letter data model (with decoy and position-randomization support built into the shape from day one, even though no tier turns decoys on yet), and the `resolvePickup` collect-in-order state machine. This is the Bee Line analog of Epic 8 — art/screen-agnostic, testable off-React, built before anything renders — and follows the same "pure logic in a sibling module, unit-tested with an injectable RNG" convention `honey-pot-flick.ts` and `steal-attempt.ts` already established (architecture Sections 26.2–26.5).

#### User Story

As an engineer, I want a typed, pure Bee Line field/letter/collection model so that screen code (Epic 19) can ask "was this pickup correct, wrong-order, or wrong-letter?" and "what does the field look like right now?" without any of that logic living inside a React component.

#### Tasks

- Add `src/features/play/logic/bee-line.ts` (sibling to `honey-pot-flick.ts` and `game-modes.ts`, per architecture 26.2/26.10 step 1):
  - `BeeLineInput` (`'tap' | 'drag'`) and `BeeLineModeConfig` / `BEE_LINE_MODE_CONFIG: Record<GameMode, BeeLineModeConfig>`, extending the `GAME_MODE_CONFIG` pattern as its **own** config object (architecture 26.3) rather than adding fields onto `GameModeConfig`. Populate `input`/`showTowedTrail` for all four tiers now (`tap` + no towed trail at `easy`; `drag` + towed trail at `hard`+, per roadmap Epic 14's acceptance criteria). Leave `decoyLetterCount: 0` and `randomizePositionsPerAttempt: false` at every tier, and `timer`/`music` `undefined` everywhere — those fields exist on the type so Epics 21/23 need zero redesign, but this epic does not populate them.
  - `LetterTileKind`, `ScatteredLetter`, `BeeLineField`, and the pure `buildBeeLineField(word, decoyCount, field, options?)` builder (architecture 26.4), reusing `Point`/`Bounds`/`shuffleLetters` from `honey-pot-flick.ts` and a `DECOY_LETTER_POOL`-style pool for decoy letters. Repeated letters (e.g. "bee") get one tile per occurrence via `orderIndex`. Accepts an injectable `random` function (mirroring `villain-pool.ts`'s injected-RNG convention) so placement is deterministic and testable.
  - `CollectionOutcome`, `ChainPolicy`, `BeeLineTuning`, `CollectionState`, and the pure reducer `resolvePickup(state, tile, tuning)` (architecture 26.5) — no score math inside it; scoring is Epic 20's concern, kept deliberately separate per 26.5's own instruction.
  - `DEFAULT_BEE_LINE_TUNING` following UX Step 18's *recommendation* (`wrongOrderPolicy: 'keep-chain'`, `wrongLetterPolicy: 'break-chain'`) as the launch default — implemented as the tunable parameter architecture 26.5 designed for, not hard-coded as if product had ratified it (see Open Questions).
- Add `src/features/play/logic/bee-line.test.ts` under the existing `node --import tsx --test` setup: field tiles never overlap within `minTileSpacingPx`; decoy tiles are structurally indistinguishable from correct tiles except `kind`/`orderIndex`; a repeated-letter word produces one tile per occurrence with the right `orderIndex`s; `resolvePickup` correctly classifies `correct`/`wrong-order`/`wrong-letter`; both `ChainPolicy` values behave as documented; and `easy` (no decoys, `keep-chain`) never produces a `chainBroke: true` outcome.
- Add a short module-level doc comment on `bee-line.ts` cross-referencing `docs-private/mama-bears-spelling-bee-architecture.md` Section 26, the way `steal-attempt.ts` cross-references Section 25.11.

#### Open Questions / Tuning Carried Forward (Not Resolved by This Epic)

- **Wrong-order chain-break fork** (roadmap Epic 15; architecture 26.11). `wrongOrderPolicy` defaults to `'keep-chain'` per UX Step 18's recommendation; product has not ratified it. Flipping `DEFAULT_BEE_LINE_TUNING.wrongOrderPolicy` to `'break-chain'` is a one-line, no-redesign change if product decides otherwise — that is the entire point of it being a tuning value here rather than a structural choice.
- **Decoy counts per tier and field density/reachability on small screens** (roadmap Epic 14; architecture 26.11). `decoyLetterCount` is `0` everywhere in this epic's config; real numbers are Epic 21's tuning work, not this epic's.
- **Whether `easy` shows the faint static trail-preview dotted line in the "word so far" strip** (UX Step 14) is a screen-layer (Epic 19) concern, not this epic's.

#### Depends On

Nothing — foundational, can start immediately, the same way Epic 8 was the animation system's foundation. Reads `GameMode` from the existing `game-modes.ts` and `Point`/`Bounds`/`shuffleLetters` from the existing `honey-pot-flick.ts`, both read-only.

#### Revised: Implemented

All three tasks above are built and verified. What actually landed:

- **`src/features/play/logic/bee-line.ts`**: `BeeLineInput`, `BeeLineModeConfig` (including the `timer`/`music` fields that stay `undefined` until Epics 21/23 populate them), `BEE_LINE_MODE_CONFIG` (tap/no-trail at `easy`, drag/trail at `hard`+, `decoyLetterCount: 0` and `randomizePositionsPerAttempt: false` everywhere per this epic's own scope); `LetterTileKind`, `ScatteredLetter`, `BeeLineField`, and `buildBeeLineField(word, decoyCount, field, options?)`; `CollectionOutcome`, `ChainPolicy`, `BeeLineTuning`, `DEFAULT_BEE_LINE_TUNING`, `CollectionState`, `createCollectionState`, and the pure reducer `resolvePickup(state, tile, tuning)`. A module-level doc comment cross-references architecture Section 26, matching `steal-attempt.ts`'s citation style.
- **Field placement algorithm**: `buildBeeLineField` places each tile (word letters first, then decoys) via rejection sampling — up to 200 random-position attempts per tile against a `minTileSpacingPx` (default 64px, matching the default tile size) exclusion radius from every already-placed tile, falling back to the last attempted position rather than looping forever if the field is too crowded. This satisfies architecture 26.4's "no tile overlaps or hides another" requirement without needing a full Poisson-disc implementation, which would have been more machinery than a phone-sized field with a handful of tiles warrants.
- **Repeated letters**: each occurrence of a letter (e.g. "bee") gets its own tile with its own `orderIndex`, exactly per architecture 26.4 — verified directly in `bee-line.test.ts`.
- **`resolvePickup` contract**: classifies a pickup as `correct` (tile's `orderIndex` matches `nextExpectedIndex`), `wrong-order` (a `correct`-kind tile whose `orderIndex` doesn't match), or `wrong-letter` (any `decoy`-kind tile), then applies the relevant `ChainPolicy` (`keep-chain` leaves `next` untouched aside from the outcome; `break-chain` empties `collected`/resets `nextExpectedIndex` to 0 and sets `chainIntact: false`). No score math lives in this function, per architecture 26.5's explicit instruction that classification and scoring be tunable independently (Epic 20's job).
- **`easy`'s participation** is enforced by construction, not a special case: because `BEE_LINE_MODE_CONFIG.easy.decoyLetterCount` is `0`, a real `easy` field never contains a `decoy`-kind tile, so `resolvePickup` can only ever be called with `correct`-kind tiles there and can only return `correct`/`wrong-order` — never `wrong-letter`, never `chainBroke: true`. `bee-line.test.ts` verifies this directly by driving a full `easy`-shaped word (no decoy tiles constructed at all) through both an out-of-order pickup and a full correct completion.
- **One addition beyond the architecture doc's literal type sketch, flagged as a judgment call**: architecture 26.5 documents `chainIntact: false` as "the frame a chain break is being animated," which implies something has to flip it back once that animation finishes, but doesn't specify what. Rather than leaving that undefined or silently deciding the reducer resets `chainIntact` to `true` immediately (which would make the field meaningless), a small additional pure function, `acknowledgeChainBreak(state)`, was added: a no-op when the chain is already intact, otherwise flips `chainIntact` back to `true`. This mirrors the "host owns real timing, pure module exposes a resolve step" pattern `steal-attempt.ts` already established for `resolveStealWindUp`, and gives Epic 19's screen code an explicit hook to call once its scatter animation completes, rather than inventing that lifecycle ad hoc when the screen gets built.
- **`shuffleLetters` in `honey-pot-flick.ts` gained an injectable `random` parameter** (defaulting to `Math.random`, so every existing call site is unaffected): it was previously hard-wired to `Math.random()` internally, which made `buildBeeLineField`'s decoy-selection step non-deterministic even when a `random` function was passed in for tile placement. This is a minimal, additive, non-breaking change to existing behavior, made because architecture 26.4 explicitly calls for reusing `shuffleLetters` for decoy selection and 26.2 calls for the whole module to be "unit-testable with an injectable RNG" — without this fix, that requirement couldn't actually be met for the decoy-selection path. `DECOY_LETTER_POOL` was also changed from a private `const` to an `export const` in the same file, per architecture 26.2's explicit instruction to reuse it rather than duplicate a second decoy-letter list.
- **Regression-verified**: `npm test` passes 72/72 (21 new tests in `bee-line.test.ts` covering `BEE_LINE_MODE_CONFIG`'s shape, field generation — correct-letter ordering, repeated-letter handling, decoy count/exclusion, minimum spacing, field-bounds containment, RNG determinism — `resolvePickup`'s three-way classification, both `ChainPolicy` values, `easy`'s scatter-proof guarantee, and `acknowledgeChainBreak`; no regressions in the pre-existing 51), `tsc --noEmit` is clean, and `npx expo export --platform web` builds successfully (2.13 MB web bundle, unchanged — expected, since this epic touches no screen/UI code and adds no new assets). `expo start --web` was started and both `/` and `/play` returned HTTP 200 with no console errors in the Metro log; there is nothing to visually check for this epic specifically, since it adds zero rendered UI — `bee-line.ts` is not imported from any screen yet (that wiring starts in Epic 19).

---

### Epic 19 — Bee Line: Screen and Input — Tap-to-Collect (`easy`) and Drag-to-Collect with a Growing Trail (`hard`)

#### Objective

Build the actual playable Bee Line screen consuming Epic 18's pure module: the Home-screen game-picker row (UX Step 13), and the `easy` tap and `hard` drag-and-tow interactions (roadmap Epic 14's `easy`/`hard` acceptance criteria; UX Steps 14–15). This is the Bee Line analog of Epic 10 — wiring a data model that already exists into a real, playable screen.

#### User Story

As a child aged 6–7, I want to see Bee Line as a second game I can pick from Home, and to collect its letters by tapping (or, once I'm a bit older, dragging them into a growing trail behind a little bee) in the right spelling order.

#### Tasks

- Add the "Choose your game" pill row to `HomeScreen.tsx`, above the existing mode row (UX Step 13): one pill per game (`🍯 Honey Pot Flick`, `🐝 Bee Line`), using `secondary` (Blue Violet) as the selected-game color so it reads as visually distinct from the `primary`-colored mode row below it. Persist the selected game the same way `game-mode-store.ts` persists mode (a small sibling store, or an added field on that store — implementer's call at build time, flagged as a small open decision rather than prescribed here).
- Add `src/features/play/screens/BeeLineScreen.tsx` (sibling to `PlayScreen.tsx`) and a new Expo Router route (e.g. `app/bee-line.tsx`) that Home's Play button routes to when Bee Line is the selected game.
- Reuse the existing word-reveal/pronunciation flow (`speech-service.ts`) and the `getNextWord` round-advance helper from `honey-pot-flick.ts`, so a Bee Line session shapes up the same way an HPF session does.
- Render the scattered field built by `buildBeeLineField` as honeycomb-hex letter tiles (the shared tile art called for across UX Steps 14–16).
- `easy`: tap-to-collect input calling `resolvePickup` on each tap; a static "word so far" strip at the top of the screen with a faint dotted connector previewing the trail visual (UX Step 14) — no towed-trail motion at this tier.
- `hard`+: drag-to-collect input with a small bee mascot at the head of a jointed, honeycomb-connector trail that tows collected tiles (UX Step 15). Per architecture 26.4's confirmed feasibility note, implement the trail as a **render-only** layer: collected tiles are removed from the field's hit-testable/gesture-responder set and redrawn as the trail, so the trail is provably never an obstacle to remaining tiles by construction, not by careful z-index tuning alone.
- Word completion hands off to the same "next word" flow HPF uses. Leave the running score, mistake feedback, decoys, `impossible` timer, and character reactions to Epics 20–24 — this epic treats a fully-collected word as simply "complete," matching how roadmap Epic 14 scoped itself.

#### Open Questions / Tuning Carried Forward

- **Game-pill icon + label vs. icon-only, and total Home-screen scroll height on the smallest supported device** once the new pill row is added (UX Step 13's own flagged assumptions) — needs a real-device check, not assumed here.
- **Whether the trail's rendering needs a dedicated animation library primitive** (Reanimated shared values driving each trailing tile's position) or can be done with simpler layout animation is an implementation detail to resolve while building, not a product/UX open question — noted here only so it isn't silently assumed trivial.

#### Depends On

Epic 18 (the pure field/collection model this screen consumes). Existing `HomeScreen.tsx`/`game-mode-store.ts` (mode selection) and `speech-service.ts` (word reveal). Not shippable to children alone — there is no mistake consequence yet, mirroring roadmap Epic 14's own "Depends On" framing for Honey Pot Flick's sibling epics.

#### Revised: Implemented

All tasks above are built and verified. What actually landed:

- **`src/features/play/logic/games.ts`** (new, sibling to `game-modes.ts`): `GameId` (`'honey-pot-flick' | 'bee-line'`), `GAMES`, `GAME_CONFIG` (icon + label per game), and `isGameId`, following the exact `GameMode`/`GAME_MODES`/`GAME_MODE_CONFIG`/`isGameMode` shape already established — deliberately a parallel top-level "which game" axis, not a fork of the existing tier contract, per UX Step 13's explicit instruction that "easy/hard/crazy/impossible still means the same age-band thing for whichever game is selected."
- **`src/stores/game-selection-store.ts`** (new): persists `selectedGame` via `AsyncStorage`, mirroring `game-mode-store.ts` field-for-field (`setSelectedGame`/`loadSelectedGame`/`isHydrated`), rather than adding a field onto the existing mode store — kept as its own sibling store so the mode store's contract doesn't change for existing Honey Pot Flick code. Wired into `app/_layout.tsx`'s startup `loadSelectedGame()` call alongside the other stores' hydration.
- **`HomeScreen.tsx`**: added the "Choose your game" pill row above "Choose your challenge," using `theme.colors.secondary` (Blue Violet) for the selected game pill vs. the mode row's existing `theme.colors.primary` (Tomato) — exactly UX Step 13's color differentiation. `Play` routes to `/bee-line` when `selectedGame === 'bee-line'`, `/play` otherwise (or `/profile` first if no profile exists yet, preserving the existing pre-play guard). The mode row's own selection is untouched by a game switch, per Step 13's "nothing silently resets" requirement — the two stores are fully independent.
- **`src/shared/ui/HexTile.tsx`** (new): a reusable honeycomb-hex letter tile built from the same border-triangle silhouette technique `HomeScreen.tsx`'s Play button already uses for its triangle (RN has no `clip-path`, and adding an SVG dependency for one tile shape was judged more machinery than this warranted). Renders purely off `letter`/`size`/`backgroundColor` — never a tile's `kind` — so a decoy can never accidentally read differently once Epic 21 turns decoys on, per architecture 26.4's "no color-tell" data-shape guarantee. **Flagged visual-polish gap**: the black outline wraps the tile's rectangular body but not its two triangular caps (no stroke-around-a-triangle primitive without SVG), so the hex reads as a bold color shape with a partial outline rather than a fully outlined one like every other button in the app — a real but minor gap from the "same visual language" bar, not a functional one.
- **`src/features/play/screens/BeeLineScreen.tsx`** (new, sibling to `PlayScreen.tsx`) and **`app/bee-line.tsx`** (new route): a full Bee Line session — word reveal banner and `speechService.speakWord`/`speakPraise` reused exactly as `PlayScreen.tsx` uses them, `getNextWord` reused from `honey-pot-flick.ts` for round advance, `startSession`/`recordWordCompleted` from `progress-store.ts` reused for mastery tracking (word-level progress data is game-agnostic). `BEE_LINE_MODE_CONFIG[gameMode]` drives `easy` (`input: 'tap'`) vs. `hard`+ (`input: 'drag'`, `showTowedTrail: true`) at the actual input-handling level, not just as a config value sitting unused.
  - **`easy`**: tapping a hex tile calls `resolvePickup` directly. A static "word so far" strip renders across the top of the screen (reusing the same answer-row-of-tiles visual language `PlayScreen.tsx` already uses for the honey-pot-flick guess), with a faint "·" dotted connector between collected letters per UX Step 14's specific recommendation — no towed-trail motion at this tier.
  - **`hard`+ (and `crazy`/`impossible` — see fallback note below)**: each tile is wrapped in its own `Gesture.Pan()`, following the exact safe pattern the P0 fix established for this codebase — every handler a Pan callback closes over (`handleDragStart`/`handleDragUpdate`/`handleDragEnd`/`attemptPickup`) is declared earlier in the component body, before any `Gesture.Pan()` is ever constructed, so the same eager-closure-capture TDZ crash that hit `PlayScreen.tsx` cannot recur here. A bee-emoji "dock" sits at a fixed anchor point in the field; dragging a tile within `DOCK_HIT_RADIUS` (64px, generous per UX Step 15's "drag needs real margin for a 7-year-old") of the dock on release calls `resolvePickup`, and on success the tile is filtered out of the rendered/hit-testable field array entirely and instead rendered as a small hex chip in a `trailRow` next to the dock — this is the **render-only trail** architecture 26.4 called for: a collected tile is structurally removed from the interactive field, not just visually layered under the trail, so the trail cannot be an obstacle to remaining tiles *by construction*, exactly as 26.4's feasibility note confirmed. The trail itself is a simple growing row of chips rather than a physics-simulated jointed path — Epic 19's own Open Questions explicitly left "does the trail need a dedicated animation primitive" as an implementation detail to resolve while building, not a locked requirement, and this is that resolution: simplest thing that satisfies the render-only/never-an-obstacle guarantee.
  - **`crazy`/`impossible` interim fallback (explicit known gap, not a silent decision)**: `BEE_LINE_MODE_CONFIG` (Epic 18) already gives `crazy` and `impossible` the identical `input: 'drag'`/`showTowedTrail: true`/`decoyLetterCount: 0` shape as `hard`, so `BeeLineScreen.tsx` needed zero tier-specific branching to make this safe — picking Bee Line at `crazy` or `impossible` today plays exactly like `hard` (drag-and-tow, no decoys, no timer), by construction rather than a special-cased fallback. This is intentional and correct for Epic 19's scope (Epic 21 gives `crazy`/`impossible` their own decoy/re-randomization behavior; Epic 23 gives `impossible` its timer), but is flagged here explicitly per this epic's instructions, since a child selecting those tiers today gets no age-appropriate escalation from Bee Line yet — only from Honey Pot Flick.
  - **Mistake feedback stays deliberately minimal**: a wrong-order (or, once Epic 21 lands, wrong-letter) pickup only updates a plain feedback text string, matching `PlayScreen.tsx`'s own baseline text-feedback pattern — no wobble/sound/score-dip treatment, since that full treatment is explicitly Epic 20's scope. A `chainBroke: true` result (currently unreachable, since every tier ships with `decoyLetterCount: 0` until Epic 21) is still handled correctly rather than left undefined: the field is rebuilt in new positions and `acknowledgeChainBreak` is called after a short hold, satisfying architecture 26.5's state-machine contract even though no tier can exercise it yet.
  - **Deliberately excluded per this epic's explicit scope**: running score, mistake penalties/wobble-and-dip feedback, decoys, the `impossible` timer, and Mama Bear/villain character reactions — a fully-collected word simply advances to the next word via `getNextWord`, exactly matching how roadmap Epic 14 scoped Honey Pot Flick's own first pass.
  - **One deliberate architectural choice beyond the epic's literal task list, flagged as a judgment call**: `BeeLineScreen.tsx` keeps its own local `currentWord`/`CollectionState`, and does **not** read or write `session-store.ts`'s `currentWord`/`score`/`honeyStash`/villain fields. `session-store.ts`'s own comments describe `honeyStash` as "session-local gameplay currency" tied specifically to the honey larder and villain-steal mechanic (architecture 25.11) — concepts that don't exist in Bee Line's fiction at all. Routing Bee Line through that store would have coupled an HPF-specific economy into a screen that has no honey pot, no larder, and no villain yet (that's Epic 24, if ever). `progress-store.ts`'s `startSession`/`recordWordCompleted` are reused as-is, since those are genuinely game-agnostic mastery tracking, not HPF's own economy.
- **Regression-verified**: `npm test` still passes 72/72 (Epic 19 added no new pure-logic module of its own — `bee-line.ts`'s tests already covered `resolvePickup`/`buildBeeLineField`/`BEE_LINE_MODE_CONFIG` in Epic 18; this epic is screen/wiring work on top of that, consistent with Epic 8 → Epic 10's own precedent of "the screen epic doesn't usually need new pure-logic tests of its own"). `tsc --noEmit` is clean. `npx expo export --platform web` builds successfully. `expo start --web` was run and both `/home` and `/bee-line` were loaded in a headless Edge instance with full console capture (`--enable-logging=stderr`, the same repro technique used to confirm the P0 crash fix): no `ReferenceError`s, no uncaught errors, only the same benign framework warnings (`useNativeDriver` web fallback, deprecated `shadow*`/`textShadow*`/`pointerEvents` style props) already present on the pre-existing `/play` screen. The rendered DOM was inspected directly and confirmed to contain the "Choose your game" row with both game pills and a still-present Parent View button on `/home`, and the target-word banner plus scattered `bee-line-tile-*` hex tiles on `/bee-line` at the default `easy` tier. The `hard`+ drag-and-tow path was verified by static/type-level review (gesture wiring, hit-testable-set removal, closure-declaration-order safety) and a full `tsc`/bundle pass, but not exercised via a live drag gesture in this environment, since no browser-automation tool capable of synthesizing a pointer drag was available here — flagged explicitly rather than claimed as fully interactively verified.

---

### Epic 19.5 — Bee Line `hard`+ Interaction Rework: Head-Steered Snake/Centipede Mechanic (Revision to Epic 19)

#### Why This Is a Revision, Not a New Epic

Epic 19 shipped a real `hard`+ interaction — drag a scattered tile to a fixed bee-dock anchored at the top of the field, on release within `DOCK_HIT_RADIUS` it's collected and redrawn as a chip in a `trailRow` next to the dock — and it was fully verified (regression, `tsc`, bundle, static/type review of the gesture wiring). After a founder playtest, product feedback was that this "drag each correct letter to a fixed target" mechanic reads as too similar to Honey Pot Flick's flick-to-a-target mechanic, and asked for a classic Snake/Centipede mechanic instead: the growing chain of collected letters is itself steered around the field by the child — there is no separate delivery point and no separate bee mascot doing the collecting; the first collected letter *is* the head, and subsequent letters join by the head passing over them. Rather than rewriting Epic 19's own record of what was built and verified, that gap is recorded here as Epic 19.5 — Epic 19 stands as delivered history (including its now-superseded bee-dock/`trailRow` design and its "drag needs real margin" `DOCK_HIT_RADIUS` reasoning), this epic supersedes its `hard`+ interaction implementation only. Epic 19's `easy` tap-to-collect work, and everything Epic 18 built (`resolvePickup`, `CollectionState`, `ChainPolicy`, `BEE_LINE_MODE_CONFIG`, `buildBeeLineField`), are untouched and still exactly as delivered.

#### Objective

Replace `hard`+'s fixed-dock drag-and-drop with a head-steered Snake/Centipede mechanic: the child grabs the first letter of the word, drags it around the field, and each subsequent correct letter joins the tail the instant the steered head's position reaches it — with trailing segments visually following the head's traveled path rather than snapping to a static connector row.

#### User Story

As a child aged 7–9 playing `hard`+, I want to grab the first letter and steer it around the field like a little snake, picking up the next letters by driving over them in order, with the letters I've already collected trailing behind wherever I've steered — not dragging each new letter to a fixed spot.

#### What Changed From Epic 19's `hard`+ Design

- **No fixed dock.** `beeDock`/`DOCK_HIT_RADIUS`/`dockCenter` are gone. There is no delivery point on the field at all.
- **The first collected letter is the head — not a separate bee mascot.** `BeeLineScreen.tsx` always renders the tile for the word's first letter (`orderIndex === 0`) as one dedicated, persistent element: at its own scattered field position before it's ever touched, and at the live steered position afterward. It is never unmounted across that transition (same `View`/`GestureDetector` throughout), which is what makes an in-flight drag gesture survive the "just a scattered tile" → "now steering the whole chain" moment.
- **Pickup is continuous/proximity-based, not a discrete drop-target check.** While a head exists, every `onUpdate` of its `Gesture.Pan()` records the new position, appends it to a recorded path, and checks distance from the head to every still-uncollected tile (`HEAD_PICKUP_RADIUS_PX = TILE_SIZE * 0.75`); crossing within that radius immediately calls the exact same `attemptPickup` → `resolvePickup` path Epic 18 built, unchanged. This checks *every* remaining tile, not only the next-expected one, so a steered head that grazes an out-of-order (or, once Epic 21 turns decoys on, wrong-letter) tile along the way still triggers the existing mistake classification — `resolvePickup`'s contract and `ChainPolicy` handling are exercised exactly as before; only the trigger mechanism changed.
- **Trailing segments follow the head's recorded path (real Snake/Centipede body-follows-head), not a static `trailRow`.** New pure module `src/features/play/logic/snake-trail.ts` (see below) answers "given the head's recorded path, where do N trailing segments sit," walking backward along recorded arc length rather than each segment chasing the previous segment's live position (which bunches up / cuts corners on turns).
- **Gesture can end and resume.** Lifting the finger simply stops `onUpdate` calls; the head and trail sit exactly where they were (state, not derived from an active gesture). Re-touching the head's own persistent element resumes the same `Gesture.Pan()` flow — `handleHeadPanStart` recognizes "a head already exists" (`collectedIdsRef.current.size > 0`) and treats a fresh touch on it as a no-op resume rather than a new pickup attempt.
- **Chain-break reset extended to the new state.** A `chainBroke: true` result already rebuilt the field after `CHAIN_BREAK_HOLD_MS` (Epic 18/19); this revision additionally clears `collectedIdsRef`, the recorded head path, and `headPosition` in that same reset, so a scattered chain doesn't leave a stale head/trail behind. This wasn't a concern in the old dock model (the dock itself was static, nothing to reset) — a genuine new integration detail this rework had to account for, not a `bee-line.ts` change.
- **Bee mascot decision**: kept, but purely cosmetic — a small 🐝 riding just above the head tile (`styles.beeRider`, `pointerEvents="none"`), for visual continuity with the game's name. It is not a second interactive element and has no collection role of its own, per this epic's explicit constraint.

#### Judgment Calls Made Where the Rework Brief Left Something Open

- **Which tiles are draggable before any letter is collected**: the brief posed this as an open question with a stated lean, and that lean was implemented as-is — **any `'correct'`-kind tile is grabbable** (each gets its own `Gesture.Pan()`), never a decoy (dragging a decoy makes no narrative sense once it's just a passive obstacle — matches the wider principle that decoys are collision-only, never an interactive element). Touching the actual next-expected tile immediately collects it via `attemptPickup` and it becomes the head on the spot; touching any other `'correct'`-kind tile immediately runs the exact same `attemptPickup`/`resolvePickup` call, which — since `nextExpectedIndex` is always 0 before the first pickup — can only ever classify as the existing `wrong-order` mistake. This keeps one invariant simple everywhere in the screen: *draggable tiles are always `'correct'`-kind tiles; a touch always resolves through `resolvePickup`, whether that touch starts a head or bounces as a mistake.* Once any letter is collected, this invariant flips: only the head's own element is draggable, and every other remaining tile — `'correct'`-kind or decoy — becomes a passive collision-only obstacle, consistent with "the child steers the head; it does not keep dragging individual letters."
- **A real integration bug avoided, flagged for visibility**: proximity pickup fires on every `onUpdate`, multiple times before a React commit reflects a just-collected tile's removal from `collectionState.collected`. Reading `collectionState` itself for the "already collected?" check would have risked calling `attemptPickup` on the same tile more than once inside that window. `collectedIdsRef` (a `Set<string>` mirrored synchronously inside `attemptPickup`, alongside `setCollectionState`) exists specifically to make that check correct regardless of React's commit timing — this is a `BeeLineScreen.tsx` integration concern, not a `bee-line.ts` bug; `resolvePickup` itself was never at risk since it's still only ever called once per genuinely-new pickup.
- **Trailing-segment size and color**: kept at full `TILE_SIZE` (not shrunk) so a spelling app never sacrifices letter legibility for a body-segment visual flourish, and reused `theme.colors.gold` (the same color the old `trailRow` chips used) so a collected letter still reads as "banked" the same way it did before this rework.
- **A small, explicitly-flagged polish gap carried over from the same "Epic 20 owns the real break animation" precedent Epic 19 already established**: on a chain-break mistake, the trailing segments vanish instantly (`collectionState.nextExpectedIndex` resets to 0 immediately, so `trailPositions` becomes `[]` synchronously), while the head visually freezes in its last dragged position until the delayed field rebuild lands (`CHAIN_BREAK_HOLD_MS` later) and snaps to the tile's new scattered position. This two-stage look (trail gone, head lingers, then head jumps) is minor and will be superseded by whatever real "sproing apart" animation Epic 20 designs — not attempted here, matching Epic 19's own original scope boundary.

#### New Pure Module: `src/features/play/logic/snake-trail.ts`

Following this codebase's established "pure logic gets a sibling `.test.ts`, RN/gesture code stays a thin host" convention (`bee-line.ts`, `honey-pot-flick.ts`, `sprite-animation.ts`):

- **`resolveTrailSegmentPositions(path, segmentCount, spacingPx)`**: given a recorded head-path history (oldest sample first, current head position last) and a desired number of trailing segments spaced `spacingPx` apart, returns each segment's position by walking backward along the path's real arc length — the standard body-follows-head technique, so segments trace the head's actual path through a turn rather than cutting the corner. Degenerate inputs (`segmentCount <= 0`, an empty path, a path shorter than the requested distance) are handled without throwing.
- **`appendTrailPathPoint(path, point, { minSpacingPx, maxLength })`**: the pure "append one sample" step — dedupes a near-identical consecutive point (a finger holding nearly still) and caps history length, oldest-first. `BeeLineScreen.tsx` owns *storing* the growing path (in a ref, every drag frame) — that growth-over-time is inherently stateful/RN-ish — but the append rule itself has no RN dependency and is tested in isolation.
- **Test coverage** (`snake-trail.test.ts`, 12 tests via `node:test`): zero/negative segment counts, an empty path, a single-point path (segments clamp to it), straight-line arc-length placement, walking backward through a right-angle corner (the corner-cutting case the whole technique exists to avoid), clamping to the oldest sample when the requested distance exceeds the recorded path, `spacingPx === 0` degenerate behavior, purity (same inputs → same outputs), and `appendTrailPathPoint`'s append/dedupe/cap behavior including FIFO eviction order.

#### What Changed in `BeeLineScreen.tsx`

`ghostAnim`/`activeTileId`/`activeTile`/`GHOST_HALF`/`dragGhost`/`tileWrapperHidden`/`handleDragStart`/`handleDragUpdate`/`handleDragEnd`/`beeDock`/`beeDockEmoji`/`trailRow`/`DOCK_HIT_RADIUS`/`dockCenter` are all removed — none of that machinery exists in the new model (the head tile itself is what's shown moving; there's no separate ghost overlay). Added: `headPosition` state, `headPathRef`/`collectedIdsRef` refs, `checkHeadProximityPickup`/`handleHeadPanStart`/`handleHeadPanUpdate` handlers, and the `headFieldTile`/`dragRemainingTiles`/`trailPositions`/`headPan` render-time derivations described above. `attemptPickup` now returns its `ResolvePickupResult` (previously `void`) so `handleHeadPanStart` can synchronously tell whether a touch just became a head, without waiting for a re-render. `easy`'s entire tap-to-collect branch (`handleTilePress`, the `Pressable`-per-tile render path) is untouched — the `modeConfig.input === 'tap'` branch is byte-for-byte the same logic as before, just re-indented into the new top-level `input === 'tap' ? … : …` split. **Gesture-ordering discipline verified**: `attemptPickup` → `checkHeadProximityPickup` → `handleHeadPanStart` → `handleHeadPanUpdate` are all declared, in that dependency order, before either `Gesture.Pan()` builder call site (the per-tile one inside `dragRemainingTiles.map()`, and the head's own `headPan` construction) — the same eager-closure-capture TDZ crash class the `PlayScreen.tsx` P0 fix addressed cannot recur here, since nothing a builder closes over is referenced before its own `const` declaration executes.

**Bug found and fixed while integrating (flagged per this epic's convention, same as past epics)**: none in `bee-line.ts` — `resolvePickup`/`CollectionState`/`ChainPolicy`/`buildBeeLineField` needed zero changes and are called exactly as Epic 18/19 left them. The one real gap found was in the *screen's own* prior chain-break handling, described above under Judgment Calls (the new head/path/collected-ids state needed its own reset alongside the existing field rebuild) — not a pre-existing bug, since that state didn't exist before this epic.

#### Regression-Verified

`npm test` passes 84/84 (12 new tests in `snake-trail.test.ts`; no regressions in the pre-existing 72 — `bee-line.ts` itself was not modified). `npx tsc --noEmit` is clean. `npx expo export --platform web` builds successfully (2.16 MB web bundle, up marginally from 2.13 MB — expected, from the new `snake-trail.ts` module). As in Epic 19, no browser-automation/gesture-simulation tool is available in this environment to synthesize a live pointer drag, so the new head-steering interaction was **not** exercised end-to-end in a running app — `snake-trail.ts`'s pure path-following math is the part covered by real, thorough unit tests; `BeeLineScreen.tsx`'s gesture wiring, state resets, and render logic were verified by careful static/type review and the clean `tsc`/bundle pass, and that distinction is stated explicitly rather than claiming a live playtest that didn't happen.

#### Flagged Documentation Staleness (Not Fixed Here — Outside This Epic's Role Scope)

Two `docs-private/` documents now describe the superseded bee-dock/tow model and need UX/architecture reconciliation, not an engineering rewrite:

- **`docs-private/mama-bears-spelling-bee-ux.md`, Steps 15 and 17** — describe the bee-towing-a-trail visual (a bee mascot delivering letters to a dock), which this epic replaced with the head-steered model.
- **`docs-private/mama-bears-spelling-bee-architecture.md`, Sections 26.4 and 26.5** — reference the dock/tow model's render-only-trail guarantee in terms of "the dock" and "towing," which should be re-expressed in terms of the head-steered path-following model this epic actually implements (the underlying *guarantee* — a collected tile is structurally removed from the interactive field, never just visually layered under the trail — still holds exactly as before; only the delivery mechanism the prose describes has changed).

#### Open Questions / Tuning Carried Forward

- **`HEAD_PICKUP_RADIUS_PX` (`TILE_SIZE * 0.75`) and `TRAIL_SEGMENT_SPACING_PX` (`TILE_SIZE * 0.6`)** are this epic's own reasonable starting values, not yet playtested at these exact numbers — real-device feel-tuning (same category as Epic 19's original `DOCK_HIT_RADIUS` being "generous per UX Step 15," never literally playtested either) is a natural follow-up once this is in front of a child again.
- **Whether the trailing-segment "vanishes instantly on mistake, head lingers until rebuild" gap (noted above) needs its own polish pass**, or is fully superseded once Epic 20's real mistake-consequence animation lands — left to Epic 20 to decide, not resolved here.

#### Depends On

Epic 18 (unchanged — `resolvePickup`/`CollectionState`/`ChainPolicy`/`buildBeeLineField`/`BEE_LINE_MODE_CONFIG`) and Epic 19 (the screen this epic reworks in place, and the game-selection/route wiring Epic 19 built, both otherwise untouched).

---

### Epic 20 — Bee Line: Running Score and Mistake-Handling Model

#### Objective

Deliver roadmap Epic 15: an additive/subtractive running score per word attempt (able to dip, including below zero, mid-attempt) that is representationally separate from `session-store.ts`'s monotonic `score` and never touches `progress-store.ts` mastery data, plus the two mistake-feedback treatments UX Step 18 designed (a small wobble+dip for wrong-order, a bigger scatter+restart for wrong-letter).

#### User Story

As a child, I want every letter I collect to count toward a score that can go up or down, and a clear, fair, silly consequence when I grab the wrong letter or grab one out of order — so the game feels responsive and stakes-y without ever feeling punishing.

#### Tasks

- Add `BeeLineScoreTuning`, `BeeLineScoreState`, and the pure `applyScore(state, outcome, tuning)` to `bee-line.ts` (architecture 26.6), keyed off `CollectionOutcome`. Unit test in `bee-line.test.ts`: score rises on `correct`, dips (including going negative) on `wrong-order`/`wrong-letter`, and `wrongLetterPenalty` > `wrongOrderPenalty` under the placeholder tuning below.
- Add `DEFAULT_BEE_LINE_SCORE_TUNING` with placeholder values (`wrongLetterPenalty` set larger than `wrongOrderPenalty`, per product's stated lean) — explicitly flagged as tuning, not a locked number (see Open Questions).
- Keep the running score entirely out of the two existing score/mastery contracts: it lives in `BeeLineScreen.tsx`'s own component/logic state (or a small Bee-Line-only slice if a persisted per-session total is later wanted — a **new**, separately-named field, never `session-store.ts`'s `incrementScore`). Word completion still calls `progress-store.ts`'s existing `recordWordCompleted` exactly as Honey Pot Flick does, regardless of what the running score did during the attempt.
- Wire `resolvePickup`'s `wrong-order` outcome (on `BeeLineScreen.tsx`) to: `applyScore`'s dip, a small floating "-N" near the score, a quick tile wobble + warm-orange outline flash, a short "uh-uh!" sound (not a buzzer), and — per `DEFAULT_BEE_LINE_TUNING.wrongOrderPolicy: 'keep-chain'` from Epic 18 — the trail staying fully intact; the mis-tapped tile just bounces back to its field position, uncollected.
- Wire `resolvePickup`'s `wrong-letter` outcome to: the bigger score dip, the whole in-progress trail bursting apart in a comedic "sproing/poof" (tiles tumbling back onto the field in new positions), a startled bee "whoa!" headshake reaction (never a sad/scolding animation), and the target word re-displaying so the child can immediately restart the word — no separate confirmation tap.
- Add a test asserting `easy`'s participation matches architecture 26.5's stated read: since `BEE_LINE_MODE_CONFIG.easy.decoyLetterCount` is 0 (Epic 18), `resolvePickup` can only ever return `correct`/`wrong-order` at `easy` and never `wrong-letter`/`chainBroke: true` — i.e. `easy` only ever sees the gentle wobble+dip, never a scatter.

#### Open Questions / Tuning Carried Forward

- **Exact `perCorrect` / `wrongOrderPenalty` / `wrongLetterPenalty` values** (roadmap Epic 15; architecture 26.11) — placeholder values only; product/UX to set real numbers once the mechanic is playable.
- **Whether the running score persists as a per-session total anywhere, or is purely cosmetic feel** (architecture 26.6) — not decided here. If it's ever persisted, it must land in a new, separately-named field — never `session-store.ts`'s `score`.

#### Depends On

Epic 18 (`resolvePickup`'s outcome classification and `ChainPolicy`) and Epic 19 (a real screen to wire the score/feedback animations into).

---

### Epic 21 — Bee Line: `crazy`/`impossible` Decoys and Position Randomization

#### Objective

Deliver roadmap Epic 14's `crazy`/`impossible` acceptance criteria — decoy letters mixed onto the field, and, at `impossible` only, tile positions re-randomized on every attempt — per UX Step 16's "decoys are a fair trick, not a visual trap" design intent.

#### User Story

As a child aged 8–9, I want the field to include letters that aren't part of my word, so the challenge comes from knowing how to spell it, not just from finding letters — and at the hardest level, I want the letters to land somewhere new every time I try, so I can't just memorize where they were.

#### Tasks

- Set real `decoyLetterCount` values for `crazy` and `impossible` in `BEE_LINE_MODE_CONFIG` (placeholder tuning numbers, flagged not locked — see Open Questions) and `randomizePositionsPerAttempt: true` at `impossible` only, leaving it `false` everywhere else (keeping `crazy` clock-and-pattern-free per UX Step 17's own "don't let anything leak below `impossible`" concern, applied here to layout memorization rather than the timer).
- Wire `BeeLineScreen.tsx` to call `buildBeeLineField` once per word at `easy`/`hard`/`crazy` (so a retry reuses the same field) and once per **attempt** at `impossible` (per architecture 26.4: "position randomization is just *when* you call the builder," one code path either way).
- Render decoy tiles with identical art, size, and color to correct tiles (UX Step 16 — deliberately no color-tell). Confirm the render layer never reads `tile.kind` for styling decisions, only `resolvePickup`'s classification logic does.
- Add a replayable word-pronunciation control (a small speaker icon, re-triggerable throughout the attempt) at `crazy`+ (UX Step 16), reusing the existing `speech-service.ts` playback.
- Confirm (via a screen-level check, not a new algorithm) that decoys never spawn overlapping or hiding a correct tile — this is already enforced by `buildBeeLineField`'s `minTileSpacingPx` from Epic 18.

#### Open Questions / Tuning Carried Forward

- **Exact decoy counts per tier** (roadmap Epic 14; architecture 26.11) — UX needs a rough number to wireframe field density; not locked here. Whether Bee Line reuses Honey Pot Flick's `decoyLetterCount` numbers from `game-modes.ts` or takes its own tuning is explicitly still open per the roadmap.
- **Optional accessibility/assist toggle** highlighting the next correct letter after repeated wrong-letter mistakes on the same word (UX Step 16) — not required for launch; whether it exists at all, and if so default-on/opt-in/parent-controlled, is undecided.
- **Field density, letter-tile size, and reachability on the smallest supported device** (architecture 26.11) — UX to design, needs a real-device check before this tier ships broadly.

#### Depends On

Epic 18 (the decoy-capable field model) and Epic 20 (the wrong-letter scatter consequence that gives decoys a reason to matter — a decoy with no consequence for touching it is incomplete, mirroring how roadmap Epic 14 itself deferred mistake consequences to Epic 15).

---

### Epic 22 — `GameMusicService`: Looping, Rate-Ramped Background Music Infrastructure

#### Objective

Add the standalone audio infrastructure architecture 26.7 calls for: a persistent, looping background-music player whose playback rate ramps over time — a genuinely different lifecycle from the two existing one-shot audio services (`speech-service.ts`'s single TTS queue, `character-audio-service.ts`'s fire-and-dispose SFX players), neither of which models a long-lived, rate-animated loop.

#### User Story

As an engineer, I want a small, dedicated music service with the same fail-silent, single-shared-instance discipline the existing audio services already follow, so the `impossible`-tier accelerating music (Epic 23) has somewhere correct to live instead of being bolted onto a service built for something else.

#### Tasks

- Add `src/shared/lib/music/game-music-service.ts` (+ `index.ts` barrel, mirroring the shape of `src/shared/lib/character-audio/` and `src/shared/lib/speech/`): a single shared instance owning one looping `expo-audio` `AudioPlayer` (`player.loop = true`) and an animated playback-rate ramp.
- Define `AcceleratingMusicCue` (`trackId`, `loop: true`, `startRate`, `endRate`, `rampMs`) per architecture 26.7.
- Expose a small API — `playLoop(cue: AcceleratingMusicCue)`, `stop()`, `stopAll()` — following the existing services' fail-silent discipline (never throws on a missing/failed-to-load track) and explicit `stopAll()`-on-unmount convention.
- Split the rate-ramp math out as a pure, testable helper (e.g. `resolvePlaybackRateAtElapsedMs(cue, elapsedMs)`) the same way `sprite-animation.ts` keeps frame-index math independent of the Reanimated player — add `game-music-service.test.ts` covering the ramp's start/mid/end values and clamping past `rampMs`.
- Ship with **zero tracks registered** — same "plumbing before art" precedent as `character-images.ts`/`character-animations.ts` on day one; `playLoop` with an unregistered `trackId` fails silently rather than throwing.

#### Open Questions / Tuning Carried Forward

- **Music acceleration curve, and whether "accelerating" is a `playbackRate` ramp on one stem vs. a crossfade between pre-rendered tempo stems** (architecture 26.7/26.11) — an asset-pipeline call for UX/audio, expressible either way behind the `AcceleratingMusicCue` shape; not decided here.

#### Depends On

Nothing — standalone infrastructure, buildable in parallel with any Bee Line epic, the same way Epic 9's asset-pipeline documentation ran in parallel with Epic 8.

---

### Epic 23 — Bee Line: `impossible`-Tier Timer and the Firework Trail-Explosion

#### Objective

Deliver roadmap Epic 16 and UX Step 17: a word-length-scaled hard time limit at `impossible` only, fast-tempo accelerating music, a fuse/sparkler burn-down visualization (never a numeral-primary countdown), and a firework-style timeout explosion that reads as fun and visceral rather than punishing.

#### User Story

As a confident 9-year-old, I want a real race-against-the-clock version of Bee Line where the music speeds up and my letter trail dramatically explodes like a firework if I run out of time — so the hardest mode feels thrilling and replayable, never stressful.

#### Tasks

- Add `BeeLineTimerConfig` and the pure `computeTimeBudgetMs(wordLength, cfg)` to `bee-line.ts` (architecture 26.7); unit test the floor/ceiling clamping and the proportional-to-word-length shape in `bee-line.test.ts`.
- Populate `BEE_LINE_MODE_CONFIG.impossible.timer` and `.music` (placeholder tuning values only — see Open Questions); leave both `undefined` at every other tier, keeping `crazy` clock-free per UX Step 17's explicit instruction not to let any lighter timer leak below `impossible`.
- Render the fuse/sparkler burn-down at the front of the trail on `BeeLineScreen.tsx` (UX Step 17), with an optional small secondary numeral readout — the fuse is the primary read, not the numeral.
- Wire `GameMusicService.playLoop()` (Epic 22) with the computed time budget driving `rampMs`, so the music's acceleration peaks right at the deadline.
- On timeout: fire the same trail-scatter transition `resolvePickup`'s `wrong-letter`/`break-chain` path already produces (Epic 20), staged as the bigger, firework-scale burst UX Step 17 calls for — a bright gold/hot-pink particle burst with a "pop-pop-fizzz" sound, deliberately visually distinct from the win-celebration's confetti-shower-from-above (a single big upward "whoosh" from the fuse's origin point vs. confetti falling from above) so a child can tell success from timeout within a second.
- On timeout, restart the same word from the beginning and stop the music loop; on success before timeout, resolve into the existing word-complete celebration flow (the fuse simply resolves into that same celebration, per UX Step 17 — no separate success language to invent).

#### Open Questions / Tuning Carried Forward

- **Exact `secondsPerLetter` / `floorMs` / `ceilingMs`** (roadmap Epic 16; architecture 26.11) — tuning work once the mode is playable, not hard-coded here.
- **Whether a villain reacts to the timeout explosion** — deferred to Epic 24; product's lean (if a villain reacts at all) is a gleeful, harmless laugh, never framed as villain-caused.

#### Depends On

Epic 21 (`impossible`'s decoy + randomized-position base must exist first), Epic 20 (the `break-chain` scatter path the explosion reuses, and the restart-from-scratch model), and Epic 22 (`GameMusicService`).

---

### Epic 24 — Bee Line: Character Staging — Mama Bear Reactions and Heckling Villains

#### Objective

Implement UX Step 19's launch staging (architecture 26.8): Mama Bear fully present and reactive, exactly as in Honey Pot Flick; a villain appears at `crazy`/`impossible` only, as a non-mechanical heckling spectator — **no** honey-steal mechanic, no `StealAttemptHost`, no `honeyStash` touch anywhere in Bee Line.

#### User Story

As a child playing Bee Line, I want Mama Bear to feel like the same character I know from Honey Pot Flick, cheering me on and reacting gently to my slips — and if a villain shows up on the harder levels, I want it to just be a funny rival heckling from the sidelines, not another thing trying to beat me.

#### Tasks

- Render `<Character>` instances for Mama Bear and (at `crazy`/`impossible` only) a villain on `BeeLineScreen.tsx`, reusing `useCharacterAnimationState` and `pickNextVillain`/`villain-pool.ts` exactly as `PlayScreen.tsx` already does — no new character-selection logic.
- Wire Mama Bear: `trigger('Celebrating')` on word completion; a warm, non-scolding reaction on a `wrong-order` mistake, mirroring how she already responds gently to a Honey Pot Flick miss.
- Add Bee Line's own capability-light `tier -> capabilities` map (architecture 26.8) as a new sibling module, e.g. `src/features/play/logic/bee-line-villain-capabilities.ts`, matching `villain-capabilities.ts`'s existing per-game-data pattern — **`Passive`/`Taunting`: villain absent/idle, no heckle; `Interfering`/`Relentless`: `['Taunt']` only.** No tier lists `StealResource`.
- Stage the villain's heckle using the existing `Challenging` state (architecture 26.8 option (a): reuse, zero enum change) — deliberately **do not** use the `BeingNaughty` steal-telegraph visual or the larder-directed lunge positioning from Honey Pot Flick's steal mechanic, so an observant child doesn't see a "wind-up" that never pays off. Do not instantiate `StealAttemptHost` or touch `session-store.ts`'s `honeyStash` anywhere in this epic's code.
- On the `impossible` timeout (Epic 23), an optional villain reaction is a gleeful, harmless laugh only — never staged as though the villain caused the explosion.
- Gate any villain reaction animation through the existing `useReduceMotion()` hook, consistent with Epic 12's reduce-motion discipline.

#### Open Questions / Tuning Carried Forward

- **Whether `Challenging` reads clearly as "heckling commentary" on real art, or a dedicated `Heckling` `CharacterAnimationState` value is warranted** (architecture 26.8/26.11, option (a) vs. (b)) — this epic implements option (a) for launch (zero contract change); UX to confirm the read once real art exists, with option (b) as a cheap additive upgrade if needed.
- **Whether villains ever get an active mechanic in Bee Line** — explicitly deferred by UX Step 19, not ruled out. Revisit only after the base mistake/timer tone (Epics 20/23) has been playtested with real kids.

#### Depends On

Epic 19 (a screen to render characters on), Epic 21 (`crazy`/`impossible` decoys, since villains only appear at those tiers), and Epic 23 (the timeout event a villain may optionally react to).

---

### Epic 25 — Daily Streak Persistence Foundation

#### Objective

Deliver architecture Section 27 minus its screens: the pure day-boundary/timezone-robust module, the new `daily-rewards-store.ts`, the `dailyRewardsKey(profileId?)` per-device-today/per-child-ready seam, the sticker catalog registry, and the completed-session earn-trigger signal — wired into Honey Pot Flick's existing completion path today (per architecture 27.6), so this epic does not need to wait on any Bee Line epic above.

#### User Story

As a child aged 6–9, I want the game to quietly notice each day I actually finish playing, so a streak and a sticker collection can start building up behind the scenes for the album screen (Epic 26) to show me.

#### Tasks

- Add a pure day-boundary module (proposed home: alongside the store, or a sibling logic file such as `src/stores/daily-rewards-logic.ts`, matching the project's existing "pure logic beside the store/screen that uses it" convention): `toDayKey(nowMs, tzOffsetMinutes)`, `dayGap(from, to)`, `applyCompletedSession(streak, today, tuning)`, and `dailyRewardsKey(profileId?)` (architecture 27.2/27.5). Unit test under `node --import tsx --test`: same-day replay is a no-op, a consecutive day increments, a gap within grace consumes a grace day and keeps `current`, a gap past grace lapses to a fresh streak (data resets `current` to 1, no punishing zero display), and a clock moved backward (earlier than `lastPlayedDay`) clamps to a no-op rather than incrementing or resetting.
- Define the data model per architecture 27.3: `DayKey`, `StickerId`/`StickerRarity`/`EarnedSticker`, `DailyStreakState`, `StickerAlbumState`, `DailyRewardsState` (with `schemaVersion` for future migrations, mirroring `progress-store.ts`'s implicit shape versioning).
- Add `src/stores/daily-rewards-store.ts`: a Zustand store mirroring `progress-store.ts`'s shape (`isHydrated`, `loadDailyRewards()` called once on app startup beside `loadProfile`/`loadProgress`, a `persist()` writing the whole `DailyRewardsState` blob through `dailyRewardsKey()`). This store must never import or mutate `session-store.ts`'s `honeyStash`/`stolenOutstanding`, and never write to any `progress-store.ts` record (architecture 27.4/27.7) — it only *observes* a completed-session signal.
- Add `recordCompletedPlay(nowMs)` on the store: debounced to once per `DayKey` (first completion of the day calls `applyCompletedSession` and awards a sticker; later completions that day are no-ops for the reward), per architecture 27.6.
- Wire `recordCompletedPlay` into Honey Pot Flick's existing word-completion path in `PlayScreen.tsx` (the `triggerCelebration()` call site) today. Leave a note at that call site for whoever lands Bee Line's own word-completion handoff (Epics 19/20 above) to add the identical call there once both exist — per architecture 27.6, this is meant to be zero per-game branching, not a second bespoke wiring.
- Add the sticker catalog registry `src/data/rewards/sticker-catalog.ts` (content-as-data: ids, rarity, silly names/captions, milestone thresholds), mirroring `character-roster.ts`'s registry pattern, seeded with a small placeholder set drawn from the roadmap's own illustrative examples (e.g. "Sir Buzzworth") rather than a locked final catalog.

#### Open Questions / Tuning Carried Forward

- **Per-child vs. per-device** (architecture 27.2 — the real, flagged gap: `profile-store.ts` supports exactly one active profile today, with no profile list anywhere in the codebase). This epic ships per-device today via the `dailyRewardsKey(profileId?)` seam, consistent with how `progress-store.ts` is already per-device. Product's lean is per-child; product to confirm this staging and when real multi-profile support (Epic 1) is scheduled — this epic does **not** attempt to build multi-profile support itself.
- **Exact earn trigger** — first completed session of the day (recommended default, roadmap Epic 17 / architecture 27.6) vs. app-open vs. gating some stickers behind longer streaks. Implemented per the recommended default; product to confirm.
- **Grace/freeze length and decay behavior** (roadmap Epic 17; UX Step 22; architecture 27.9/27.10) — a placeholder grace-day count only; the real number and decay shape are tuning/UX decisions.
- **Album size, earn pacing, and whether the album ever "completes" or refreshes seasonally** (architecture 27.10) — a content/pacing decision the placeholder catalog does not attempt to answer.
- **Reinstall/multi-device survival is explicitly out of scope for launch.** AsyncStorage survives restarts but not an uninstall/reinstall or a new device; true cross-reinstall persistence needs cloud-backed storage, a Phase 3 follow-up (architecture 27.6), not this epic's job.

#### Depends On

Nothing Bee-Line-related — independent of Epics 18–24, buildable in parallel. Hooks into `PlayScreen.tsx`'s existing Honey Pot Flick completion path, which already exists today.

---

### Epic 26 — Daily Streak Badge and Sticker Album UI

#### Objective

Build the two screens UX designed for the daily-rewards loop (Steps 20–22): a corner-pinned Home-screen streak badge, and a dedicated Sticker Album modal — including the non-punishing "resting bee" grace-day treatment — reading from Epic 25's store.

#### User Story

As a child aged 6–9, I want to glance at Home and instantly see my streak is still going, tap it to open a proud little sticker book, and — if I miss a day — see a sleepy bee taking a nap instead of feeling like I broke something.

#### Tasks

- Add a corner-pinned streak badge to `HomeScreen.tsx` (UX Step 20): `gold`-background badge with a bee/honeycomb icon plus the day count (e.g. "🐝 x5"), absolutely positioned so it adds no scroll height to a screen that already needed a `ScrollView` fix. Reads `daily-rewards-store.ts`'s streak state.
- Add the grace-day visual swap (UX Step 20/22): on a grace day, the badge swaps to a calm "resting bee + zzz" visual rather than disappearing, changing color to red/alarm styling, or otherwise reading as "something's wrong" — `primary` (Tomato, this app's reserved "wrong/miss" color) must specifically never be used here.
- Add a Sticker Album screen/modal (e.g. `src/features/rewards/screens/StickerAlbumScreen.tsx`), reached by a single tap on the badge and closed by a single tap back to Home (UX Step 21): a streak-status banner at top; a grid of honeycomb-shaped sticker slots (earned stickers in full color from Epic 25's catalog, not-yet-earned as gray silhouettes in the same hex shape); a `gold` sparkle border + shimmer on milestone stickers; a tap-to-see-caption popup; one large, dominant "Back to Play" button styled like the existing `success`-green Play button family.
- Wire the grace-day and lapsed-streak copy (UX Step 22): "Bee's taking a little nap — come play today to wake the streak back up!" on a grace day, and a soft "Let's start a fresh streak together!" on an actual lapse — never a visible "Streak: 0" drop-to-zero moment.
- Confirm total Home-screen scroll height on the smallest supported device now that the badge has been added (should be a non-issue, since it is corner-pinned rather than a new row, but verify per UX Step 13's own precedent of not assuming a `ScrollView` "just handles it").

#### Open Questions / Tuning Carried Forward

- **Optional new "rest" palette tone vs. reusing `muted`/a lightened `secondary`** for the grace-day state (UX Step 22) — flagged as optional by UX, not a locked `theme.ts` addition; this epic may ship with either without blocking on a new color being ratified.
- **Album size/pacing/"completion"** (carried from Epic 25) — the grid renders whatever the catalog currently contains; it is not designed around a specific final count.

#### Depends On

Epic 25 (the store and sticker catalog this screen reads from).
