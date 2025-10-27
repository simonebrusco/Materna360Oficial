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

type RecShelfSeed = {
  books?: unknown[];
  toys?: unknown[];
  courses?: unknown[];
  printables?: unknown[];
};

const flattenRecShelf = (data: RecShelfSeed | unknown): unknown[] => {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const seed = data as RecShelfSeed;
  return ['books', 'toys', 'courses', 'printables']
    .flatMap((key) => {
      const items = seed[key as keyof RecShelfSeed];
      return Array.isArray(items) ? items : [];
    })
    .filter(Boolean);
};

export async function getRecShelfWithFallback(): Promise<any[]> {
  const cms = await tryGetRecShelfFromCMS();
  if (Array.isArray(cms) && cms.length) {
    return cms;
  }

  const seed = await readJsonSafe('app/cms/recShelf.seed.json');
  const flattened = flattenRecShelf(seed);
  return flattened as any[];
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

async function tryGetRecShelfFromCMS(): Promise<any[]> {
  return [];
}

async function tryGetQuickIdeasFromCMS(): Promise<any[]> {
  return [];
}
