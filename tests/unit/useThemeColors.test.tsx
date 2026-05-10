import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThemeColors, type ThemeColors } from '../../src/hooks/useThemeColors';

// Smoke test: jsdom does not parse Tailwind/CSS so the hook will hit the
// fallback path. We verify that all keys are non-empty strings — the
// production code path (with --color-* set) is exercised by route component
// tests and e2e via the actual stylesheet.
describe('useThemeColors', () => {
  it('returns non-empty strings for every theme key', () => {
    const { result } = renderHook(() => useThemeColors());
    const keys: (keyof ThemeColors)[] = [
      'bg', 'surface', 'ink', 'inkSoft', 'border', 'accent', 'accentSoft',
      'curve', 'tangent', 'ghost', 'warn',
    ];
    for (const k of keys) {
      expect(typeof result.current[k]).toBe('string');
      expect(result.current[k].length).toBeGreaterThan(0);
    }
  });

  it('respects --color-* values when they are set on documentElement', () => {
    document.documentElement.style.setProperty('--color-curve', '#123456');
    document.documentElement.style.setProperty('--color-tangent', '#abcdef');
    try {
      const { result } = renderHook(() => useThemeColors());
      expect(result.current.curve).toBe('#123456');
      expect(result.current.tangent).toBe('#abcdef');
    } finally {
      document.documentElement.style.removeProperty('--color-curve');
      document.documentElement.style.removeProperty('--color-tangent');
    }
  });
});
