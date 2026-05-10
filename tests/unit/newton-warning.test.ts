import { describe, it, expect } from 'vitest';
import { isNewWarningTriggered } from '../../src/lib/newton';

// v1 source: docs/legacy/index.html L638
//   showWarn => '⚠ f\'(x) が 0 に近い：発散の恐れ。初期値を変えてみてください。'
// v1 has the same dead-code bug: the warning is computed against the just-
// pushed row whose dfx is always NaN. v2 fixes it by scanning history from
// the end for the last finite dfx, so the warning is now reachable.
describe('isNewWarningTriggered', () => {
  it('returns false for empty history', () => {
    expect(isNewWarningTriggered([])).toBe(false);
  });

  it('returns false when the last finite dfx is large', () => {
    expect(
      isNewWarningTriggered([
        { dfx: 10 },
        { dfx: 5 },
        { dfx: NaN },
      ]),
    ).toBe(false);
  });

  it('returns true when the last finite dfx magnitude is < 1e-6', () => {
    expect(
      isNewWarningTriggered([
        { dfx: 10 },
        { dfx: 1e-9 },
        { dfx: NaN },
      ]),
    ).toBe(true);
  });

  it('skips trailing NaN rows and uses the prior finite dfx (near zero)', () => {
    expect(
      isNewWarningTriggered([
        { dfx: 5 },
        { dfx: -5e-7 },
        { dfx: NaN },
        { dfx: NaN },
      ]),
    ).toBe(true);
  });

  it('returns false when every row has NaN dfx', () => {
    expect(
      isNewWarningTriggered([
        { dfx: NaN },
        { dfx: NaN },
      ]),
    ).toBe(false);
  });
});
