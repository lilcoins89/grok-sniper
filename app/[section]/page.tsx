import { SectionView } from "@/components/section-view";
import { runtimeSnapshot } from "@/lib/server";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <SectionView section={section} snapshot={runtimeSnapshot} />;
}
