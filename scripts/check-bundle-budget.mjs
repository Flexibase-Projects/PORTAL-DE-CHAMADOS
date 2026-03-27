import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distAssets = join(process.cwd(), 'frontend', 'dist', 'assets');
const files = readdirSync(distAssets);

const budgets = {
  jsMaxKb: 450,
  cssMaxKb: 40,
};

let hasError = false;
for (const file of files) {
  const fullPath = join(distAssets, file);
  const stat = statSync(fullPath);
  const sizeKb = stat.size / 1024;
  if (file.endsWith('.js') && sizeKb > budgets.jsMaxKb) {
    console.error(`[bundle-budget] ${file} excedeu limite JS (${sizeKb.toFixed(2)}kb > ${budgets.jsMaxKb}kb)`);
    hasError = true;
  }
  if (file.endsWith('.css') && sizeKb > budgets.cssMaxKb) {
    console.error(`[bundle-budget] ${file} excedeu limite CSS (${sizeKb.toFixed(2)}kb > ${budgets.cssMaxKb}kb)`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log('[bundle-budget] OK');
