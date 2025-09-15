// @ts-nocheck
// scripts/png2webp.mjs
import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import sharp from "sharp";

// ====== CLI ======
// Ejemplos:
//   node scripts/png2webp.mjs --quality 82 --alpha 90 --dirs public,src/assets --keep
//   node scripts/png2webp.mjs --lossless --dirs public --force
function getArg(name, def = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : def;
}
const lossless = process.argv.includes("--lossless");
const keepPng = process.argv.includes("--keep");      // si NO lo pasas, borra los .png
const force = process.argv.includes("--force");       // sobrescribe .webp existentes
const quality = Number(getArg("--quality", lossless ? 100 : 82));
const alphaQuality = Number(getArg("--alpha", 90));
const dirs = (getArg("--dirs", "public,src/assets").split(","))
  .map(d => d.trim())
  .filter(Boolean);

const ignore = ["**/node_modules/**", "**/.next/**", "**/.git/**"];
const webpOpts = lossless
  ? { lossless: true, effort: 6 }                     // sin pérdidas
  : { quality, effort: 6, alphaQuality };            // con pérdidas (recomendado)

function toWebpPath(pngPath) {
  const { dir, name } = path.parse(pngPath);
  return path.join(dir, `${name}.webp`);
}

let converted = 0, skipped = 0, deleted = 0, failed = 0;

console.log(`🔎 Buscando PNG en: ${dirs.join(", ")}`);
// ← Línea clave corregida
const patterns = dirs.map(d =>
  path.posix.join(d.replace(/[\\/]+$/, ""), "**/*.png")
);
const files = await fg(patterns, { ignore });

if (files.length === 0) {
  console.log("No se encontraron PNG.");
  process.exit(0);
}

for (const inPath of files) {
  const outPath = toWebpPath(inPath);
  try {
    if (!force) {
  try {
    await fs.access(outPath);
    skipped++;
    // 👉 eliminar PNG aunque ya exista .webp
    if (!keepPng) {
      await fs.unlink(inPath);
      deleted++;
    }
    continue;
  } catch {}
}

    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await sharp(inPath).webp(webpOpts).toFile(outPath);
    converted++;

    if (!keepPng) {
      await fs.unlink(inPath);
      deleted++;
    }
  } catch (err) {
    failed++;
    console.error(`❌ Error con ${inPath}:`, err.message);
  }
}

console.log(`\n✅ Conversión terminada:
- Convertidos: ${converted}
- Omitidos (ya había .webp): ${skipped}
- PNG eliminados: ${deleted}
- Fallidos: ${failed}
`);
console.log(
  `Opciones: ${JSON.stringify({ lossless, quality, alphaQuality, keepPng, force })}`
);

