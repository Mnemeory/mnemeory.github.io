#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const TERRITORY_FILE = path.join(__dirname, '..', 'data', 'territory.json');
const ALLOWED = new Set(['controlled', 'uncontrolled', 'contested', 'neutral', 'expanding']);

function validate() {
  let text;
  try {
    text = fs.readFileSync(TERRITORY_FILE, 'utf8');
  } catch (err) {
    console.error('Failed to read territory.json:', err.message);
    process.exitCode = 1;
    return;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error('JSON parse error in territory.json:', err.message);
    process.exitCode = 1;
    return;
  }

  const records = Array.isArray(data) ? data : [];
  const problems = [];

  for (const entry of records) {
    if (!entry || typeof entry !== 'object') continue;
    const name = typeof entry.name === 'string' ? entry.name : '(Unnamed Territory)';
    const rawStatus = typeof entry.status === 'string' ? entry.status : '';
    const normalized = rawStatus.trim().toLowerCase();
    if (!ALLOWED.has(normalized)) {
      problems.push({ name, status: rawStatus });
    }
  }

  if (problems.length > 0) {
    console.error('Invalid or non-canonical territory statuses found:');
    for (const p of problems) {
      console.error(` - ${p.name}: "${p.status}" (expected one of: ${Array.from(ALLOWED).join(', ')})`);
    }
    process.exitCode = 1;
  } else {
    console.log('Territory statuses are valid.');
  }
}

validate();


