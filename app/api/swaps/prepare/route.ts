import { NextResponse } from "next/server";
import { operatorAuthorized } from "@/lib/server/auth";
import { findToken } from "@/lib/server/repository";
import { prepareGuardedSwap } from "@/lib/server/signing";
import { runtimeSnapshot } from "@/lib/server/state";

export async function POST(request: Request) {
  if (!operatorAuthorized(request)) return NextResponse.json({ error: "operator authorization required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { orderId?: string } | null;
  const order = runtimeSnapshot.orders.find((item) => item.id === body?.orderId);
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  const token = await findToken(order.mint);
  if (!token) return NextResponse.json({ error: "token evidence unavailable" }, { status: 409 });
  try { return NextResponse.json({ intent: prepareGuardedSwap(order, token), signing: { liveExecutionEnabled: false, broadcasted: false } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "swap preparation blocked" }, { status: 422 }); }
}
