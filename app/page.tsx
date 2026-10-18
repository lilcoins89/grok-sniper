import { Dashboard } from "@/components/dashboard";
import { runtimeSnapshot } from "@/lib/server";

export default function Home() {
  return <Dashboard initial={runtimeSnapshot} />;
}
