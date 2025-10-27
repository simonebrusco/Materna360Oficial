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

type QuickIdeaSeed = {
  id?: unknown;
  title?: unknown;
  durationMin?: unknown;
  materials?: unknown;
  steps?: unknown;
  ageBuckets?: unknown;
  locales?: unknown;
  safetyNotes?: unknown;
  safety_notes?: unknown;
  tags?: unknown;
  badges?: unknown;
  summary?: unknown;
  time_total_min?: unknown;
  location?: unknown;
  age_adaptations?: unknown;
  planner_payload?: unknown;
  rationale?: unknown;
  suitableEnergies?: unknown;
};

const allowedLocations = new Set(['casa', 'parque', 'escola', 'area_externa']);
const allowedBadges = new Set(['curta', 'sem_bagunça', 'ao_ar_livre', 'motor_fino', 'motor_grosso', 'linguagem', 'sensorial']);
const allowedEnergies = new Set(['exausta', 'normal', 'animada']);

const allowedRecKinds = new Set(['book', 'toy', 'course', 'printable']);

const ensureAbsoluteUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith('/')) {
    return `https://example.com${trimmed}`;
  }
  return `https://${trimmed}`;
};

const normalizeRecProduct = (item: unknown): Record<string, unknown> | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const data = item as Record<string, unknown>;
  const id = typeof data.id === 'string' ? data.id.trim() : '';
  const kind = typeof data.kind === 'string' ? data.kind.trim() : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const imageUrl = ensureAbsoluteUrl(data.imageUrl);
  const affiliateUrl = ensureAbsoluteUrl(data.affiliateUrl);
  const retailer = typeof data.retailer === 'string' ? data.retailer.trim() : '';
  const active = typeof data.active === 'boolean' ? data.active : Boolean(data.active);
  const ageBuckets = Array.isArray(data.ageBuckets)
    ? data.ageBuckets.filter((bucket): bucket is string => typeof bucket === 'string')
    : [];

  if (!id || !allowedRecKinds.has(kind) || !title || !imageUrl || !affiliateUrl || ageBuckets.length === 0 || !retailer) {
    return null;
  }

  const subtitle = typeof data.subtitle === 'string' ? data.subtitle : undefined;
  const priceHint = typeof data.priceHint === 'string' ? data.priceHint : undefined;
  const reasons = Array.isArray(data.reasons)
    ? data.reasons.filter((reason): reason is string => typeof reason === 'string')
    : undefined;
  const safetyFlags = Array.isArray(data.safetyFlags)
    ? data.safetyFlags.filter((flag): flag is string => typeof flag === 'string')
    : undefined;
  const localeFit = Array.isArray(data.localeFit)
    ? data.localeFit.filter((locale): locale is string => typeof locale === 'string')
    : undefined;
  const sortWeight = typeof data.sortWeight === 'number' ? data.sortWeight : undefined;
  const skills = Array.isArray(data.skills)
    ? data.skills.filter((skill): skill is string => typeof skill === 'string')
    : undefined;

  return {
    id,
    kind,
    title,
    subtitle,
    imageUrl,
    ageBuckets,
    skills,
    retailer,
    affiliateUrl,
    priceHint,
    reasons,
    safetyFlags,
    localeFit,
    sortWeight,
    active,
  };
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
    .map((item) => normalizeRecProduct(item))
    .filter((value): value is NonNullable<typeof value> => value !== null);
};

const normalizeQuickIdeas = (items: unknown): unknown[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const seed = item as QuickIdeaSeed;
      const duration = typeof seed.durationMin === 'number' ? seed.durationMin : 5;
      const materials = Array.isArray(seed.materials)
        ? seed.materials.filter((value): value is string => typeof value === 'string')
        : [];
      const rawSteps = Array.isArray(seed.steps) ? seed.steps : [];
      const steps = rawSteps
        .map((step) => {
          if (typeof step === 'string') {
            return step;
          }
          if (step && typeof step === 'object' && 'title' in step && typeof (step as { title?: unknown }).title === 'string') {
            return (step as { title: string }).title;
          }
          return null;
        })
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
      const rawLocation = Array.isArray(seed.locales) && seed.locales.length > 0 ? seed.locales[0] : seed.location;
      const location = typeof rawLocation === 'string' && allowedLocations.has(rawLocation) ? rawLocation : 'casa';
      const safetyNotesArray = Array.isArray(seed.safetyNotes)
        ? seed.safetyNotes
        : Array.isArray(seed.safety_notes)
        ? seed.safety_notes
        : [];
      const safety_notes = safetyNotesArray.filter((note): note is string => typeof note === 'string');
      const rawBadges = Array.isArray(seed.badges)
        ? seed.badges
        : Array.isArray(seed.tags)
        ? seed.tags
        : [];
      const badges = rawBadges.filter(
        (badge): badge is string => typeof badge === 'string' && allowedBadges.has(badge)
      );
      const suitableEnergies = Array.isArray(seed.suitableEnergies)
        ? seed.suitableEnergies.filter(
            (energy): energy is string => typeof energy === 'string' && allowedEnergies.has(energy)
          )
        : ['normal'];
      const ageBuckets = Array.isArray(seed.ageBuckets)
        ? seed.ageBuckets.filter((bucket): bucket is string => typeof bucket === 'string')
        : [];

      const planner_payload =
        seed.planner_payload && typeof seed.planner_payload === 'object'
          ? seed.planner_payload
          : {
              type: 'idea',
              duration_min: duration,
              materials,
            };

      const summary =
        typeof seed.summary === 'string'
          ? seed.summary
          : steps.length > 0
          ? steps[0]
          : typeof seed.title === 'string'
          ? seed.title
          : '';

      const rationale = typeof seed.rationale === 'string' ? seed.rationale : summary;

      const id = seed.id;
      if (typeof id !== 'string' || id.trim().length === 0) {
        return null;
      }

      const title = typeof seed.title === 'string' ? seed.title : 'Ideia rápida';

      return {
        id,
        title,
        summary,
        time_total_min: typeof seed.time_total_min === 'number' ? seed.time_total_min : duration,
        location,
        materials,
        steps,
        age_adaptations:
          seed.age_adaptations && typeof seed.age_adaptations === 'object' ? seed.age_adaptations : {},
        safety_notes,
        badges,
        planner_payload,
        rationale,
        ageBuckets,
        suitableEnergies,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);
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
  const normalized = normalizeQuickIdeas(seed);
  return normalized as any[];
}

async function tryGetRecShelfFromCMS(): Promise<any[]> {
  return [];
}

async function tryGetQuickIdeasFromCMS(): Promise<any[]> {
  return [];
}
