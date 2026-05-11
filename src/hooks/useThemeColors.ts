import { useState } from 'react';

/*
 * 1:1 port of v1's COLORS reader at docs/legacy/index.html:L233-243:
 *
 *   const COLORS = (() => {
 *     const fallback = { curve: '#1a1a1a', tangent: '#6b4eff', border: '#e8e6e0' };
 *     if (typeof getComputedStyle === 'undefined' || !document.documentElement) return fallback;
 *     const cs = getComputedStyle(document.documentElement);
 *     const get = (name, fb) => (cs.getPropertyValue(name).trim() || fb);
 *     return {
 *       curve:   get('--curve',   fallback.curve),
 *       tangent: get('--tangent', fallback.tangent),
 *       border:  get('--border',  fallback.border),
 *     };
 *   })();
 *
 * v1 reads exactly three CSS variables. Previous v2 widened the return shape
 * to eleven keys (bg/surface/ink/inkSoft/accent/accentSoft/ghost/warn etc.)
 * that no consumer ever accessed — confirmed via grep across src/routes/*.tsx.
 * Subagent review I1 flagged this drift; the surface is now restored to v1's
 * three keys exactly.
 */
export interface ThemeColors {
  border: string;
  curve: string;
  tangent: string;
}

const FALLBACKS: ThemeColors = {
  border: '#e8e6e0',
  curve: '#1a1a1a',
  tangent: '#6b4eff',
};

function readVars(): ThemeColors {
  if (typeof window === 'undefined') return FALLBACKS;
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    border: get('--border', FALLBACKS.border),
    curve: get('--curve', FALLBACKS.curve),
    tangent: get('--tangent', FALLBACKS.tangent),
  };
}

export function useThemeColors(): ThemeColors {
  const [colors] = useState<ThemeColors>(() => readVars());
  return colors;
}
