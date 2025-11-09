#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const AUDIO_DIR = path.resolve(__dirname, '..', 'assets', 'mobradio');
const PLAYLIST_FILE = path.resolve(AUDIO_DIR, 'playlist.json');
const SUPPORTED_EXTENSION = '.mp3';

function normalizeTitle(filename) {
  const basename = filename.replace(new RegExp(`${SUPPORTED_EXTENSION}$`, 'i'), '');
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
  return entries.filter(entry => entry.toLowerCase().endsWith(SUPPORTED_EXTENSION));
}

async function writePlaylist(tracks) {
  const payload = JSON.stringify(tracks, null, 2);
  await fs.writeFile(PLAYLIST_FILE, `${payload}\n`, 'utf8');
}

async function main() {
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

