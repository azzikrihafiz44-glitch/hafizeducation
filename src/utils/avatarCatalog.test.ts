import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTER_ITEMS } from '../data/wardrobeCatalog.ts';

test('CHARACTER_ITEMS provides more than 500 unique cute avatars', () => {
  assert.ok(CHARACTER_ITEMS.length > 500, `Expected >500 avatars, got ${CHARACTER_ITEMS.length}`);
  const uniqueIds = new Set(CHARACTER_ITEMS.map((c) => c.id));
  assert.equal(uniqueIds.size, CHARACTER_ITEMS.length);
  assert.ok(CHARACTER_ITEMS.some((c) => c.id === 'char-alien-mars'));
});
