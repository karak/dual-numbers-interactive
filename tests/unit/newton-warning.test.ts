import { describe, it, expect } from 'vitest';
import { isNewWarningTriggered } from '../../src/lib/newton';

// v1 source: docs/legacy/index.html:L637-638
//   warnEl.textContent =
//     last && Number.isFinite(last.dfx) && Math.abs(last.dfx) < 1e-6 ? '⚠ ...' : '';
//
// v1's predicate reads ONLY the last row's `dfx`. In normal v1 usage, after
// every step the just-pushed row has `dfx = NaN` (filled in on the *next*
// step), so `Number.isFinite(NaN) === false` and the warn never fires — it
// is effectively dead code in v1.
//
// v2 must mirror v1 semantics. The previous v2 deviation that scanned history
// for the most recent finite dfx made the warn reachable; per the "v1 is the
// source of truth" rule (.claude/plans/rustling-swinging-crescent.md), that
// deviation has been reverted.
describe('isNewWarningTriggered (v1:L637-638)', () => {
  it('returns false for empty history', () => {
    expect(isNewWarningTriggered([])).toBe(false);
  });

  it('returns false when last.dfx is NaN (normal v1 flow after any step)', () => {
    // Normal v1 history shape: the LAST row always has dfx = NaN because
    // step() pushes a fresh row whose dfx hasn't been computed yet.
    expect(isNewWarningTriggered([{ dfx: 10 }, { dfx: NaN }])).toBe(false);
    expect(isNewWarningTriggered([{ dfx: 5 }, { dfx: -5e-7 }, { dfx: NaN }])).toBe(false);
    expect(isNewWarningTriggered([{ dfx: NaN }])).toBe(false);
  });

  it('returns false when last.dfx is finite but large', () => {
    expect(isNewWarningTriggered([{ dfx: 10 }])).toBe(false);
    expect(isNewWarningTriggered([{ dfx: -1 }])).toBe(false);
  });

  it('returns true only when last.dfx is finite AND |last.dfx| < 1e-6', () => {
    // This branch is theoretically reachable via construction but not in v1's
    // normal step flow. We keep the assertion to document the predicate body.
    expect(isNewWarningTriggered([{ dfx: 1e-9 }])).toBe(true);
    expect(isNewWarningTriggered([{ dfx: -5e-7 }])).toBe(true);
  });

  it('matches v1: pathological seeded history with prior small-finite dfx but NaN last does NOT fire', () => {
    // Failing test introduced for the C2 reversal. v2 previously returned true
    // here (history scan); v1 returns false because it reads only the last row.
    const h = [{ dfx: 1e-9 }, { dfx: NaN }];
    expect(isNewWarningTriggered(h)).toBe(false);
  });
});
