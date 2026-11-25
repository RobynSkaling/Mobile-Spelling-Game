import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256Hex } from './sha256';

describe('sha256Hex', () => {
  it('matches the FIPS 180-4 test vectors', () => {
    assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.equal(
      sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it("agrees with Node's own SHA-256 across padding boundaries and non-ASCII input", () => {
    const inputs = ['1234', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(119), 'salt:🐝:4321', 'héllo'];
    for (const input of inputs) {
      assert.equal(sha256Hex(input), createHash('sha256').update(input, 'utf8').digest('hex'), JSON.stringify(input));
    }
  });
});
