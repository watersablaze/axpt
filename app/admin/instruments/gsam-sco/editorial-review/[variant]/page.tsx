import { notFound } from "next/navigation";
import GsamScoCanvas from "@/components/french-ward/gsam-sco/GsamScoCanvas";
import { getGenericProgramSco } from "@/domains/institutions/french-ward/genericProgramScoVariants";

export const dynamic = "force-dynamic";

export default async function GsamEditorialReview({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;

  if (variant !== "100-mt" && variant !== "1000-mt") {
    notFound();
  }

  const program = getGenericProgramSco(`gsam-${variant}`);

  if (!program || program.presenter !== "GROWTHCORP") {
    notFound();
  }

  return (
    <main style={{ padding: "24px", background: "#e9e5dc" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ color: "#333", marginBottom: 16 }}>
          GSAM · EDITORIAL REVIEW · NOT ISSUED
        </p>
        <GsamScoCanvas
          v={{
            quantityMt: program.quantityMt,
            reference: program.reference,
          }}
        />
      </div>
    </main>
  );
}
