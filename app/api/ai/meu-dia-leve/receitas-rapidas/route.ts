import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

type ReqBody = {
  slot?: string; // "manha" | "tarde" | "noite"
  focus?: string; // "rapido" | "nutritivo" | "leve"
  avoidIds?: string[];
  count?: number;

  ingredients?: string; // preferido
  query?: string;
  have?: string;
  text?: string;
};

const DEFAULT_COUNT = 3;
const HARD_LIMIT = 200;

// Matching determinístico (sem IA) — evoluir por PR, não “no improviso”
const INGREDIENT_MAP: Record<string, string[]> = {
  ovo: ["ovo", "ovos"],
  frango: ["frango", "franguinho", "peito de frango"],
  carne_moida: ["carne moida", "carne moída", "patinho moído"],
  peixe: ["peixe", "tilapia", "tilápia", "merluza"],
  atum: ["atum"],
  sardinha: ["sardinha"],
  carne_desfiada: ["carne desfiada"],
  lentilha: ["lentilha"],
  grao_de_bico: ["grao de bico", "grão-de-bico", "grão de bico"],
  feijao: ["feijao", "feijão"],
  iogurte_natural: ["iogurte natural", "iogurte"],
  queijo: ["queijo", "mussarela", "muçarela", "minas"],

  arroz: ["arroz"],
  macarrao: ["macarrao", "macarrão", "massa"],
  batata: ["batata", "batatinha"],
  batata_doce: ["batata doce", "batata-doce"],
  mandioca: ["mandioca", "aipim", "macaxeira"],
  pao: ["pao", "pão"],
  tapioca: ["tapioca"],
  cuscuz: ["cuscuz"],
  aveia: ["aveia"],
  milho: ["milho"],

  tomate: ["tomate", "tomatinho"],
  cenoura: ["cenoura"],
  abobrinha: ["abobrinha"],
  abobora: ["abobora", "abóbora"],
  brocolis: ["brocolis", "brócolis"],
  couve_flor: ["couve flor", "couve-flor"],
  espinafre: ["espinafre"],
  cebola: ["cebola"],
  alho: ["alho"],
  milho_verde: ["milho verde"],
  ervilha: ["ervilha"],
  beterraba: ["beterraba"],
  chuchu: ["chuchu"],
  pepino: ["pepino"],

  banana: ["banana", "bananinha"],
  maca: ["maca", "maçã"],
  pera: ["pera"],
  mamao: ["mamao", "mamão"],
  manga: ["manga"],
  abacate: ["abacate"],
  morango: ["morango"],
  laranja: ["laranja"],

  azeite: ["azeite"],
  manteiga: ["manteiga"],
  leite: ["leite"],
  requeijao: ["requeijao", "requeijão"],
  creme_de_leite: ["creme de leite"],
  farinha: ["farinha", "farinha de trigo", "farinha integral"],
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s,]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickIngredientTags(freeText: string): string[] {
  const t = norm(freeText);
  if (!t) return [];
  const tags: string[] = [];

  for (const [key, synonyms] of Object.entries(INGREDIENT_MAP)) {
    for (const syn of synonyms) {
      const s = norm(syn);
      if (!s) continue;
      // match simples, previsível
      if (t === s || t.includes(` ${s} `) || t.startsWith(`${s} `) || t.endsWith(` ${s}`) || t.includes(s)) {
        tags.push(`ingred_${key}`);
        break;
      }
    }
  }

  return Array.from(new Set(tags));
}

function scoreByIngredients(tagsText: string, ingredTags: string[]) {
  if (!ingredTags.length) return 0;
  let score = 0;
  for (const it of ingredTags) {
    if (tagsText.includes(it)) score += 1;
  }
  return score;
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function compactHow(stepsField: unknown, shortDescription: unknown): string {
  // steps esperado: JSON array com 2 linhas ("INGREDIENTES: ..." e "MODO: ...")
  if (typeof stepsField === "string" && stepsField.trim()) {
    try {
      const parsed = JSON.parse(stepsField);
      if (Array.isArray(parsed) && parsed.length) return parsed.join("\n");
      return stepsField;
    } catch {
      return stepsField;
    }
  }
  if (typeof shortDescription === "string" && shortDescription.trim()) return shortDescription;
  return "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ReqBody;

    const slot = (body.slot ?? "").trim(); // "manha"|"tarde"|"noite"
    const focus = (body.focus ?? "").trim(); // "rapido"|"nutritivo"|"leve"
    const avoidIds = Array.isArray(body.avoidIds) ? body.avoidIds.filter(Boolean) : [];
    const count =
      Number.isFinite(body.count) && (body.count as number) > 0
        ? Math.min(body.count as number, 6)
        : DEFAULT_COUNT;

    const rawText = (body.ingredients ?? body.query ?? body.have ?? body.text ?? "").toString();
    const ingredTags = pickIngredientTags(rawText);

    const supa = supabaseAdmin();

    let q = supa
      .from("adm_ideas")
      .select("id,title,short_description,steps,tags,status,hub,environment,duration_minutes")
      .eq("hub", "meu-dia-leve")
      .eq("status", "published")
      .ilike("id", "mdl-rr-%")
      .limit(HARD_LIMIT);

    if (focus) {
      q = q.eq("environment", focus);
      q = q.ilike("tags", `%focus_${focus}%`);
    }

    if (slot) {
      q = q.ilike("tags", `%slot_${slot}%`);
    }

    if (ingredTags.length) {
      const or = ingredTags.map((t) => `tags.ilike.%${t}%`).join(",");
      q = q.or(or);
    }

    const { data, error } = await q;

    if (error) {
      return NextResponse.json(
        { ok: false, error: "adm_query_failed", details: error.message, meta: { source: "adm" } },
        { status: 500 }
      );
    }

    const rows = Array.isArray(data) ? data : [];
    const filtered = rows.filter((r: any) => r?.id && !avoidIds.includes(r.id));
    const poolSize = filtered.length;

    let ranked = filtered.map((r: any) => ({
      ...r,
      _score: ingredTags.length ? scoreByIngredients(String(r.tags ?? ""), ingredTags) : 0,
    }));

    if (ingredTags.length) {
      ranked.sort((a: any, b: any) => b._score - a._score);

      // embaralha dentro de grupos de mesmo score
      const grouped: any[] = [];
      let i = 0;
      while (i < ranked.length) {
        const s = ranked[i]._score;
        let end = i + 1;
        while (end < ranked.length && ranked[end]._score === s) end++;
        grouped.push(...shuffle(ranked.slice(i, end)));
        i = end;
      }
      ranked = grouped;
    } else {
      ranked = shuffle(ranked);
    }

    let picked = ranked.slice(0, count);

    // Se exauriu por avoidIds, tenta 1x limpando avoidIds (padrão do produto)
    let exhausted = false;
    if (picked.length === 0 && rows.length > 0 && avoidIds.length > 0) {
      exhausted = true;

      // re-rankeia sem avoidIds
      let ranked2 = rows.map((r: any) => ({
        ...r,
        _score: ingredTags.length ? scoreByIngredients(String(r.tags ?? ""), ingredTags) : 0,
      }));

      if (ingredTags.length) {
        ranked2.sort((a: any, b: any) => b._score - a._score);

        // embaralha dentro de grupos de mesmo score (evita repetir sempre o "top 3")
        const grouped2: any[] = [];
        let i2 = 0;
        while (i2 < ranked2.length) {
          const s2 = ranked2[i2]._score;
          let end2 = i2 + 1;
          while (end2 < ranked2.length && ranked2[end2]._score === s2) end2++;
          grouped2.push(...shuffle(ranked2.slice(i2, end2)));
          i2 = end2;
        }
        ranked2 = grouped2;
      } else {
        ranked2 = shuffle(ranked2);
      }

      picked = ranked2.slice(0, count);
    }

    const items = picked.map((r: any) => ({
      id: r.id,
      title: r.title,
      how: compactHow(r.steps, r.short_description),
      slot,
      focus,
    }));

    return NextResponse.json({
      ok: true,
      items,
      meta: {
        source: "adm",
        poolSize,
        returnedCount: items.length,
        exhausted,
        ingredientTags: ingredTags,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "unexpected", details: e?.message ?? String(e), meta: { source: "adm" } },
      { status: 500 }
    );
  }
}
