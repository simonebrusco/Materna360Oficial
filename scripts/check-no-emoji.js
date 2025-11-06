// Fails build on production/main if any emoji is found in UI .tsx files under app/ or components/.
// In Preview/Dev it only WARNs (exit 0). You can force strict mode anywhere by setting
// CI_STRICT_EMOJI=1. You can bypass entirely by NEXT_PUBLIC_ALLOW_EMOJI=1 (emergency).
const fs = require('fs');
const path = require('path');

const ROOTS = ['app', 'components'];
const EMOJI_REGEX = /[\p{Extended_Pictographic}]/u;

const vercelEnv = process.env.VERCEL_ENV || '';              // 'production' | 'preview' | 'development' (on Vercel)
const gitRef = process.env.VERCEL_GIT_COMMIT_REF || '';       // branch name (e.g., 'main', 'cosmos-verse')
const allowAll = process.env.NEXT_PUBLIC_ALLOW_EMOJI === '1'; // emergency bypass
const strict = process.env.CI_STRICT_EMOJI === '1'
  || vercelEnv === 'production'
  || gitRef === 'main';

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
  if (allowAll) {
    console.log('check-no-emoji: bypass enabled via NEXT_PUBLIC_ALLOW_EMOJI=1');
    return;
  }

  const hits = [];
  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;
    for (const file of walk(root)) {
      const src = fs.readFileSync(file, 'utf8');
      if (EMOJI_REGEX.test(src)) hits.push(file);
    }
  }

  if (hits.length === 0) {
    console.log('✅ No emojis in UI TSX files.');
    return;
  }

  const header = '\nEmoji found in UI files (.tsx):\n' + hits.map(f => ' - ' + f).join('\n') + '\n';

  if (strict) {
    console.error('❌ ' + header + '\nReplace them with <AppIcon/> (or <Emoji/>) before building.\n');
    process.exit(1);
  } else {
    console.warn('⚠️  ' + header + '\nPreview/Dev: this is a warning only. Build not blocked.\n');
    // Exit success on Preview/Dev so we can iterate safely.
    process.exit(0);
  }
}

main();
