import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

type Focus = "casa" | "voce" | "filho" | "comida";
type Slot = 3 | 5 | 10;

type Body = {
  focus?: Focus;
  slot?: Slot;
  avoidIds?: string[];
};

function normFocus(v: any): Focus {
  return v === "casa" || v === "voce" || v === "filho" || v === "comida" ? v : "voce";
}

function normSlot(v: any): Slot {
  const n = Number(v);
  return n === 3 || n === 5 || n === 10 ? (n as Slot) : 5;
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const focus = normFocus(body.focus);
  const slot = normSlot(body.slot);
  const avoidIds = Array.isArray(body.avoidIds) ? body.avoidIds : [];

  const supabase = supabaseAdmin();

  let q = supabase
    .from("adm_ideas")
    .select("id,title,short_description,steps,duration_minutes,age_band,environment,tags")
    .eq("hub", "meu-dia-leve")
    .in("status", ["published", "publicado"])
    .eq("environment", focus)
    .eq("duration_minutes", slot)
    .ilike("tags", "%passo_leve%")
    .ilike("tags", "%meu-dia-leve%")
    .ilike("tags", `%${focus}%`)
    .ilike("tags", `%${String(slot)}%`);

  if (avoidIds.length > 0) {
    const inList = `(${avoidIds.map((x) => `"${x}"`).join(",")})`;
    q = q.not("id", "in", inList);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json(
      { ok: false, error: `supabase:${error.message}` },
      { status: 200 }
    );
  }

  const pool = Array.isArray(data) ? data : [];
  const poolSize = pool.length;

  const picked = shuffle([...pool]).slice(0, 3);

  return NextResponse.json({
    ok: true,
    meta: {
      source: "adm",
      focus,
      slot,
      poolSize,
      returnedCount: picked.length,
      exhausted: avoidIds.length > 0 && poolSize === 0,
      avoidIdsCount: avoidIds.length
},
    items: picked,
  });
}
