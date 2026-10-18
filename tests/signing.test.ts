import { describe, expect, it } from "vitest";
import { prepareGuardedSwap, signingStatus } from "@/lib/server/signing";
import type { OrderRecord, TokenRecord } from "@/lib/domain/types";

const order: OrderRecord = { id: "order-1", idempotencyKey: "key-1", mint: "So11111111111111111111111111111111111111112", side: "BUY", state: "INTENT", requestedSol: 0.01, filledSol: 0, mode: "PAPER", rejectReasons: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
const token: TokenRecord = { mint: order.mint, symbol: "SOL", name: "Solana", venue: "UNKNOWN", discoveredAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString(), dataState: "LIVE", provenance: ["helius"], eligibility: "ELIGIBLE", rejectionReasons: [] };

describe("signing boundary", () => {
  it("returns an expiring unsigned intent and never enables live execution", () => {
    const intent = prepareGuardedSwap(order, token);
    expect(intent.requiresOperatorApproval).toBe(true);
    expect(intent.liveExecutionEnabled).toBe(false);
    expect(intent.expiresAt).toBeTruthy();
  });

  it("reports a disabled, non-custodial signer posture", () => {
    expect(signingStatus()).toMatchObject({ liveExecutionEnabled: false, acceptsPrivateKeys: false, requiresWalletApproval: true });
  });

  it("blocks stale evidence", () => {
    expect(() => prepareGuardedSwap(order, { ...token, dataState: "STALE" })).toThrow(/fresh live provider evidence/);
  });
});
