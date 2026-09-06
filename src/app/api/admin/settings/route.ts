import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setSetting, SETTING_KEYS } from "@/lib/settings";

const EDITABLE_KEYS = new Set(Object.values(SETTING_KEYS));

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const entries = Object.entries(body).filter(([key]) => EDITABLE_KEYS.has(key as never));

  for (const [key, value] of entries) {
    if (typeof value !== "string" && typeof value !== "number") continue;
    await setSetting(key, String(value));
  }

  return NextResponse.json({ ok: true });
}
