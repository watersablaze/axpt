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
  const recorded = register.entries.filter(entry => entry.authority).length;
  const exercisable = register.entries.filter(entry => entry.exercisable).length;

  return (
    <section
      aria-labelledby="operative-authority-heading"
      className="border-y border-[#36505b]/70 px-1 py-7 text-[#dce6e9]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9db5bf]">
        Authority · Canonical Register
      </p>
      <h3
        id="operative-authority-heading"
        className="mt-3 text-xl font-medium tracking-tight"
      >
        {exercisable > 0
          ? `${exercisable} ${exercisable === 1 ? "authority" : "authorities"} exercisable`
          : recorded > 0
            ? "None currently exercisable"
            : "None recorded"}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#b2c3cb]">
        {exercisable > 0
          ? "Exercise remains subject to recorded scope, conditions, and required approvals for the intended activity."
          : "No authority is presently exercisable under this appointment."}
      </p>
      <p className="mt-4 font-mono text-[11px] leading-6 text-[#9db5bf]">
        {register.entries.length} categories examined · {recorded} current records · {exercisable} exercisable
      </p>

      <details className="group mt-5">
        <summary className="w-fit cursor-pointer py-2 text-xs font-medium text-[#d7b981] underline decoration-[#d7b981]/40 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7b981]">
          View Authority Register
        </summary>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Current authority records and exercisability under this appointment
            </caption>
            <thead className="border-b border-[#36505b] text-[10px] uppercase tracking-[0.14em] text-[#9db5bf]">
              <tr>
                <th scope="col" className="py-3 pr-5 font-medium">Authority</th>
                <th scope="col" className="py-3 font-medium">Current state</th>
              </tr>
            </thead>
            <tbody>
              {register.entries.map(entry => (
                <tr key={entry.key} className="border-b border-[#36505b]/40 align-top">
                  <th scope="row" className="py-4 pr-5 font-normal">
                    <span className={entry.exercisable ? "font-medium text-[#e7eef0]" : "text-[#b2c3cb]"}>
                      {entry.title}
                    </span>
                  </th>
                  <td className="py-4 text-xs leading-6">
                    {entry.authority ? (
                      <>
                        <p className={entry.exercisable ? "font-medium text-[#c1ddd3]" : "text-[#b2c3cb]"}>
                          {entry.exercisable ? "Exercisable within conditions" : "Not exercisable"}
                        </p>
                        <p className="capitalize text-[#9db5bf]">
                          {label(entry.authority.authorityClass)}
                        </p>
                        <details className="mt-2">
                          <summary className="w-fit cursor-pointer text-[#d7b981] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d7b981]">
                            Inspect record
                          </summary>
                          <div className="mt-3 max-w-xl space-y-3">
                            <p className="text-[#c5d2d8]">{entry.authority.action}</p>
                            <p className="text-[#9db5bf]">
                              Evaluation: {label(entry.reason)}
                            </p>
                            <p className="break-all font-mono text-[10px] text-[#9db5bf]">
                              {entry.authority.id}
                            </p>
                            <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-[#b2c3cb]">
                              {JSON.stringify(entry.authority.conditions ?? {}, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </>
                    ) : (
                      <span aria-label="No current authority recorded" className="text-[#9db5bf]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-6 text-[#9db5bf]">
          — No current authority recorded. This register shows the current
          evaluation; historical records remain preserved separately.
          Appointment and resource access do not grant authority.
        </p>
      </details>
    </section>
  );
}
