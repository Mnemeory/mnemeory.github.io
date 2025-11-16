#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function readYamlOrJson(baseDir, baseName, defaultValue) {
  const candidates = [
    path.join(baseDir, `${baseName}.yml`),
    path.join(baseDir, `${baseName}.yaml`),
    path.join(baseDir, `${baseName}.json`)
  ];
  for (const filePath of candidates) {
    const txt = await readText(filePath);
    if (!txt) continue;
    try {
      if (filePath.endsWith('.json')) {
        return JSON.parse(txt);
      }
      return yaml.load(txt);
    } catch (err) {
      console.error(`Failed to parse ${path.relative(process.cwd(), filePath)}: ${err.message || err}`);
      process.exitCode = 1;
      return defaultValue;
    }
  }
  return defaultValue;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const dataDir = path.join(repoRoot, 'data');
  const outDir = path.join(repoRoot, 'assets', 'data');
  const outFile = path.join(outDir, 'ledger.json');

  const [collections, territory, vendetta, familyroster] = await Promise.all([
    readYamlOrJson(dataDir, 'collections', []),
    readYamlOrJson(dataDir, 'territory', []),
    readYamlOrJson(dataDir, 'vendetta', []),
    readYamlOrJson(dataDir, 'familyroster', null)
  ]);

  const payload = {
    collections: Array.isArray(collections) ? collections : [],
    territory: Array.isArray(territory) ? territory : [],
    vendetta: Array.isArray(vendetta) ? vendetta : [],
    familyroster: familyroster && typeof familyroster === 'object' ? familyroster : null
  };

  await ensureDir(outDir);
  await fs.writeFile(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${path.relative(repoRoot, outFile)}`);
}

main().catch(err => {
  console.error(err && err.message ? err.message : String(err));
  process.exitCode = 1;
});


