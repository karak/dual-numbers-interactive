export const fmt3 = (n: number): string => n.toFixed(3);

export const signed = (n: number): string =>
  n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`;
