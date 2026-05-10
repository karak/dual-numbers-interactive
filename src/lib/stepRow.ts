// Shared type for derivation step rows ported from v1's `compute().steps`.
export interface DerivationStep {
  latex: string;
  highlight?: boolean;
  ghost?: boolean;
}
