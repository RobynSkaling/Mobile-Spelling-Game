import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { HONEY_LARDER_FLOOR, HONEY_LARDER_START, useSessionStore } from './session-store';

function resetStore() {
  useSessionStore.setState({
    honeyStash: HONEY_LARDER_START,
    stolenOutstanding: 0,
    villainId: null,
    lastVillainId: null,
    score: 0,
    currentWord: null,
  });
}

describe('session-store honey larder', () => {
  beforeEach(resetStore);

  it('starts at HONEY_LARDER_START with nothing outstanding', () => {
    const state = useSessionStore.getState();
    assert.equal(state.honeyStash, HONEY_LARDER_START);
    assert.equal(state.stolenOutstanding, 0);
  });

  it('earnHoneyPot adds one pot when nothing is outstanding', () => {
    useSessionStore.getState().earnHoneyPot();
    assert.equal(useSessionStore.getState().honeyStash, HONEY_LARDER_START + 1);
    assert.equal(useSessionStore.getState().stolenOutstanding, 0);
  });

  it('stealHoneyPot takes one pot and records it as outstanding, above the floor', () => {
    const stole = useSessionStore.getState().stealHoneyPot();
    assert.equal(stole, true);
    assert.equal(useSessionStore.getState().honeyStash, HONEY_LARDER_START - 1);
    assert.equal(useSessionStore.getState().stolenOutstanding, 1);
  });

  it('stealHoneyPot refuses to take the last pot at/below the floor', () => {
    useSessionStore.setState({ honeyStash: HONEY_LARDER_FLOOR, stolenOutstanding: 0 });
    const stole = useSessionStore.getState().stealHoneyPot();
    assert.equal(stole, false);
    assert.equal(useSessionStore.getState().honeyStash, HONEY_LARDER_FLOOR);
  });

  it('earnHoneyPot recovers one outstanding stolen pot on top of the normal +1 earn', () => {
    useSessionStore.getState().stealHoneyPot(); // honeyStash -1, stolenOutstanding 1
    const stashAfterSteal = useSessionStore.getState().honeyStash;

    useSessionStore.getState().earnHoneyPot();

    assert.equal(useSessionStore.getState().honeyStash, stashAfterSteal + 2);
    assert.equal(useSessionStore.getState().stolenOutstanding, 0);
  });

  it('earnHoneyPot only recovers one pot at a time, even with multiple outstanding', () => {
    useSessionStore.setState({ honeyStash: 5, stolenOutstanding: 2 });
    useSessionStore.getState().earnHoneyPot();
    assert.equal(useSessionStore.getState().honeyStash, 5 + 2); // +1 earn, +1 recovered
    assert.equal(useSessionStore.getState().stolenOutstanding, 1);
  });
});

describe('session-store villain selection', () => {
  beforeEach(resetStore);

  it('picks a villain from the shared pool and records it as lastVillainId', () => {
    useSessionStore.getState().pickSessionVillain('easy');
    const { villainId, lastVillainId } = useSessionStore.getState();
    assert.ok(villainId);
    assert.equal(lastVillainId, villainId);
  });
});
