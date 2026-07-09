export type VoicePackId = 'mama-bear';

export type VoicePack = {
  id: VoicePackId;
  label: string;
  /** Base speech rate for this pack's personality. 1.0 is a normal adult speaking pace. */
  rate: number;
  /** Base pitch for this pack's personality. 1.0 is a normal pitch. */
  pitch: number;
  praisePhrases: string[];
};

export const DEFAULT_VOICE_PACK_ID: VoicePackId = 'mama-bear';

// Slower and a little higher than a normal adult voice — closer to how adults naturally speak to
// young children (child-directed speech): clearer, warmer, less flat/robotic.
const MAMA_BEAR_PACK: VoicePack = {
  id: 'mama-bear',
  label: 'Mama Bear',
  rate: 0.95,
  pitch: 1.15,
  praisePhrases: [
    'Amazing job!',
    'You are a spelling superstar!',
    'Woohoo, perfect!',
    'Fantastic spelling!',
    'You nailed it!',
    'Incredible work!',
    'Sweet as honey!',
    'Mama Bear is so proud of you!',
    'Bee-utiful spelling!',
    'You are on fire!',
    'Way to go, superstar!',
    'That was purr-fect!',
  ],
};

// Adding a new pack later is just adding another entry here with its own phrases and
// personality — the speech service and UI don't need to change.
export const VOICE_PACKS: Record<VoicePackId, VoicePack> = {
  'mama-bear': MAMA_BEAR_PACK,
};

export function getVoicePack(id: VoicePackId): VoicePack {
  return VOICE_PACKS[id] ?? VOICE_PACKS[DEFAULT_VOICE_PACK_ID];
}
