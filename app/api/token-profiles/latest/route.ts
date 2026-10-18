import { NextResponse } from "next/server";
import { fetchDexScreenerLatestProfiles } from "@/lib/server/provider-adapters";
import { addAuditEvent } from "@/lib/server";

export async function GET(request: Request) {
  const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? "90");
  const result = await fetchDexScreenerLatestProfiles(Number.isFinite(rawLimit) ? rawLimit : 90);
  addAuditEvent({ category: "PROVIDER", action: "TOKEN_PROFILES_REQUESTED", outcome: result.state === "LIVE" ? "RECORDED" : "FAILED", detail: result.detail });
  return NextResponse.json({ ok: result.state === "LIVE", provider: "dexscreener", state: result.state, detail: result.detail, checkedAt: result.checkedAt, provenance: result.provenance, profiles: result.value ?? [] }, { status: result.state === "LIVE" ? 200 : 503, headers: { "cache-control": "no-store" } });
}
