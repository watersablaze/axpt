type Props = {
  caseId: string;
};

export default function DocumentVault({ caseId }: Props) {
  return (
    <section className="rounded-lg border border-neutral-800 p-4">
      <h2 className="mb-3 text-lg font-semibold">Document Vault</h2>
      <p className="text-sm text-neutral-400">
        Documents attached to case {caseId} will render here.
      </p>
    </section>
  );
}