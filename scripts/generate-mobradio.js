#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

// Minimal: scan assets/mobradio for .mp3 files and write playlist.json
const AUDIO_DIR = path.resolve(__dirname, '..', 'assets', 'mobradio');
const PLAYLIST_FILE = path.resolve(AUDIO_DIR, 'playlist.json');

function makeTitle(filename) {
  // Strip extension, replace underscores/hyphens with spaces, collapse spaces
  const withoutExt = filename.replace(/\.[^.]+$/i, '');
  return withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  const stats = await fs.stat(AUDIO_DIR).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`Audio directory not found: ${AUDIO_DIR}`);
  }

  const entries = await fs.readdir(AUDIO_DIR);
  const tracks = entries
    .filter(name => /\.mp3$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(name => ({
      file: `assets/mobradio/${name}`,
      title: makeTitle(name)
    }));

  const payload = JSON.stringify(tracks, null, 2);
  await fs.writeFile(PLAYLIST_FILE, `${payload}\n`, 'utf8');
  console.log(`Wrote ${tracks.length} track(s) to ${path.relative(process.cwd(), PLAYLIST_FILE)}`);
}

main().catch(err => {
  console.error(err.message || String(err));
  process.exitCode = 1;
});
