import fs from 'node:fs/promises';
import path from 'node:path';

type Json = unknown;

async function readJsonSafe(relPath: string): Promise<Json | null> {
  try {
    const absolutePath = path.join(process.cwd(), relPath);
    const raw = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getRecShelfWithFallback(): Promise<any> {
  const cms = await tryGetRecShelfFromCMS();
  if (cms && Array.isArray(cms.books) && cms.books.length) {
    return cms;
  }

  const seed = await readJsonSafe('app/cms/recShelf.seed.json');
  if (seed && typeof seed === 'object') {
    return seed;
  }

  return { books: [], toys: [], courses: [], printables: [] };
}

export async function getQuickIdeasWithFallback(): Promise<any[]> {
  const cms = await tryGetQuickIdeasFromCMS();
  if (Array.isArray(cms) && cms.length) {
    return cms;
  }

  const seed = await readJsonSafe('app/cms/quickIdeas.seed.json');
  if (Array.isArray(seed)) {
    return seed as any[];
  }

  return [];
}

async function tryGetRecShelfFromCMS(): Promise<any> {
  return { books: [], toys: [], courses: [], printables: [] };
}

async function tryGetQuickIdeasFromCMS(): Promise<any[]> {
  return [];
}
