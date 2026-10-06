import type { RepresentativeAuthorityRegister } from
  "@/domains/instruments/representative-program/application/loadRepresentativeAuthorityRegister";

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export default function AuthorityRegister({
  register,
}: {
  register: RepresentativeAuthorityRegister;
}) {
  return (
    <section className="mt-6 rounded-xl border border-gray-700/50 p-5">
      <h3 className="text-base font-medium text-amber-200">Authority Register</h3>
      <p className="mt-3 text-xs leading-6 text-gray-400">
        Each authority is separately recorded. Exercisability reflects current
        appointment and Program standing checks. Every action remains subject
        to its recorded scope, conditions, and required approvals.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {register.entries.map(entry => (
          <article key={entry.key} className="rounded-lg border border-gray-700/40 p-4">
            <h4 className="text-sm font-medium text-gray-200">{entry.title}</h4>
            <p className="mt-2 text-xs capitalize text-amber-200">
              {entry.authority
                ? label(entry.authority.authorityClass)
                : "No operative authority recorded"}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              {entry.exercisable ? "Exercisable within recorded conditions" : "Not exercisable"}
              {" · "}{label(entry.reason)}
            </p>
            {entry.authority ? (
              <>
                <p className="mt-3 text-xs leading-6 text-gray-300">{entry.authority.action}</p>
                <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] leading-5 text-gray-400">
                  {JSON.stringify(entry.authority.conditions ?? {}, null, 2)}
                </pre>
              </>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
