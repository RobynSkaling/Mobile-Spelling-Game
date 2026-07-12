import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTER_ROSTER } from './character-roster';
import { getCharacterAnimation } from './character-animations';

describe('character animation states', () => {
  it('gives villains the villain-only states and heroes only the shared ones', () => {
    for (const character of CHARACTER_ROSTER) {
      const expectsVillainStates = character.role === 'villain';
      assert.equal(
        character.animationStates.includes('Defeated'),
        expectsVillainStates,
        `${character.name}: 'Defeated' animation state present only for villains`,
      );
      assert.equal(
        character.animationStates.includes('BeingNaughty'),
        expectsVillainStates,
        `${character.name}: 'BeingNaughty' animation state present only for villains`,
      );
      assert.equal(
        character.animationStates.includes('Challenging'),
        expectsVillainStates,
        `${character.name}: 'Challenging' animation state present only for villains`,
      );
      for (const shared of ['Idle', 'Talking', 'Poked', 'Celebrating'] as const) {
        assert.ok(character.animationStates.includes(shared), `${character.name}: missing shared state '${shared}'`);
      }
    }
  });
});

describe('getCharacterAnimation', () => {
  it('returns null for every state today, since no sprite sheets have been delivered yet', () => {
    for (const character of CHARACTER_ROSTER) {
      for (const state of character.animationStates) {
        assert.equal(getCharacterAnimation(character.id, state), null);
      }
    }
  });

  it('returns null for an unknown character id rather than throwing', () => {
    assert.equal(getCharacterAnimation('totally-unknown-id', 'Idle'), null);
  });
});
