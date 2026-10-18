import { NextResponse } from "next/server";
import { z } from "zod";
import { loadTokenFromProviders } from "@/lib/server/provider-adapters";
import { addAuditEvent } from "@/lib/server";
import { persistToken } from "@/lib/server/repository";

const querySchema = z.string().min(32).max(64);

export async function GET(request: Request) {
  const mint = querySchema.safeParse(new URL(request.url).searchParams.get("mint"));
  if (!mint.success) return NextResponse.json({ ok: false, error: "A valid mint query parameter is required" }, { status: 400 });
  const token = await loadTokenFromProviders(mint.data);
  const persistence = await persistToken(token);
  addAuditEvent({ category: "PROVIDER", action: "TOKEN_SNAPSHOT_REQUESTED", outcome: token.dataState === "LIVE" ? "RECORDED" : "FAILED", detail: `${token.mint}: ${token.rejectionReasons.join("; ")}` });
  return NextResponse.json({ ok: true, token, persistence, note: "Eligibility remains NEEDS_REVIEW until holder-risk and authority evidence are complete." }, { headers: { "cache-control": "no-store" } });
}
