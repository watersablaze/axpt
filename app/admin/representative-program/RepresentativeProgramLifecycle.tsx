type Stage = {
  index: string;
  title: string;
  owner: string;
};

const STAGES: Stage[] = [
  {
    index: "01",
    title: "Invitation",
    owner: "Candidate",
  },
  {
    index: "02",
    title: "Qualification",
    owner: "French-Ward",
  },
  {
    index: "03",
    title: "Admission",
    owner: "Registry",
  },
  {
    index: "04",
    title: "Appointment Instrument",
    owner: "Preparation",
  },
];

export default function RepresentativeProgramLifecycle() {
  return (
    <nav
      aria-label="Authorized Representation Program lifecycle"
      className="overflow-x-auto border-y border-gray-900"
    >
      <ol className="flex min-w-[760px]">
        {STAGES.map((stage, index) => (
          <li
            key={stage.index}
            className={[
              "relative flex min-w-0 flex-1 items-center gap-3 px-3 py-3",
              index > 0 ? "border-l border-gray-900" : "",
            ].join(" ")}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-800 bg-gray-950 font-mono text-[10px] text-gray-600">
              {stage.index}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-gray-500">
                {stage.title}
              </span>

              <span className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.12em] text-gray-700">
                {stage.owner}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
