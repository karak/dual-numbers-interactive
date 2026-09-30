import { describe, it, expect } from 'vitest';
import { normalizeStyleAttr, styleAttrEqual } from '../e2e/_style-normalize';

// Subagent review I4 (.claude/plans/rustling-swinging-crescent.md):
// v1-equal walker compares raw `style="..."` attribute strings, but
// CSSOM / React serializers can render the same declarations with
// different whitespace, trailing semicolons, and ordering. Normalization
// is required to compare meaning rather than incidental syntax.
describe('normalizeStyleAttr', () => {
  it('returns "" for empty / undefined-equivalent input', () => {
    expect(normalizeStyleAttr('')).toBe('');
    expect(normalizeStyleAttr('   ')).toBe('');
  });

  it('drops trailing semicolons', () => {
    expect(normalizeStyleAttr('margin-top:16px;')).toBe('margin-top:16px');
    expect(normalizeStyleAttr('margin-top:16px;;')).toBe('margin-top:16px');
  });

  it('collapses whitespace around colons and between declarations', () => {
    expect(normalizeStyleAttr('margin-top: 16px ; color : red')).toBe('color:red;margin-top:16px');
  });

  it('sorts declarations alphabetically by property name', () => {
    expect(normalizeStyleAttr('z-index:1;color:red;margin:0')).toBe('color:red;margin:0;z-index:1');
  });

  it('lowercases property names but preserves value casing', () => {
    expect(normalizeStyleAttr('Color:RED')).toBe('color:RED');
  });

  it('drops malformed declarations missing prop or value', () => {
    expect(normalizeStyleAttr(':no-prop;valid:1;no-value:')).toBe('valid:1');
  });
});

describe('styleAttrEqual', () => {
  it('treats v1 "margin-top:16px" and v2 "margin-top: 16px;" as equal', () => {
    expect(styleAttrEqual('margin-top:16px', 'margin-top: 16px;')).toBe(true);
  });

  it('treats order-different but content-equal as equal', () => {
    expect(styleAttrEqual('color:red;margin:0', 'margin: 0; color: red;')).toBe(true);
  });

  it('returns false when value differs', () => {
    expect(styleAttrEqual('margin-top:16px', 'margin-top:17px')).toBe(false);
  });

  it('returns false when one side has an extra declaration', () => {
    expect(styleAttrEqual('margin:0', 'margin:0;color:red')).toBe(false);
  });
});
