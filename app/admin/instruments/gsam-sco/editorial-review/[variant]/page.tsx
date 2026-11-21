import { notFound } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import GsamScoCanvas from "@/components/french-ward/gsam-sco/GsamScoCanvas";
import { getGenericProgramSco } from "@/domains/institutions/french-ward/genericProgramScoVariants";

export const dynamic = "force-dynamic";
export const metadata = { title: "GSAM | Editorial PDF Review", robots: { index: false, follow: false } };

export default async function GsamEditorialReview({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const principal = await getPrincipal();
  if (!principal?.permissions?.includes("INSTITUTIONAL_ACCESS_MANAGE")) notFound();
  const { variant } = await params;
  if (variant !== "100-mt" && variant !== "1000-mt") notFound();
  const program = getGenericProgramSco(`gsam-${variant}`);
  if (!program || program.presenter !== "GROWTHCORP") notFound();

  return (
    <main className="gsam-editorial-page" style={{ padding: "24px", background: "#e9e5dc" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="gsam-editorial-toolbar">
          <span>GSAM · EDITORIAL REVIEW · NOT ISSUED</span>
          <a className="gsam-pdf-action" href={`/api/admin/instruments/gsam-sco-pdf/${variant}`} target="_blank" rel="noopener noreferrer">Download PDF</a>
        </div>
        <GsamScoCanvas v={{ quantityMt: program.quantityMt, reference: program.reference }} />
      </div>
      <style>{`
        .gsam-editorial-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; color: #333; font: 14px Arial, sans-serif; }
        .gsam-pdf-action { display: inline-block; padding: 10px 16px; background: #25324b; color: white; text-decoration: none; border-radius: 4px; font-weight: 700; }
        @media print { .gsam-editorial-toolbar { display: none !important; } .gsam-editorial-page { padding: 0 !important; background: white !important; } .gsam-editorial-page > div { max-width: none !important; } }
      `}</style>
    </main>
  );
}
