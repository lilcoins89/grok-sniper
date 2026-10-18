import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grok Sniper — Solana execution cockpit",
  description: "Paper-first Solana market intelligence and risk-controlled execution.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
