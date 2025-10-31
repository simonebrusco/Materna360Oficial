import fs from 'fs';

function fixFile(path) {
  let src = fs.readFileSync(path, 'utf8');

  // Scanner simples com rastreio de profundidade de chaves e strings/comentários
  let out = '';
  let i = 0;
  const n = src.length;
  const seenPayloadAtDepth = [];
  let depth = 0;
  let inStr = null; // '"' | "'" | '`'
  let inLineComment = false;
  let inBlockComment = false;

  function peek(k=0){ return src[i+k]; }

  while (i < n) {
    const ch = src[i];
    const ch2 = src[i] + src[i+1];

    // comentários
    if (!inStr) {
      if (!inBlockComment && ch2 === '/*') { inBlockComment = true; out += ch2; i+=2; continue; }
      if (inBlockComment)  { out += ch; if (ch2 === '*/') { out += src[i+1]; i+=2; inBlockComment=false; } else { i++; } continue; }
      if (!inLineComment && ch2 === '//') { inLineComment = true; out += ch2; i+=2; continue; }
      if (inLineComment)   { out += ch; if (ch === '\n') { inLineComment=false; } i++; continue; }
    }

    // strings
    if (!inStr && (ch === '"' || ch === "'" || ch === '`')) { inStr = ch; out += ch; i++; continue; }
    if (inStr) {
      out += ch;
      if (ch === '\\') { if (i+1 < n) { out += src[i+1]; i+=2; continue; } }
      if (ch === inStr) inStr = null;
      i++;
      continue;
    }

    // controle de profundidade por chaves
    if (ch === '{') { depth++; seenPayloadAtDepth[depth] = seenPayloadAtDepth[depth] || new Set(); out += ch; i++; continue; }
    if (ch === '}') { seenPayloadAtDepth[depth] = new Set(); depth = Math.max(0, depth-1); out += ch; i++; continue; }

    // tentativa de capturar "payload:" seguido de "{" no mesmo nível
    if (/[a-zA-Z_\$]/.test(ch)) {
      // capturar possível identificador
      let j = i;
      while (j < n && /[a-zA-Z0-9_\$]/.test(src[j])) j++;
      const ident = src.slice(i, j);
      // pular espaços
      let k = j;
      while (k < n && /\s/.test(src[k])) k++;
      if (ident === 'payload' && src[k] === ':') {
        // depois de ":" pular espaços
        let k2 = k + 1;
        while (k2 < n && /\s/.test(src[k2])) k2++;
        if (src[k2] === '{') {
          const seen = seenPayloadAtDepth[depth] || new Set();
          if (seen.has('payload')) {
            // duplicata: vamos remover ESSE bloco "payload: { ... }" e a vírgula seguinte (se houver)
            // precisamos encontrar o '}' de fechamento equilibrando chaves
            let brace = 0;
            let p = k2;
            let inS = null, inLC = false, inBC = false;
            while (p < n) {
              const c = src[p], c2 = src[p] + src[p+1];
              if (!inS) {
                if (!inBC && c2 === '/*') { inBC = true; p+=2; continue; }
                if (inBC) { if (c2 === '*/') { inBC=false; p+=2; continue; } p++; continue; }
                if (!inLC && c2 === '//') { inLC = true; p+=2; continue; }
                if (inLC) { if (c === '\n') inLC=false; p++; continue; }
                if (c === '"' || c === "'" || c === '`') { inS = c; p++; continue; }
              } else {
                if (c === '\\') { p+=2; continue; }
                if (c === inS) inS = null;
                p++; continue;
              }
              if (c === '{') { brace++; }
              if (c === '}') { brace--; if (brace === 0) { p++; break; } }
              p++;
            }
            // pula espaços e uma vírgula opcional após o bloco
            while (p < n && /\s/.test(src[p])) p++;
            if (src[p] === ',') p++;

            // descartamos o trecho i..p e NÃO copiamos para out
            i = p;
            continue;
          } else {
            // primeira ocorrência de payload neste nível
            seen.add('payload');
            seenPayloadAtDepth[depth] = seen;
          }
        }
      }
      // não era duplicata: copia identificador normalmente
      out += src.slice(i, j);
      i = j;
      continue;
    }

    // default: copia char
    out += ch;
    i++;
  }

  if (out !== src) {
    fs.writeFileSync(path, out);
    console.log('[fix] duplicate payloads cleaned in', path);
  } else {
    console.log('[ok] no duplicate payloads found in', path);
  }
}

// arquivos alvo
['components/blocks/HealthyRecipes.tsx','components/features/Receitinhas/ReceitinhasCard.tsx'].forEach(p=>{
  try { if (fs.existsSync(p)) fixFile(p); } catch(e){ console.error('error fixing', p, e); }
});
