#!/usr/bin/env node

/**
 * Baton Coordinator Runner (scripts/baton.mjs)
 * Coordinates dual-agent handoffs between Claude Code (Builder) and Antigravity (Gatekeeper).
 * Provides 3 execution tiers (Express / Scoped / Full) and circuit breaker protection.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

export const SYNC_JSON_PATH = resolve(REPO_ROOT, '.agents/sync/handoff.json');
export const SYNC_MD_PATH = resolve(REPO_ROOT, '.agents/sync/handoff.md');

const DEFAULT_STATE = {
  version: '1.0',
  task_id: 'TASK-00',
  active_agent: 'claude',
  status: 'idle',
  turn_count: 0,
  max_turns: 5,
  last_updated: new Date().toISOString(),
  summary: 'Initialized',
  files_modified: []
};

/**
 * Read the current sync state, auto-healing with defaults if missing or corrupted.
 */
export function readSyncState(filePath = SYNC_JSON_PATH) {
  try {
    if (!existsSync(filePath)) {
      writeSyncState(DEFAULT_STATE, filePath);
      return { ...DEFAULT_STATE };
    }
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    writeSyncState(DEFAULT_STATE, filePath);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Write sync state atomically.
 */
export function writeSyncState(state, filePath = SYNC_JSON_PATH) {
  const content = JSON.stringify(state, null, 2) + '\n';
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Check if the ping-pong circuit breaker has been tripped.
 * Returns true if execution is permitted, false if tripped (turn_count >= max_turns).
 */
export function checkCircuitBreaker(state) {
  const max = state.max_turns ?? 5;
  const current = state.turn_count ?? 0;
  return current < max;
}

/**
 * Distill error outputs to a maximum of 25 lines to protect Claude Pro context window.
 */
export function distillDiagnostics(rawOutput) {
  if (!rawOutput) return 'No output captured.';
  const lines = rawOutput.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length <= 25) {
    return lines.join('\n');
  }

  // Look for error, fail, or traceback markers
  const errorLines = lines.filter(l => 
    /error|fail|exception|assert|traceback|expected|received/i.test(l)
  );

  const selected = errorLines.length > 0 ? errorLines.slice(0, 22) : lines.slice(-22);
  return [
    `... [Truncated ${lines.length - selected.length} lines of raw logs] ...`,
    ...selected
  ].join('\n');
}

/**
 * Auto-detect the execution tier based on touched files.
 * Tier 1: Express Lane (Micro/Cosmetic: CSS, markdown, static assets, docs)
 * Tier 2: Scoped Lane (Single component/module and/or its test file)
 * Tier 3: Architectural Deep Lane (DB schema, migrations, auth, multi-file features)
 */
export function detectExecutionTier(modifiedFiles = []) {
  if (!modifiedFiles || modifiedFiles.length === 0) {
    return 1;
  }

  const cosmeticExtensions = ['.md', '.css', '.scss', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico'];
  const isAllCosmetic = modifiedFiles.every(file => {
    const lower = file.toLowerCase();
    return cosmeticExtensions.some(ext => lower.endsWith(ext)) || lower.startsWith('docs/');
  });

  if (isAllCosmetic) {
    return 1;
  }

  const isArchitectural = modifiedFiles.some(file => 
    /schema|migration|auth|middleware|config/i.test(file)
  ) || modifiedFiles.length > 3;

  if (isArchitectural) {
    return 3;
  }

  return 2;
}

/**
 * Determine the test command to run for a given tier.
 */
export function resolveTestExecution(tier, scope) {
  if (tier === 1) {
    return { command: 'git diff --stat', isExpress: true };
  }

  if (scope) {
    // Tooling test written in Python
    if (scope.endsWith('.py')) {
      return { command: `python3 -m unittest ${scope}`, isExpress: false };
    }
    // App test: Jest runs inside mobile/, so drop a leading "mobile/"
    const appScope = scope.replace(/^mobile\//, '');
    return { command: `npm --prefix mobile test -- ${appScope}`, isExpress: false };
  }

  // Default: type-check and unit-test the app in mobile/.
  // The template's own tooling tests run on demand with `npm run test:tooling`.
  return { command: 'npm run check', isExpress: false };
}

/**
 * Get modified files from git status.
 */
function getGitModifiedFiles() {
  try {
    const stdout = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf-8' });
    return stdout
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.slice(3).trim());
  } catch {
    return [];
  }
}

/**
 * CLI Entry point
 */
export async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  if (command === 'status') {
    const state = readSyncState();
    const modified = getGitModifiedFiles();
    const tier = detectExecutionTier(modified);
    console.log('\n=== Baton Sync Status ===');
    console.log(`Status:       ${state.status}`);
    console.log(`Active Agent: ${state.active_agent}`);
    console.log(`Turn Count:   ${state.turn_count} / ${state.max_turns}`);
    console.log(`Detected Tier:${tier} (${tier === 1 ? 'Express' : tier === 2 ? 'Scoped' : 'Architectural'})`);
    console.log(`Modified:     ${modified.length} files`);
    if (modified.length > 0) {
      console.log(`              ${modified.slice(0, 5).join(', ')}${modified.length > 5 ? '...' : ''}`);
    }
    console.log('=========================\n');
    process.exit(0);
  }

  if (command === 'reset') {
    writeSyncState(DEFAULT_STATE);
    console.log('[Baton] State reset to idle.');
    process.exit(0);
  }

  if (command === 'verify') {
    const state = readSyncState();

    // Check circuit breaker
    if (!checkCircuitBreaker(state)) {
      console.error('\n[CIRCUIT BREAKER TRIPPED]');
      console.error(`Baton halted: reached max turns (${state.turn_count}/${state.max_turns}) without green test.`);
      console.error('Developer intervention required. Please inspect the code or run npm run sync:reset.\n');
      process.exit(1);
    }

    // Determine tier & scope
    let tierOverride = null;
    let scopeOverride = null;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--tier' && args[i + 1]) {
        tierOverride = parseInt(args[i + 1], 10);
      }
      if (args[i] === '--scope' && args[i + 1]) {
        scopeOverride = args[i + 1];
      }
    }

    const modified = getGitModifiedFiles();
    const tier = tierOverride || detectExecutionTier(modified);
    const { command: testCmd, isExpress } = resolveTestExecution(tier, scopeOverride);

    console.log(`\n[Baton] Verifying changes (Tier ${tier}${tierOverride ? ' - manual override' : ' - auto-detected'})...`);

    if (isExpress) {
      console.log('[Baton] Tier 1 Express Lane: Cosmetic/asset changes detected. Full tests bypassed.');
      state.status = 'verified';
      state.last_updated = new Date().toISOString();
      state.files_modified = modified;
      writeSyncState(state);
      console.log('[Baton] PASS: Verified.\n');
      process.exit(0);
    }

    console.log(`[Baton] Executing test command: ${testCmd}`);
    let testSuccess = false;
    let testOutput = '';

    try {
      testOutput = execSync(testCmd, { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' });
      testSuccess = true;
    } catch (err) {
      testSuccess = false;
      testOutput = (err.stdout || '') + '\n' + (err.stderr || '');
    }

    if (testSuccess) {
      state.status = 'verified';
      state.turn_count = 0; // reset turn count on success
      state.last_updated = new Date().toISOString();
      state.files_modified = modified;
      writeSyncState(state);

      console.log('\n[Baton] PASS: All tests passed! Verification completed.');
      console.log('Status set to "verified".\n');
      process.exit(0);
    } else {
      state.status = 'verification_failed';
      state.turn_count = (state.turn_count || 0) + 1;
      state.last_updated = new Date().toISOString();
      state.files_modified = modified;
      writeSyncState(state);

      const distilled = distillDiagnostics(testOutput);
      console.error('\n[Baton] FAIL: Verification failed.');
      console.error(`Recorded Turn ${state.turn_count} / ${state.max_turns} in .agents/sync/handoff.json.`);
      console.error('\n--- Distilled Failure Diagnostic (For Claude Code) ---');
      console.error(distilled);
      console.error('------------------------------------------------------\n');
      process.exit(1);
    }
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('[Baton] Unexpected error:', err);
    process.exit(1);
  });
}
