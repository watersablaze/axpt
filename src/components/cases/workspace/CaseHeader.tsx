// src/components/cases/workspace/CaseHeader.tsx
import { CaseData } from "@/shared/types/case";

type Props = {
  caseData: CaseData;
};

export default function CaseHeader({ caseData }: Props) {
  return (
    <section className="mb-6 border-b border-neutral-800 pb-4">
      <h1 className="text-2xl font-bold">{caseData.title}</h1>

      <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-400">
        <span>
          <strong className="text-white/80">Status:</strong> {caseData.status}
        </span>

        {caseData.jurisdiction && (
          <span>
            <strong className="text-white/80">Jurisdiction:</strong>{" "}
            {caseData.jurisdiction}
          </span>
        )}

        <span>
          <strong className="text-white/80">Case ID:</strong> {caseData.id}
        </span>
      </div>
    </section>
  );
}