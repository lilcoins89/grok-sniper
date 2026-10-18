import type { OrderRecord, TokenRecord } from "@/lib/domain/types";

export type UnsignedSwapIntent = {
  orderId: string;
  mint: string;
  side: OrderRecord["side"];
  amountSol: number;
  tokenEvidence: string[];
  expiresAt: string;
  requiresOperatorApproval: true;
  liveExecutionEnabled: false;
};

export function prepareGuardedSwap(order: OrderRecord, token: TokenRecord): UnsignedSwapIntent {
  if (order.mode !== "PAPER") throw new Error("Only paper orders may be prepared in the current deployment");
  if (token.eligibility !== "ELIGIBLE") throw new Error("Swap preparation requires an eligible token snapshot");
  if (token.dataState !== "LIVE") throw new Error("Swap preparation requires fresh live provider evidence");
  return { orderId: order.id, mint: order.mint, side: order.side, amountSol: order.requestedSol, tokenEvidence: token.provenance, expiresAt: new Date(Date.now() + 60_000).toISOString(), requiresOperatorApproval: true, liveExecutionEnabled: false };
}

export function signingStatus() {
  return { provider: process.env.SIGNER_PROVIDER ?? "disabled", liveExecutionEnabled: false, acceptsPrivateKeys: false, requiresWalletApproval: true, reason: "No server-side private key boundary is attached; live signing is disabled." } as const;
}
