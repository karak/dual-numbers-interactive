import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Subagent review C3 (.claude/plans/rustling-swinging-crescent.md):
// scripts/check-no-tailwind.mjs previously only inspected the CONTENTS of
// `className="..."` / `className={\`...\`}` literals. A future contributor
// can trivially re-introduce Tailwind utilities through any indirection
// (variable, helper, classnames lib) and the gate stays green.
//
// These tests pin the broadened behaviour: utility patterns must be flagged
// wherever they appear in source (except comments), independent of the
// className= context.
//
// The script must read SCAN_DIR env so tests can point it at a tmpdir.

const SCRIPT = 'scripts/check-no-tailwind.mjs';

function runScript(scanDir: string): { code: number; stdout: string; stderr: string } {
  const r = spawnSync('node', [SCRIPT], {
    cwd: process.cwd(),
    env: { ...process.env, SCAN_DIR: scanDir },
    encoding: 'utf8',
  });
  return { code: r.status ?? 0, stdout: r.stdout, stderr: r.stderr };
}

describe('scripts/check-no-tailwind.mjs', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'check-no-tailwind-'));
    mkdirSync(join(tmpDir, 'sub'), { recursive: true });
  });
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('passes when scan dir is empty', () => {
    const r = runScript(tmpDir);
    expect(r.code).toBe(0);
  });

  it('passes on a v1-faithful component (only v1 class names)', () => {
    writeFileSync(
      join(tmpDir, 'Ok.tsx'),
      `export const X = () => <div className="layout"><aside className="sidebar"/></div>;`,
    );
    const r = runScript(tmpDir);
    expect(r.code).toBe(0);
  });

  it('flags @import "tailwindcss" in any file (meta check)', () => {
    writeFileSync(join(tmpDir, 'rogue.css'), `@import "tailwindcss";`);
    const r = runScript(tmpDir);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/tailwind/);
  });

  it('flags utility classes inside className="..." literal', () => {
    writeFileSync(
      join(tmpDir, 'Direct.tsx'),
      `export const X = () => <div className="flex gap-4 mt-3"/>;`,
    );
    const r = runScript(tmpDir);
    expect(r.code).toBe(1);
  });

  it('flags utility classes passed via a variable className expression (regression for C3)', () => {
    writeFileSync(
      join(tmpDir, 'Computed.tsx'),
      [
        `const cls = 'flex gap-4';`,
        `export const X = () => <div className={cls}/>;`,
      ].join('\n'),
    );
    const r = runScript(tmpDir);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/flex|gap-/);
  });

  it('flags utility classes assembled by a helper call', () => {
    writeFileSync(
      join(tmpDir, 'Helper.tsx'),
      `const cls = ['flex', 'gap-4'].join(' '); export const X = () => <div className={cls}/>;`,
    );
    const r = runScript(tmpDir);
    expect(r.code).toBe(1);
  });

  it('does NOT flag utility-shaped words inside a comment', () => {
    writeFileSync(
      join(tmpDir, 'Commented.tsx'),
      [
        `// Earlier this used 'flex gap-4'; replaced with v1's .panel class.`,
        `/* Reminder: do NOT add mt-3 / px-6 etc. */`,
        `export const X = () => <div className="panel"/>;`,
      ].join('\n'),
    );
    const r = runScript(tmpDir);
    expect(r.code).toBe(0);
  });
});
