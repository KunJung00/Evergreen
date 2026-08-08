import { describe, expect, it } from 'vitest';

import en from '../../messages/en.json';
import th from '../../messages/th.json';

/**
 * BUILD-SPEC §10: `messages/th.json` and `messages/en.json` must have an
 * identical set of keys. This test makes CI fail on any drift (missing/extra
 * key in either locale), which is the enforcement the spec calls for.
 */

type Json = Record<string, unknown>;

/** Flatten a nested message object into dot-separated leaf key paths. */
function keyPaths(obj: Json, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? keyPaths(value as Json, path)
      : [path];
  });
}

describe('i18n message parity', () => {
  const thKeys = keyPaths(th as Json);
  const enKeys = keyPaths(en as Json);
  const thSet = new Set(thKeys);
  const enSet = new Set(enKeys);

  it('has no keys in th.json missing from en.json', () => {
    const missing = thKeys.filter((k) => !enSet.has(k));
    expect(missing, `Missing in en.json: ${missing.join(', ')}`).toEqual([]);
  });

  it('has no keys in en.json missing from th.json', () => {
    const missing = enKeys.filter((k) => !thSet.has(k));
    expect(missing, `Missing in th.json: ${missing.join(', ')}`).toEqual([]);
  });
});
