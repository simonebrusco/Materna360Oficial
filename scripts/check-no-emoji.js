const fs = require('fs');
const path = require('path');

const ROOTS = ['app', 'components'];
const EMOJI_REGEX = /[\p{Extended_Pictographic}]/u;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && full.endsWith('.tsx')) acc.push(full);
  }
  return acc;
}

function main() {
  if (process.env.NEXT_PUBLIC_ALLOW_EMOJI === '1') {
    console.log('check-no-emoji: bypass enabled via NEXT_PUBLIC_ALLOW_EMOJI=1');
    return;
  }
  let bad = [];
  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;
    for (const file of walk(root)) {
      const src = fs.readFileSync(file, 'utf8');
      if (EMOJI_REGEX.test(src)) bad.push(file);
    }
  }
  if (bad.length) {
    console.error('\n❌ Emoji found in UI files (.tsx):\n' + bad.map(f => ' - ' + f).join('\n'));
    console.error('\nReplace them with <Emoji/> or <AppIcon/> before building.');
    process.exit(1);
  } else {
    console.log('✅ No emojis in UI TSX files.');
  }
}
main();
