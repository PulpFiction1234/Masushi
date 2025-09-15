/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './strings';

test('normalize removes accents, trims, and lowercases', () => {
  assert.equal(normalize(' ÁÉÍÓÚ '), 'aeiou');
});

