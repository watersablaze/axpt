type Props = {
  caseId: string;
};

export default function EventStream({ caseId }: Props) {
  return (
    <section className="rounded-lg border border-neutral-800 p-4">
      <h2 className="mb-3 text-lg font-semibold">Case Event Stream</h2>
      <p className="text-sm text-neutral-400">
        Case-specific event stream for {caseId} will render here.
      </p>
    </section>
  );
}