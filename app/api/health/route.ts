import { NextResponse } from "next/server";
import { runtimeSnapshot } from "@/lib/server";

export async function GET() {
  const ready = runtimeSnapshot.mode === "PAPER" && runtimeSnapshot.risk.emergencyStop;
  return NextResponse.json({ ok: true, ready, mode: runtimeSnapshot.mode, worker: runtimeSnapshot.worker, providers: runtimeSnapshot.providers.map(({ name, state, detail, checkedAt }) => ({ name, state, detail, checkedAt })) }, { status: 200 });
}
