import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Subagent review C4 (.claude/plans/rustling-swinging-crescent.md):
// scripts/check-v1-css-subset.mjs reads docs/legacy/index.html at run time
// and asserts the dedented <style> block appears verbatim in src/index.css.
// If v1 itself is ever edited (intentionally or by mistake), both sides
// update together and the gate stays green — the "v1 is source of truth"
// rule is undefended at the file-integrity level.
//
// Fix: pin the SHA-256 of docs/legacy/index.html in scripts/v1.sha256, and
// have the script verify the pin before doing the substring check. Any
// intentional v1 edit then becomes a deliberate two-step ceremony (edit v1,
// then update v1.sha256 in a separate commit so the diff is reviewable).

const SCRIPT = 'scripts/check-v1-css-subset.mjs';

function runScript(opts: { v1Path?: string; pinPath?: string; cssPath?: string } = {}): {
  code: number;
  stdout: string;
  stderr: string;
} {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  if (opts.v1Path) env.V1_PATH = opts.v1Path;
  if (opts.pinPath) env.V1_SHA256_PATH = opts.pinPath;
  if (opts.cssPath) env.V2_CSS_PATH = opts.cssPath;
  const r = spawnSync('node', [SCRIPT], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
  });
  return { code: r.status ?? 0, stdout: r.stdout, stderr: r.stderr };
}

describe('scripts/check-v1-css-subset.mjs', () => {
  let tmpDir: string;
  let v1Copy: string;
  let pinFile: string;
  let cssCopy: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'check-v1-css-'));
    v1Copy = join(tmpDir, 'index.html');
    pinFile = join(tmpDir, 'v1.sha256');
    cssCopy = join(tmpDir, 'index.css');
    // Seed with the real v1 + real pin + real css so the baseline passes.
    writeFileSync(v1Copy, readFileSync('docs/legacy/index.html'));
    writeFileSync(pinFile, readFileSync('scripts/v1.sha256'));
    writeFileSync(cssCopy, readFileSync('src/index.css'));
  });
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('passes when v1, pin, and v2 css all agree (baseline)', () => {
    const r = runScript({ v1Path: v1Copy, pinPath: pinFile, cssPath: cssCopy });
    expect(r.code).toBe(0);
  });

  it('fails when v1 is edited but the pin is not (integrity guard, C4)', () => {
    // Mutate v1: change a single token. Without an SHA pin, the script
    // would re-anchor to the modified v1 and (if the same modification is
    // not propagated to src/index.css) still report "missing" — but worse,
    // if v1 and v2 were modified together, the gate would silently approve
    // the drift. Pinning catches the v1 mutation BEFORE doing the substring
    // check.
    let v1 = readFileSync(v1Copy, 'utf8');
    v1 = v1.replace('--bg: #fafaf7;', '--bg: #ffffff;');
    writeFileSync(v1Copy, v1);
    const r = runScript({ v1Path: v1Copy, pinPath: pinFile, cssPath: cssCopy });
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/sha256|integrity|pin/i);
  });

  it('fails when pin file is missing', () => {
    rmSync(pinFile);
    const r = runScript({ v1Path: v1Copy, pinPath: pinFile, cssPath: cssCopy });
    expect(r.code).toBe(1);
  });

  it('still detects v2 css drift when v1 is unchanged (existing behaviour preserved)', () => {
    // Delete a v1 rule from the v2 CSS copy. v1 + pin are still in sync, so
    // integrity passes; the substring check must then catch the drift.
    let css = readFileSync(cssCopy, 'utf8');
    css = css.replace('.warn { color: #b00020; }\n', '');
    writeFileSync(cssCopy, css);
    const r = runScript({ v1Path: v1Copy, pinPath: pinFile, cssPath: cssCopy });
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/verbatim|<style>/i);
  });
});
