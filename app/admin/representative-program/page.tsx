import Link from "next/link";

import RepresentativeInvitationForm from "./RepresentativeInvitationForm";

export const dynamic = "force-dynamic";

export default function RepresentativeProgramAdminPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-gray-400">
              French-Ward / AXPT
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Authorized Representation Program
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">
              Controlled operator entry for representative candidates.
              Invitation precedes submission, qualification, Program admission,
              appointment, and delegated authority.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900"
          >
            Back to Admin
          </Link>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-4">
          {[
            ["01", "Invitation", "Candidate"],
            ["02", "Qualification", "French-Ward"],
            ["03", "Admission", "Registry"],
            ["04", "Appointment", "Authority"],
          ].map(([index, title, owner]) => (
            <div
              key={index}
              className="rounded border border-gray-800 bg-gray-950 p-4"
            >
              <span className="font-mono text-xs text-gray-600">{index}</span>
              <p className="mt-2 text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-xs text-gray-500">{owner}</p>
            </div>
          ))}
        </section>

        <RepresentativeInvitationForm />
      </div>
    </main>
  );
}
