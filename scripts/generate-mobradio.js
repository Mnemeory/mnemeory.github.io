#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const AUDIO_DIR = path.resolve(__dirname, '..', 'assets', 'mobradio');
let PLAYLIST_FILE = path.resolve(AUDIO_DIR, 'playlist.json');
let SUPPORTED_EXTENSIONS = ['.mp3'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token) continue;
    if (token.startsWith('--')) {
      const [keyRaw, maybeValue] = token.split('=', 2);
      const key = keyRaw.replace(/^--/, '');
      if (maybeValue !== undefined) {
        args[key] = maybeValue;
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          args[key] = next;
          i += 1;
        } else {
          args[key] = true;
        }
      }
    }
  }
  return args;
}

function applyCliOptions() {
  const args = parseArgs(process.argv.slice(2));

  if (args.ext) {
    const parts = String(args.ext).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (parts.length > 0) {
      SUPPORTED_EXTENSIONS = parts.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
    }
  }

  if (args.output) {
    const outPath = path.resolve(process.cwd(), args.output);
    PLAYLIST_FILE = outPath;
  }
}

function normalizeTitle(filename) {
  let basename = filename;
  for (const ext of SUPPORTED_EXTENSIONS) {
    const re = new RegExp(`${ext.replace('.', '\\.')}$`, 'i');
    if (re.test(basename)) {
      basename = basename.replace(re, '');
      break;
    }
  }
  let title = basename.trim();

  title = title.replace(/ _([^_]+)_/g, ' ($1)');
  title = title.replace(/_ /g, ' ');
  title = title.replace(/ _/g, ' ');
  title = title.replace(/_/g, "'");

  title = title.replace(/\s+/g, ' ').trim();
  return title;
}

function toTrackRecord(filename) {
  return {
    file: `assets/mobradio/${filename}`,
    title: normalizeTitle(filename)
  };
}

async function ensureAudioDirectory() {
  try {
    const stats = await fs.stat(AUDIO_DIR);
    if (!stats.isDirectory()) {
      throw new Error(`${AUDIO_DIR} is not a directory`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Audio directory not found: ${AUDIO_DIR}`);
    }
    throw error;
  }
}

async function getTrackFiles() {
  const entries = await fs.readdir(AUDIO_DIR);
  return entries.filter(entry => {
    const lower = entry.toLowerCase();
    return SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext));
  });
}

async function writePlaylist(tracks) {
  const payload = JSON.stringify(tracks, null, 2);
  await fs.writeFile(PLAYLIST_FILE, `${payload}\n`, 'utf8');
}

async function main() {
  applyCliOptions();
  await ensureAudioDirectory();
  const files = await getTrackFiles();

  if (files.length === 0) {
    console.warn('No audio tracks were found; writing an empty playlist.');
  }

  const tracks = files.map(toTrackRecord).sort((a, b) => {
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });

  await writePlaylist(tracks);

  console.log(`Mob Radio playlist generated with ${tracks.length} track(s).`);
  console.log(` -> ${path.relative(process.cwd(), PLAYLIST_FILE)}`);
}

main().catch(error => {
  console.error('Mob Radio playlist generation failed.');
  console.error(error);
  process.exitCode = 1;
});

