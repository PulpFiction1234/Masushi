/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, ensureSupabasePassword, getSupabasePasswordCandidates } from './strings';

test('normalize removes accents, trims, and lowercases', () => {
  assert.equal(normalize(' ÁÉÍÓÚ '), 'aeiou');
});

test('4-digit pins are transformed to a valid Supabase password without changing the user-facing PIN', () => {
  assert.equal(ensureSupabasePassword('1234'), '123400');
  assert.deepEqual(getSupabasePasswordCandidates('1234'), ['1234', '123400']);
});

