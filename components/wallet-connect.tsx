"use client";

import { useEffect, useState } from "react";
import { WalletCards, X } from "lucide-react";

type SolanaProvider = { isPhantom?: boolean; publicKey?: { toString(): string }; connect(): Promise<{ publicKey: { toString(): string } }>; disconnect?(): Promise<void> };

declare global { interface Window { solana?: SolanaProvider } }

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Public-key connection only; signing stays disabled.");

  useEffect(() => { setAddress(window.solana?.publicKey?.toString() ?? null); }, []);

  async function connect() {
    setBusy(true);
    try {
      if (!window.solana) { setMessage("No compatible Solana wallet detected in this browser."); return; }
      const result = await window.solana.connect();
      setAddress(result.publicKey.toString());
      setMessage("Wallet connected. No private key or transaction signature was requested.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Wallet connection was cancelled."); }
    finally { setBusy(false); }
  }

  async function disconnect() {
    await window.solana?.disconnect?.();
    setAddress(null);
    setMessage("Wallet disconnected.");
  }

  return <div className="wallet-connect panel"><div className="panel-head"><div><div className="eyebrow">NON-CUSTODIAL WALLET</div><h3>Operator connection</h3></div><WalletCards size={18} className="teal-icon" /></div><p>{message}</p>{address ? <div className="wallet-address"><span>{address.slice(0, 6)}…{address.slice(-6)}</span><button className="icon-button" onClick={disconnect} aria-label="Disconnect wallet"><X size={15} /></button></div> : <button className="primary-button" onClick={connect} disabled={busy}><WalletCards size={15} />{busy ? "Connecting…" : "Connect wallet"}</button>}<small>Wallet connection is for public identity and future operator approvals. Server-side signing remains locked.</small></div>;
}
