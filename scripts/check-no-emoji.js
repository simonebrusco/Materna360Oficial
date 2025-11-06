/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// ----- Config -----
const ROOTS = ['app', 'components'];        // onde procurar
const EXTS  = new Set(['.tsx']);            // só arquivos UI TSX
// Emoji (pictográficos). Requer flag /u.
const EMOJI_REGEX = /[\p{Extended_Pictographic}]/u;

// ----- Env / Modo de operação -----
const env = process.env;
const vercelEnv = env.VERCEL_ENV || '';               // 'production' | 'preview' | 'development'
const gitRef    = env.VERCEL_GIT_COMMIT_REF || '';    // ex.: 'main', 'cosmos-verse'

// Bypass de emergência (não recomendado): ignora a checagem completamente
const allowAll = env.NEXT_PUBLIC_ALLOW_EMOJI === '1';

// Override explícito:
//  - STRICT_EMOJI='1' força modo estrito (falha build)
//  - STRICT_EMOJI='0' força modo não-estrito (apenas warn)
//  - não definido => estrito se production OU branch main
const strict =
  env.STRICT_EMOJI === '1' ? true :
  env.STRICT_EMOJI === '0' ? false :
  (vercelEnv === 'production' || gitRef === 'main');

// ----- Util -----
function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (entry.isFile() && EXTS.has(path.extname(full))) {
      acc.push(full);
    }
  }
  return acc;
}

// ----- Main -----
function main() {
  if (allowAll) {
    console.log('check-no-emoji: bypass habilitado via NEXT_PUBLIC_ALLOW_EMOJI=1');
    return;
  }

  const hits = [];
  for (const root of ROOTS) {
    for (const file of walk(root)) {
      const src = fs.readFileSync(file, 'utf8');
      if (EMOJI_REGEX.test(src)) hits.push(file);
    }
  }

  if (hits.length === 0) {
    console.log('✅ No emojis in UI TSX files.');
    return;
  }

  const list = hits.map(f => ` - ${f}`).join('\n');
  const header = `\nEmoji found in UI files (.tsx):\n${list}\n`;

  if (strict) {
    console.error(`❌ ${header}\nReplace them with <AppIcon/> (or <Emoji/>) before building.\n`);
    process.exit(1);
  } else {
    console.warn(`⚠️  ${header}\nPreview/Dev: this is a warning only. Build not blocked.\n`);
    process.exit(0);
  }
}

main();
