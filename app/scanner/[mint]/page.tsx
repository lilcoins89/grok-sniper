import { TokenAutopsy } from "@/components/token-autopsy";
import { runtimeSnapshot } from "@/lib/server";

export default async function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const token = runtimeSnapshot.tokens.find((item) => item.mint === mint);
  return <TokenAutopsy mint={mint} token={token} />;
}
