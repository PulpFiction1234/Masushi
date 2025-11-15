#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { access } from 'node:fs/promises';
import sharp from 'sharp';

// Generates a 32x32 PNG favicon from the source SVG to keep search engines in sync.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');
const sourceIconPath = join(publicDir, 'favicon.svg');
const targetIconPath = join(publicDir, 'favicon-32x32.png');

async function generateFavicon() {
  try {
    await access(sourceIconPath);
  } catch (error) {
    console.error(`No se encontró el archivo base en ${sourceIconPath}`);
    process.exitCode = 1;
    return;
  }

  try {
    await sharp(sourceIconPath, { density: 512 })
      .resize(32, 32, {
        fit: 'contain',
        kernel: sharp.kernel.lanczos3,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(targetIconPath);

    console.log(`Favicon 32x32 generado en ${targetIconPath}`);
  } catch (error) {
    console.error('Error al generar el favicon 32x32:', error);
    process.exitCode = 1;
  }
}

generateFavicon();
