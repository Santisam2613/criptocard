import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function readSupportLink(table: string, column: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from(table).select(column).limit(1).maybeSingle();
  if (error) return { ok: false as const, error };
  const raw = (data as Record<string, unknown> | null)?.[column];
  const value = typeof raw === "string" && raw.trim() ? raw.trim() : null;
  return { ok: true as const, value };
}

async function readSupportLinkKeyValue(table: string, key: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(table)
    .select("value")
    .eq("key", key)
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false as const, error };
  const raw = (data as Record<string, unknown> | null)?.value;
  const value = typeof raw === "string" && raw.trim() ? raw.trim() : null;
  return { ok: true as const, value };
}

export async function GET() {
  try {
    const attempts = [
      { kind: "column", table: "config", column: "support_link" },
      { kind: "column", table: "config", column: "supportLink" },
      { kind: "kv", table: "config", key: "support_link" },
      { kind: "kv", table: "config", key: "supportLink" },
      { kind: "column", table: "confi", column: "support_link" },
      { kind: "column", table: "confi", column: "supportLink" },
      { kind: "kv", table: "confi", key: "support_link" },
      { kind: "kv", table: "confi", key: "supportLink" },
    ] as const;

    for (const a of attempts) {
      const res =
        a.kind === "column"
          ? await readSupportLink(a.table, a.column)
          : await readSupportLinkKeyValue(a.table, a.key);
      if (!res.ok) continue;
      return NextResponse.json(
        { ok: true, supportLink: res.value },
        { status: 200 },
      );
    }

    return NextResponse.json({ ok: true, supportLink: null }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error interno";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
