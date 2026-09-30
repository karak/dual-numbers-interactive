export const ROUTES = [
  { path: 'intro',        label: '導入' },
  { path: 'poly',         label: '多項式' },
  { path: 'trig',         label: '三角関数' },
  { path: 'chain',        label: '連鎖律' },
  { path: 'newton',       label: 'Newton 法' },
  { path: 'grad-descent', label: '勾配降下' },
] as const;

export type RoutePath = (typeof ROUTES)[number]['path'];

export const EPS = 1e-9;
