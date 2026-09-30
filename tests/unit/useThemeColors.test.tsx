import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThemeColors } from '../../src/hooks/useThemeColors';

// v1 source: docs/legacy/index.html:L233-243 (the COLORS reader).
//
//   const COLORS = (() => {
//     const fallback = { curve: '#1a1a1a', tangent: '#6b4eff', border: '#e8e6e0' };
//     ...
//     return {
//       curve:   get('--curve',   fallback.curve),
//       tangent: get('--tangent', fallback.tangent),
//       border:  get('--border',  fallback.border),
//     };
//   })();
//
// v1's COLORS object has exactly three keys. Subagent review I1 found that
// v2 was returning eleven keys, of which eight were never read by any
// consumer (verified via grep across src/routes/*.tsx — only `border`,
// `curve`, `tangent` are accessed). The extra keys are dead code that
// drift v2 away from v1's surface area, and `--warn` is not even a v1 CSS
// variable.
describe('useThemeColors', () => {
  it('exposes exactly the v1 key set: border / curve / tangent', () => {
    const { result } = renderHook(() => useThemeColors());
    expect(Object.keys(result.current).sort()).toEqual(['border', 'curve', 'tangent']);
  });

  it('returns non-empty string values for each v1 key', () => {
    const { result } = renderHook(() => useThemeColors());
    for (const k of ['border', 'curve', 'tangent'] as const) {
      expect(typeof result.current[k]).toBe('string');
      expect(result.current[k].length).toBeGreaterThan(0);
    }
  });

  it('respects v1 bare-name CSS vars when set on documentElement', () => {
    document.documentElement.style.setProperty('--curve', '#123456');
    document.documentElement.style.setProperty('--tangent', '#abcdef');
    document.documentElement.style.setProperty('--border', '#fedcba');
    try {
      const { result } = renderHook(() => useThemeColors());
      expect(result.current.curve).toBe('#123456');
      expect(result.current.tangent).toBe('#abcdef');
      expect(result.current.border).toBe('#fedcba');
    } finally {
      document.documentElement.style.removeProperty('--curve');
      document.documentElement.style.removeProperty('--tangent');
      document.documentElement.style.removeProperty('--border');
    }
  });
});
