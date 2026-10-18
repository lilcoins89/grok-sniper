import { NextResponse } from "next/server";
import { z } from "zod";
import { operatorAuthorized } from "@/lib/server/auth";
import { advancePaperOrder, markPaperPrice, runtimeSnapshot } from "@/lib/server/state";
import { persistOrder } from "@/lib/server/repository";

const tickSchema = z.object({
  orderId: z.string().uuid().optional(),
  mint: z.string().min(32).optional(),
  fillSol: z.number().positive().optional(),
  averagePriceUsd: z.number().positive().optional(),
  markPriceUsd: z.number().positive().optional(),
}).refine((input) => Boolean(input.orderId || input.mint), { message: "orderId or mint is required" });

export async function POST(request: Request) {
  if (!operatorAuthorized(request)) return NextResponse.json({ ok: false, error: "Operator authorization required" }, { status: 401 });
  const parsed = tickSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Malformed paper tick" }, { status: 400 });
  const input = parsed.data;

  try {
    let order = input.orderId ? runtimeSnapshot.orders.find((candidate) => candidate.id === input.orderId) : undefined;
    if (input.orderId && !order) return NextResponse.json({ ok: false, error: "Paper order not found" }, { status: 404 });
    if (order && input.fillSol !== undefined && input.averagePriceUsd !== undefined) {
      order = advancePaperOrder(order, input.fillSol, input.averagePriceUsd);
      await persistOrder(order);
    }
    if (input.markPriceUsd !== undefined && input.mint) markPaperPrice(input.mint, input.markPriceUsd);
    return NextResponse.json({ ok: true, order, paper: runtimeSnapshot.paper, snapshot: runtimeSnapshot }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paper tick failed";
    return NextResponse.json({ ok: false, error: message }, { status: 409 });
  }
}
