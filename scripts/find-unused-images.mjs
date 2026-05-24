import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

function getAllImages(dir, base = dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...getAllImages(full, base));
    } else {
      const ext = extname(entry).toLowerCase();
      if (['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(ext)) {
        results.push({ full, rel: relative(base, full).replace(/\\/g, '/') });
      }
    }
  }
  return results;
}

function getAllSrc(dir) {
  const results = [];
  const skip = new Set(['node_modules', '.next', 'android', 'dist', '.git']);
  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...getAllSrc(full));
    } else {
      const ext = extname(entry).toLowerCase();
      if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'].includes(ext)) {
        results.push(full);
      }
    }
  }
  return results;
}

const imgDir = 'public/images';
const images = getAllImages(imgDir);
const srcFiles = getAllSrc('.');

let srcBlob = '';
for (const f of srcFiles) {
  try { srcBlob += readFileSync(f, 'utf8') + '\n'; } catch {}
}

const unused = [];
const used = [];
for (const img of images) {
  const filename = img.rel.split('/').pop();
  const found = srcBlob.includes(filename) || srcBlob.includes(img.rel);
  if (found) {
    used.push(img.rel);
  } else {
    unused.push(img.rel);
  }
}

console.log('=== UNUSED IMAGES (' + unused.length + ') ===');
unused.forEach(u => console.log(' ', u));
console.log('');
console.log('Total:', images.length, '| Used:', used.length, '| Unused:', unused.length);
