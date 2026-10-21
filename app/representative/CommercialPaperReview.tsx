import type { CommercialPaper } from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/catalog";

/** Structured CUP reader. The separately maintained commercial-paper plates remain untouched. */
export default function CommercialPaperReview({paper, preview = false}: {paper: CommercialPaper; preview?: boolean}) {
  const content = paper.content;
  const sections = "orientation" in content
    ? content.sections.map(section => ({title: section.title, paragraphs: section.paragraphs as readonly string[]}))
    : content.sections.map(section => ({title: section.title, paragraphs: [section.text]}));
  return <main className="min-h-screen bg-[#f1ebdf] px-5 py-10 text-[#302d26] sm:px-10">
    <article className="mx-auto max-w-4xl">
      <p className="text-xs uppercase tracking-widest">French-Ward, Inc. · {preview ? "Operator review" : "CUP reading copy"}</p>
      <h1 className="mt-4 font-serif text-3xl sm:text-5xl">{paper.title}</h1>
      <p className="mt-4 font-mono text-xs">{paper.reference} · Edition {paper.version}</p>
      <p className="mt-3 text-sm font-medium">{paper.status}</p>
      {paper.referenceStatus ? <p className="mt-2 text-sm">Reference: {paper.referenceStatus}</p> : null}
      <p className="mt-5 border-y border-[#c9bda5] py-4 text-sm leading-6">
        {preview ? "Read-only preview. No CUP release or representative access is created. " : "Released for reading within your CUP. "}
        CUP access does not issue this paper or authorize a transaction. Presentation, transmission and download remain separately governed.
      </p>
      {"orientation" in content ? <p className="mt-7 text-lg leading-8">{content.orientation}</p> : <>
        <p className="mt-7 text-lg">{content.subtitle}</p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          {[["Product", content.product], ["Origin", content.origin], ["Purity", content.purity],
            ["Initial tranche", content.minimumInitialTranche], ["Source", content.source],
            ["Indicative pricing", content.pricing], ["Good-Faith TAP", content.tap]].map(([label, value]) =>
              <div key={label}><dt className="text-xs uppercase tracking-wide">{label}</dt><dd className="mt-1">{value}</dd></div>)}
        </dl>
      </>}
      {sections.map((section, index) => <section key={section.title} className="mt-8 border-t border-[#c9bda5] pt-5">
        <h2 className="font-serif text-2xl">{String(index + 1).padStart(2, "0")} · {section.title}</h2>
        {section.paragraphs.map((paragraph, position) => <p key={position} className="mt-4 whitespace-pre-line text-base leading-7">{paragraph}</p>)}
      </section>)}
      {"procedure" in content ? <>
        <section className="mt-8 border-t border-[#c9bda5] pt-5"><h2 className="font-serif text-2xl">Procedure</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6">{content.procedure.map(step => <li key={step}>{step}</li>)}</ol>
        </section>
        <p className="mt-7 text-base leading-7">{content.engagement}</p>
        <p className="mt-7 border-t border-[#c9bda5] pt-5 text-sm leading-6">{content.closing}</p>
      </> : null}
    </article>
  </main>;
}
