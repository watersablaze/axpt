import Link from "next/link";

import RepresentativeProgramWorkspace from "./RepresentativeProgramWorkspace";

export const dynamic = "force-dynamic";

export default function RepresentativeProgramAdminPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-[1560px]">
        <div className="sticky top-0 z-30 mb-6 border-b border-gray-900 bg-black/95 pb-4 pt-3 backdrop-blur-md">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">
                French-Ward / AXPT
              </p>

              <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">
                Authorized Representation Program
              </h1>

              <p className="mt-2 max-w-4xl text-sm leading-5 text-gray-400">
                Controlled operator entry for representative candidates.
                Invitation precedes submission, qualification, Program
                admission, appointment, and delegated authority.
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded border border-gray-700 bg-black px-3 py-2 text-sm text-gray-300 hover:border-gray-500 hover:bg-gray-950"
            >
              Back to Admin
            </Link>
          </header>

          <section className="mt-4 grid gap-2 sm:grid-cols-4">
            {[
              ["01", "Invitation", "Candidate"],
              ["02", "Qualification", "French-Ward"],
              ["03", "Admission", "Registry"],
              ["04", "Appointment", "Authority"],
            ].map(([index, title, owner]) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded border border-gray-800 bg-gray-950/90 px-3 py-2.5"
              >
                <span className="font-mono text-[11px] text-gray-600">
                  {index}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-100">
                    {title}
                  </p>
                  <p className="truncate text-[11px] text-gray-600">{owner}</p>
                </div>
              </div>
            ))}
          </section>
        </div>

        <RepresentativeProgramWorkspace />
      </div>
    </main>
  );
}
