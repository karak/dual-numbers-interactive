/**
 * Normalizes a `style="..."` attribute string into a sorted, whitespace-
 * stripped canonical form so that v1 vs v2 byte comparison ignores
 * cosmetic serializer differences:
 *
 *   "margin-top:16px"          ↔ "margin-top: 16px;"            ↔ canonical
 *   "color:red; margin: 0px"  ↔ "margin:0px; color:red;"       ↔ canonical
 *
 * Returns a string of the form "prop1:value1;prop2:value2;..." with
 * declarations sorted by property name and all internal whitespace
 * collapsed. Empty / malformed declarations are dropped.
 *
 * Subagent review I4 (.claude/plans/rustling-swinging-crescent.md): the
 * walker previously string-compared raw style attribute literals, which
 * fires on cosmetic differences (React's serializer trailing semicolon
 * vs v1's hand-emitted `style`). The semantic content is what matters;
 * computed style already covers actual rendering.
 */
export function normalizeStyleAttr(s: string): string {
  if (!s) return '';
  const decls = s.split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const idx = d.indexOf(':');
      if (idx < 0) return null;
      const prop = d.slice(0, idx).trim().toLowerCase();
      const value = d.slice(idx + 1).trim();
      if (!prop || !value) return null;
      return `${prop}:${value}`;
    })
    .filter((x): x is string => x !== null)
    .sort();
  return decls.join(';');
}

/**
 * Compares two style attribute strings semantically. Returns true if they
 * declare the same set of (property, value) pairs ignoring order /
 * whitespace / trailing semicolons.
 */
export function styleAttrEqual(a: string, b: string): boolean {
  return normalizeStyleAttr(a) === normalizeStyleAttr(b);
}
