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

// Fallback palette mirrors the @theme tokens in src/index.css. It exists so
// that (a) SSR / pre-render contexts have valid hex literals and (b) any test
// environment that does not load the Tailwind stylesheet (jsdom) still gets
// drawable colors.
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
    bg: get('--color-bg', FALLBACKS.bg),
    surface: get('--color-surface', FALLBACKS.surface),
    ink: get('--color-ink', FALLBACKS.ink),
    inkSoft: get('--color-ink-soft', FALLBACKS.inkSoft),
    border: get('--color-border', FALLBACKS.border),
    accent: get('--color-accent', FALLBACKS.accent),
    accentSoft: get('--color-accent-soft', FALLBACKS.accentSoft),
    curve: get('--color-curve', FALLBACKS.curve),
    tangent: get('--color-tangent', FALLBACKS.tangent),
    ghost: get('--color-ghost', FALLBACKS.ghost),
    warn: get('--color-warn', FALLBACKS.warn),
  };
}

// Read the theme palette once per component mount via a lazy useState
// initializer. The CSS variables in src/index.css are set on
// `document.documentElement` by Tailwind's @theme block which is loaded
// synchronously before React mounts, so a single read at mount is enough
// for an SPA — there is no SSR hydration window to bridge.
export function useThemeColors(): ThemeColors {
  const [colors] = useState<ThemeColors>(() => readVars());
  return colors;
}
