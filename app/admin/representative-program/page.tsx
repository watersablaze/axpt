import Link from "next/link";

import RepresentativeProgramLifecycle from "./RepresentativeProgramLifecycle";
import RepresentativeProgramWorkspace from "./RepresentativeProgramWorkspace";

export const dynamic = "force-dynamic";

export default function RepresentativeProgramAdminPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1480px] px-5 py-6 sm:px-7 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-gray-900 pb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600">
              French-Ward / AXPT · Operator Environment
            </p>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Authorized Representation Program
              </h1>

              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-700">
                ARP
              </span>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-5 text-gray-500">
              Governed candidate intake, qualification, Program admission,
              appointment preparation, and representative authority.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-medium text-gray-400 transition hover:border-gray-600 hover:text-gray-200"
          >
            Back to Admin
          </Link>
        </header>

        <div className="mt-4">
          <RepresentativeProgramLifecycle />
        </div>

        <RepresentativeProgramWorkspace />
      </div>
    </main>
  );
}
