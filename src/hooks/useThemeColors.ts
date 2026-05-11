import { useState } from 'react';

export interface ThemeColors {
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  border: string;
  accent: string;
  accentSoft: string;
  curve: string;
  tangent: string;
  ghost: string;
  warn: string;
}

/*
 * Mirrors v1's COLORS reader at docs/legacy/index.html:L233-247:
 *
 *   const COLORS = (() => {
 *     const fallback = { curve: '#1a1a1a', tangent: '#6b4eff', border: '#e8e6e0' };
 *     ...
 *     return {
 *       curve:   get('--curve',   fallback.curve),
 *       tangent: get('--tangent', fallback.tangent),
 *       ...
 *     };
 *   })();
 *
 * v1 reads bare-name CSS vars (--curve, --bg, --ink, ...) declared in the
 * :root block at docs/legacy/index.html:L15-25. After Step 0 (verbatim CSS
 * port), src/index.css declares the same vars at :root with the same names,
 * so this hook reads them verbatim — no --color-* prefix.
 */
const FALLBACKS: ThemeColors = {
  bg: '#fafaf7',
  surface: '#ffffff',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  border: '#e8e6e0',
  accent: '#5538e8',
  accentSoft: '#ede9ff',
  curve: '#1a1a1a',
  tangent: '#6b4eff',
  ghost: '#b8b3a8',
  warn: '#b00020',
};

function readVars(): ThemeColors {
  if (typeof window === 'undefined') return FALLBACKS;
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => {
    const v = cs.getPropertyValue(name).trim();
    if (!v && import.meta.env.DEV) {
      console.warn(`useThemeColors: CSS var ${name} not set; using fallback ${fallback}`);
    }
    return v || fallback;
  };
  return {
    bg: get('--bg', FALLBACKS.bg),
    surface: get('--surface', FALLBACKS.surface),
    ink: get('--ink', FALLBACKS.ink),
    inkSoft: get('--ink-soft', FALLBACKS.inkSoft),
    border: get('--border', FALLBACKS.border),
    accent: get('--accent', FALLBACKS.accent),
    accentSoft: get('--accent-soft', FALLBACKS.accentSoft),
    curve: get('--curve', FALLBACKS.curve),
    tangent: get('--tangent', FALLBACKS.tangent),
    ghost: get('--ghost', FALLBACKS.ghost),
    warn: get('--warn', FALLBACKS.warn),
  };
}

export function useThemeColors(): ThemeColors {
  const [colors] = useState<ThemeColors>(() => readVars());
  return colors;
}
