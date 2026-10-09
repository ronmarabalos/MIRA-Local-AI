#!/usr/bin/env node

/**
 * skills-manager.mjs
 * Reversible skill soft-delete and archival manager.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const SKILLS_DIR = path.resolve(REPO_ROOT, '.agents', 'skills');
const ARCHIVE_DIR = path.resolve(REPO_ROOT, '.agents', 'skills-archive');
const BLUEPRINT_PATH = path.resolve(REPO_ROOT, 'project-blueprint.json');

/**
 * Ensure archive directory exists
 */
export function ensureDirs() {
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

/**
 * List all active and archived skills
 */
export function listSkills() {
  ensureDirs();

  const getSubdirs = (dir) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
      .map(entry => entry.name)
      .sort();
  };

  return {
    active: getSubdirs(SKILLS_DIR),
    archived: getSubdirs(ARCHIVE_DIR)
  };
}

/**
 * Enable (restore) a skill from archive
 */
export function enableSkill(skillName) {
  ensureDirs();
  const source = path.join(ARCHIVE_DIR, skillName);
  const target = path.join(SKILLS_DIR, skillName);

  if (!fs.existsSync(source)) {
    if (fs.existsSync(target)) {
      return { success: true, message: `Skill '${skillName}' is already active.` };
    }
    throw new Error(`Skill '${skillName}' not found in archive: ${source}`);
  }

  if (fs.existsSync(target)) {
    throw new Error(`Skill '${skillName}' already exists in active skills: ${target}`);
  }

  fs.renameSync(source, target);
  return { success: true, message: `Skill '${skillName}' enabled (moved to active skills).` };
}

/**
 * Disable (soft-delete) a skill into archive
 */
export function disableSkill(skillName) {
  ensureDirs();
  const source = path.join(SKILLS_DIR, skillName);
  const target = path.join(ARCHIVE_DIR, skillName);

  if (!fs.existsSync(source)) {
    if (fs.existsSync(target)) {
      return { success: true, message: `Skill '${skillName}' is already archived.` };
    }
    throw new Error(`Skill '${skillName}' not found in active skills: ${source}`);
  }

  if (fs.existsSync(target)) {
    throw new Error(`Skill '${skillName}' already exists in archive: ${target}`);
  }

  fs.renameSync(source, target);
  return { success: true, message: `Skill '${skillName}' disabled (moved to archive).` };
}

/**
 * Sync skills against an archetype
 */
export function syncSkillsToArchetype(archetypeName) {
  ensureDirs();

  if (!fs.existsSync(BLUEPRINT_PATH)) {
    throw new Error(`project-blueprint.json not found at ${BLUEPRINT_PATH}`);
  }

  const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf-8'));
  const archetype = blueprint.archetypes?.[archetypeName];

  if (!archetype) {
    const available = Object.keys(blueprint.archetypes || {}).join(', ');
    throw new Error(`Archetype '${archetypeName}' not found. Available archetypes: ${available}`);
  }

  const keepSkills = new Set(archetype.keep_skills || []);
  const currentSkills = listSkills();
  const disabled = [];
  const enabled = [];

  // Archive any active skill not in keep_skills
  for (const skill of currentSkills.active) {
    if (!keepSkills.has(skill)) {
      disableSkill(skill);
      disabled.push(skill);
    }
  }

  // Restore any archived skill that is in keep_skills
  for (const skill of currentSkills.archived) {
    if (keepSkills.has(skill)) {
      enableSkill(skill);
      enabled.push(skill);
    }
  }

  return {
    archetype: archetypeName,
    active_count: keepSkills.size,
    archived_count: listSkills().archived.length,
    disabled,
    enabled
  };
}

/**
 * CLI Entry point
 */
export async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  try {
    if (command === 'list') {
      const skills = listSkills();
      if (args.includes('--json')) {
        console.log(JSON.stringify(skills, null, 2));
      } else {
        console.log('\n=== Skills Catalog ===');
        console.log(`Active (${skills.active.length}):`);
        skills.active.forEach(s => console.log(`  ✓ ${s}`));
        console.log(`\nArchived (${skills.archived.length}):`);
        skills.archived.forEach(s => console.log(`  - ${s} (use npm run skill:enable ${s})`));
        console.log('======================\n');
      }
      process.exit(0);
    }

    if (command === 'enable') {
      const name = args[1];
      if (!name) {
        console.error('Error: specify skill name to enable. Example: npm run skill:enable pitch-architect');
        process.exit(1);
      }
      const res = enableSkill(name);
      console.log(`[Skills Manager] ${res.message}`);
      process.exit(0);
    }

    if (command === 'disable') {
      const name = args[1];
      if (!name) {
        console.error('Error: specify skill name to disable. Example: npm run skill:disable archify');
        process.exit(1);
      }
      const res = disableSkill(name);
      console.log(`[Skills Manager] ${res.message}`);
      process.exit(0);
    }

    if (command === 'sync') {
      const name = args[1] || 'fullstack-web';
      const res = syncSkillsToArchetype(name);
      console.log(`[Skills Manager] Synced to archetype '${res.archetype}'. Active: ${res.active_count}, Archived: ${res.archived_count}`);
      process.exit(0);
    }

    console.error(`Unknown command: ${command}. Use list, enable, disable, or sync.`);
    process.exit(1);
  } catch (err) {
    console.error(`[Skills Manager Error] ${err.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
