import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addChild,
  ChildInput,
  createEmptyFamily,
  createParentPin,
  FamilyState,
  getActiveChild,
  getAge,
  getGateDestination,
  getLaunchRoute,
  hasParentPin,
  isValidPin,
  makeAdultChallenge,
  MAX_CHILDREN,
  migrateLegacyProfile,
  removeChild,
  setActiveChild,
  suggestAvatar,
  updateChild,
  verifyPin,
} from './family-logic';

const YEAR = 2026;
const kid = (name: string, overrides: Partial<ChildInput> = {}): ChildInput => ({
  name,
  avatar: '🦊',
  birthMonth: 5,
  birthYear: 2019,
  ...overrides,
});

function familyWith(names: string[]): FamilyState {
  let family = createEmptyFamily();
  names.forEach((name, index) => {
    const result = addChild(family, kid(name), { id: `c${index}`, createdAt: index, currentYear: YEAR });
    assert.ok(result.family, result.error ?? '');
    family = result.family;
  });
  return family;
}

describe('parent PIN', () => {
  it('accepts exactly four digits', () => {
    assert.equal(isValidPin('1234'), true);
    for (const bad of ['123', '12345', 'abcd', '12 4', '']) {
      assert.equal(isValidPin(bad), false, bad);
    }
  });

  it('stores a salted hash, never the PIN itself, and verifies only the right PIN', () => {
    const parent = createParentPin('4821', 'salt-a');
    assert.equal(hasParentPin(parent), true);
    assert.ok(!JSON.stringify(parent).includes('4821'));
    assert.equal(verifyPin(parent, '4821'), true);
    assert.equal(verifyPin(parent, '4822'), false);
  });

  it('uses the salt, so the same PIN hashes differently per device', () => {
    assert.notEqual(createParentPin('1111', 'salt-a').pinHash, createParentPin('1111', 'salt-b').pinHash);
  });

  it('never verifies when no PIN has been set', () => {
    assert.equal(verifyPin(createEmptyFamily().parent, '0000'), false);
  });

  it('refuses to create an invalid PIN', () => {
    assert.throws(() => createParentPin('12', 'salt'));
  });
});

describe('makeAdultChallenge', () => {
  it('produces a multi-step question whose answer matches', () => {
    let seed = 0.1;
    const random = () => (seed = (seed * 9301 + 0.49297) % 1);
    for (let i = 0; i < 20; i++) {
      const { question, answer } = makeAdultChallenge(random);
      const [, a, b, c] = question.match(/^\((\d+) × (\d+)\) \+ (\d+)$/)!.map(Number);
      assert.equal(answer, a * b + c);
      assert.ok(a >= 6 && b >= 6 && c >= 11, question);
    }
  });
});

describe('getAge', () => {
  it('counts whole years, with the birthday counted from the start of the birth month', () => {
    assert.equal(getAge(5, 2019, { year: 2026, month: 4 }), 6);
    assert.equal(getAge(5, 2019, { year: 2026, month: 5 }), 7);
    assert.equal(getAge(5, 2019, { year: 2026, month: 12 }), 7);
  });

  it('is null when the birth month or year is unknown (migrated profile)', () => {
    assert.equal(getAge(null, 2019, { year: 2026, month: 1 }), null);
    assert.equal(getAge(3, null, { year: 2026, month: 1 }), null);
  });
});

describe('addChild', () => {
  it('adds a child, trims the name, and makes the first child active', () => {
    const result = addChild(createEmptyFamily(), kid('  Hoots '), { id: 'c0', createdAt: 1, currentYear: YEAR });
    assert.ok(result.family);
    assert.equal(result.family.children[0].name, 'Hoots');
    assert.equal(result.family.activeChildId, 'c0');
  });

  it('keeps the current active child when adding a sibling', () => {
    assert.equal(familyWith(['A', 'B']).activeChildId, 'c0');
  });

  it(`refuses a child beyond MAX_CHILDREN (${MAX_CHILDREN})`, () => {
    const full = familyWith(Array.from({ length: MAX_CHILDREN }, (_, i) => `Kid${i}`));
    const result = addChild(full, kid('One More'), { id: 'x', createdAt: 0, currentYear: YEAR });
    assert.equal(result.family, null);
    assert.match(result.error!, /up to 6/);
  });

  it('validates name, birth month, and birth year', () => {
    const meta = { id: 'x', createdAt: 0, currentYear: YEAR };
    assert.match(addChild(createEmptyFamily(), kid('   '), meta).error!, /name/);
    assert.match(addChild(createEmptyFamily(), kid('A', { birthMonth: 13 }), meta).error!, /month/);
    assert.match(addChild(createEmptyFamily(), kid('A', { birthYear: YEAR }), meta).error!, /year/);
    assert.match(addChild(createEmptyFamily(), kid('A', { birthYear: 1990 }), meta).error!, /year/);
  });
});

describe('updateChild', () => {
  it('changes only the named child', () => {
    const result = updateChild(familyWith(['A', 'B']), 'c1', kid('Bea', { avatar: '🐸', birthMonth: 9 }), YEAR);
    assert.ok(result.family);
    assert.equal(result.family.children[0].name, 'A');
    assert.deepEqual(
      { name: result.family.children[1].name, avatar: result.family.children[1].avatar, month: result.family.children[1].birthMonth },
      { name: 'Bea', avatar: '🐸', month: 9 },
    );
  });

  it('reports an unknown child id', () => {
    assert.match(updateChild(familyWith(['A']), 'nope', kid('A'), YEAR).error!, /could not be found/);
  });
});

describe('removeChild', () => {
  it('removes a child and moves "active" to the first remaining child if needed', () => {
    const result = removeChild(familyWith(['A', 'B', 'C']), 'c0');
    assert.ok(result.family);
    assert.deepEqual(result.family.children.map((c) => c.id), ['c1', 'c2']);
    assert.equal(result.family.activeChildId, 'c1');
  });

  it('keeps the active child when someone else is removed', () => {
    const result = removeChild(familyWith(['A', 'B']), 'c1');
    assert.equal(result.family!.activeChildId, 'c0');
  });

  it('refuses to remove the only child', () => {
    const result = removeChild(familyWith(['A']), 'c0');
    assert.equal(result.family, null);
    assert.match(result.error!, /at least one child/);
  });
});

describe('active child', () => {
  it('switches to a known child and ignores an unknown id', () => {
    const family = familyWith(['A', 'B']);
    assert.equal(getActiveChild(setActiveChild(family, 'c1'))!.name, 'B');
    assert.equal(setActiveChild(family, 'nope').activeChildId, 'c0');
  });
});

describe('suggestAvatar', () => {
  const options = ['🐧', '🐺', '🦊'];

  it('picks the first avatar no sibling is using', () => {
    assert.equal(suggestAvatar([], options), '🐧');
    assert.equal(suggestAvatar([{ avatar: '🐧' }], options), '🐺');
    assert.equal(suggestAvatar([{ avatar: '🐧' }, { avatar: '🐺' }], options), '🦊');
  });

  it('falls back to the first avatar when all are taken', () => {
    assert.equal(suggestAvatar(options.map((avatar) => ({ avatar })), options), '🐧');
  });
});

describe('getLaunchRoute', () => {
  it('opens setup with no children, Home with one, and "Who\'s playing?" with two or more', () => {
    assert.equal(getLaunchRoute(createEmptyFamily()), '/parent-setup');
    assert.equal(getLaunchRoute(familyWith(['A'])), '/home');
    assert.equal(getLaunchRoute(familyWith(['A', 'B'])), '/whos-playing');
  });
});

describe('getGateDestination', () => {
  it('forwards to known parent-only screens, with or without a query string', () => {
    assert.equal(getGateDestination('/parent'), '/parent');
    assert.equal(getGateDestination('/children'), '/children');
    assert.equal(getGateDestination('/child-edit?id=c1'), '/child-edit?id=c1');
  });

  it('falls back to Parent View for anything missing, unknown, or crafted', () => {
    for (const bad of [undefined, '', '/home', '/play', 'https://example.com', '//evil.example', '/parentX', '/children-evil']) {
      assert.equal(getGateDestination(bad), '/parent', String(bad));
    }
  });
});

describe('migrateLegacyProfile', () => {
  it('turns the old single profile into the first, active child, keeping its id and leaving no PIN set', () => {
    const family = migrateLegacyProfile({ id: 'player-1', name: 'Hoots', avatar: '🦉' }, 5);
    assert.equal(family.children.length, 1);
    assert.deepEqual(family.children[0], {
      id: 'player-1',
      name: 'Hoots',
      avatar: '🦉',
      birthMonth: null,
      birthYear: null,
      createdAt: 5,
    });
    assert.equal(family.activeChildId, 'player-1');
    assert.equal(hasParentPin(family.parent), false);
    assert.equal(getLaunchRoute(family), '/home');
  });
});
