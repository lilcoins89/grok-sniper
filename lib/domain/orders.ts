import type { OrderRecord, OrderState } from "./types";

const transitions: Record<OrderState, OrderState[]> = {
  INTENT: ["RISK_REJECTED", "SUBMITTED", "CANCELLED"],
  RISK_REJECTED: [],
  SUBMITTED: ["CONFIRMED", "FAILED", "EXPIRED", "CANCELLED"],
  CONFIRMED: ["PARTIALLY_FILLED", "FILLED", "FAILED"],
  PARTIALLY_FILLED: ["PARTIALLY_FILLED", "FILLED", "FAILED"],
  FILLED: [],
  FAILED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function canTransition(from: OrderState, to: OrderState): boolean {
  return transitions[from].includes(to);
}

export function transitionOrder(order: OrderRecord, next: OrderState, patch: Partial<OrderRecord> = {}): OrderRecord {
  if (!canTransition(order.state, next)) throw new Error(`Invalid order transition ${order.state} -> ${next}`);
  return { ...order, ...patch, state: next, updatedAt: new Date().toISOString() };
}

export function makePaperOrder(input: { id: string; idempotencyKey: string; mint: string; side: "BUY" | "SELL"; requestedSol: number }): OrderRecord {
  const now = new Date().toISOString();
  return { ...input, state: "INTENT", filledSol: 0, createdAt: now, updatedAt: now, mode: "PAPER", rejectReasons: [] };
}

export function fillPaperOrder(order: OrderRecord, filledSol: number, averagePriceUsd: number): OrderRecord {
  if (filledSol <= 0 || filledSol > order.requestedSol) throw new Error("Invalid fill amount");
  const next = filledSol < order.requestedSol ? "PARTIALLY_FILLED" : "FILLED";
  return transitionOrder(order, next, { filledSol, averagePriceUsd });
}
