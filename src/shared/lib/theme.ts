// "Retro Arcade" palette: gold, tomato red, blue violet, deep sky blue, and hot pink.
export const theme = {
  colors: {
    primary: '#FF6347', // Tomato — primary CTAs, "wrong/miss" feedback
    secondary: '#8A2BE2', // Blue Violet — secondary actions, letter tiles
    accent: '#FF1493', // Hot/Deep Pink — celebration, highlights, success feedback
    gold: '#FFD700', // Gold — honey pots, rewards, the "selected" state
    success: '#32CD32', // Lime Green — go/play actions
    background: '#00BFFF', // Deep Sky Blue — page background
    surface: '#FFFFFF',
    text: '#111111',
    muted: '#2B2350', // Dark enough to stay readable both on white cards and directly on the blue background
    // Soft periwinkle — calm/"resting" states only (the daily-streak grace day, UX Step 22). Never
    // a failure color: `primary` stays reserved for wrong/miss. Provisional per UX Step 22 (flagged
    // optional there) — swap for `muted`/lightened `secondary` if a device check says otherwise.
    rest: '#C9C3F5',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
