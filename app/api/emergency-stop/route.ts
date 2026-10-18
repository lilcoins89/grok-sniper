import { NextResponse } from "next/server";
import { addAuditEvent, runtimeSnapshot } from "@/lib/server";
import { operatorAuthorized } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!operatorAuthorized(request)) return NextResponse.json({ ok: false, error: "Operator authorization required" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { active?: boolean };
  const active = body.active !== false;
  runtimeSnapshot.risk = { ...runtimeSnapshot.risk, emergencyStop: active };
  addAuditEvent({ category: "SECURITY", action: active ? "EMERGENCY_STOP_ACTIVATED" : "EMERGENCY_STOP_RELEASED", outcome: active ? "BLOCKED" : "RECORDED", detail: active ? "New paper entries are blocked until manually released." : "Operator released the paper emergency stop; live execution remains disabled.", });
  return NextResponse.json({ active, mode: runtimeSnapshot.mode });
}
