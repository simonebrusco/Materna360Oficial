/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const uiDirs = ['app', 'components'];
const exts = new Set(['.tsx']);
const strict = process.env.STRICT_EMOJI === '1'; // strict only if explicitly set

const emojiRegex =
  /[\u{1F300}-\u{1FAD6}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

const matches = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (exts.has(path.extname(p))) {
      const txt = fs.readFileSync(p, 'utf8');
      if (emojiRegex.test(txt)) matches.push(p);
    }
  }
}

for (const d of uiDirs) if (fs.existsSync(d)) walk(d);

if (matches.length) {
  const header = strict ? '❌' : '⚠️';
  console.log(`${header}\nEmoji found in UI files (.tsx):`);
  for (const m of matches) console.log(` - ${m}`);
  console.log(
    '\nReplace them with <AppIcon/> (or <Emoji/>) before building.'
  );
  if (strict) process.exit(1);
} else {
  console.log('✅ No emoji found in UI .tsx files');
}
