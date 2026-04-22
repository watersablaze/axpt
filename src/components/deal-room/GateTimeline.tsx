type Props = {
  caseId: string;
};

export default function GateTimeline({ caseId }: Props) {
  return (
    <section className="rounded-lg border border-neutral-800 p-4">
      <h2 className="mb-3 text-lg font-semibold">Gate Timeline</h2>
      <p className="text-sm text-neutral-400">
        Gate timeline for case {caseId} will render here.
      </p>
    </section>
  );
}