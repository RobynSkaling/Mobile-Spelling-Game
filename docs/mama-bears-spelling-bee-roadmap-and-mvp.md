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
