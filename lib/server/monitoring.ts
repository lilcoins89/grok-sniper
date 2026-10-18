export type TransactionState = "NOT_SUBMITTED" | "PENDING" | "CONFIRMED" | "FAILED" | "UNKNOWN";

export type TransactionObservation = { signature?: string; state: TransactionState; slot?: number; error?: string; observedAt: string; source: "SOLANA_RPC" | "UNAVAILABLE" };

export async function observeTransaction(signature?: string): Promise<TransactionObservation> {
  if (!signature) return { state: "NOT_SUBMITTED", observedAt: new Date().toISOString(), source: "UNAVAILABLE" };
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) return { signature, state: "UNKNOWN", error: "SOLANA_RPC_URL is not configured", observedAt: new Date().toISOString(), source: "UNAVAILABLE" };
  return { signature, state: "UNKNOWN", error: "RPC confirmation adapter is intentionally not enabled until commitment and retry policy are configured", observedAt: new Date().toISOString(), source: "SOLANA_RPC" };
}
