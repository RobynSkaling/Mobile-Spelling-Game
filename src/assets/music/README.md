# Background Music

Background music tracks. Not character-scoped, so this folder is flat.

## File naming convention

Name files by where they play, not by mood or vibe, so it's obvious at a glance where a track is
used:

```
music/
  home-theme.mp3
  gameplay-loop.mp3
  final-test-theme.mp3
  victory-fanfare.mp3
```

## Format guidance

- Compressed format (`.mp3` / `.aac`).
- Looping tracks (`home-theme`, `gameplay-loop`) should be edited to loop seamlessly — no audible
  seam at the loop point.
- Keep the overall mood upbeat and playful per the spec doc's tone guidance, but not overwhelming
  — this plays underneath gameplay a young child needs to concentrate through.
- A volume/mute control belongs in the app's settings once music is wired in; don't rely on a
  track's mix alone to keep it from being intrusive.

Nothing currently `require()`s files from this folder. When tracks land, add a small registry
(e.g. `src/data/audio/music-tracks.ts`) following the same pattern as
`src/data/characters/character-roster.ts` — a typed list of track ids/labels, with the actual
`require()` wiring added once files exist.
