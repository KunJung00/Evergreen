/**
 * Rebrand the template from "Evergreen" to a new product name.
 *
 * Usage:  pnpm rename-project "Acme"
 *
 * Replaces the product name (and its lowercase package-name form) across config,
 * i18n messages, docs and package.json. Review the diff before committing.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OLD_NAME = 'Evergreen';
const OLD_SLUG = 'evergreen';

// Directories/files to scan (relative to repo root). Locked structural files and
// specs are deliberately excluded.
const TARGETS = ['src', 'messages', 'docs', 'README.md', 'package.json'];
const IGNORE_DIRS = new Set(['node_modules', '.git', '.next']);
const EXTENSIONS = new Set(['.ts', '.tsx', '.json', '.md']);

function walk(path: string): string[] {
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  if (IGNORE_DIRS.has(path.split('/').pop() ?? '')) return [];
  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
}

function hasScannableExt(file: string): boolean {
  const dot = file.lastIndexOf('.');
  return dot !== -1 && EXTENSIONS.has(file.slice(dot));
}

function main(): void {
  const newName = process.argv[2];
  if (!newName) {
    console.error('Usage: pnpm rename-project "<NewName>"');
    process.exit(1);
  }
  const newSlug = newName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const files = TARGETS.flatMap(walk).filter(hasScannableExt);
  let changedCount = 0;

  for (const file of files) {
    const original = readFileSync(file, 'utf8');
    const updated = original.replaceAll(OLD_NAME, newName).replaceAll(OLD_SLUG, newSlug);
    if (updated !== original) {
      writeFileSync(file, updated);
      changedCount++;
      console.log(`  updated ${file}`);
    }
  }

  console.log(`\nRenamed "${OLD_NAME}" → "${newName}" in ${changedCount} file(s).`);
  console.log('Review the diff, then run: pnpm typecheck && pnpm lint && pnpm build');
}

main();
