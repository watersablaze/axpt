import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic =
  "force-dynamic";

type PreviewState =
  | "review"
  | "accepted"
  | "active";

type StageState =
  | "complete"
  | "current"
  | "future";

function resolveState(
  value:
    | string
    | string[]
    | undefined,
): PreviewState {
  const candidate =
    Array.isArray(value)
      ? value[0]
      : value;

  if (
    candidate === "accepted" ||
    candidate === "active"
  ) {
    return candidate;
  }

  return "review";
}

function FieldStateStrip({
  state,
}: {
  state: PreviewState;
}) {
  const stages: Array<{
    label: string;
    detail: string;
    state: StageState;
  }> =
    state === "review"
      ? [
          {
            label: "Agreement",
            detail: "Executed",
            state: "complete",
          },
          {
            label: "Appointment",
            detail: "Review",
            state: "current",
          },
          {
            label: "Activation",
            detail: "Pending",
            state: "future",
          },
          {
            label: "Authority",
            detail: "None",
            state: "future",
          },
          {
            label: "Materials",
            detail: "Pre-activation",
            state: "future",
          },
        ]
      : state === "accepted"
        ? [
            {
              label: "Agreement",
              detail: "Executed",
              state: "complete",
            },
            {
              label: "Appointment",
              detail: "Accepted",
              state: "complete",
            },
            {
              label: "Activation",
              detail: "Awaiting action",
              state: "current",
            },
            {
              label: "Authority",
              detail: "None",
              state: "future",
            },
            {
              label: "Materials",
              detail: "Pre-activation",
              state: "future",
            },
          ]
        : [
            {
              label: "Agreement",
              detail: "Executed",
              state: "complete",
            },
            {
              label: "Appointment",
              detail: "Active",
              state: "complete",
            },
            {
              label: "Activation",
              detail: "Complete",
              state: "complete",
            },
            {
              label: "Authority",
              detail: "Separate record",
              state: "current",
            },
            {
              label: "Materials",
              detail: "Release governed",
              state: "current",
            },
          ];

  const progress =
    state === "review"
      ? "30%"
      : state === "accepted"
        ? "52%"
        : "80%";

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-[18px]
        border
        border-white/[0.05]
        bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_100%)]
        px-5
        py-5
        shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          left-[5%]
          right-[5%]
          top-[31px]
          hidden
          h-px
          bg-white/[0.055]
          md:block
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          left-[5%]
          top-[31px]
          hidden
          h-px
          bg-gradient-to-r
          from-[#71845e]
          via-[#b08e51]
          to-[#c3a15f]
          opacity-65
          shadow-[0_0_14px_rgba(191,157,88,0.18)]
          transition-[width]
          duration-700
          ease-out
          md:block
        "
        style={{
          width:
            progress,
        }}
      />

      <div
        className="
          relative
          grid
          gap-4
          sm:grid-cols-2
          md:grid-cols-5
          md:gap-3
        "
      >
        {stages.map(
          (
            stage,
            index,
          ) => (
            <div
              key={
                stage.label
              }
              className="
                relative
                min-w-0
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                  md:block
                "
              >
                <div
                  className={`
                    relative
                    z-10
                    flex
                    h-5
                    w-5
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    transition-all
                    duration-500
                    md:mx-auto
                    ${
                      stage.state ===
                      "complete"
                        ? "border-[#7f9468]/75 bg-[#172116] shadow-[0_0_14px_rgba(122,150,96,0.12)]"
                        : stage.state ===
                            "current"
                          ? "border-[#c5a25f]/90 bg-[#2b2114] shadow-[0_0_20px_rgba(197,162,95,0.22)]"
                          : "border-white/[0.09] bg-[#0a1217]"
                    }
                  `}
                >
                  {stage.state ===
                    "current" && (
                    <span
                      className="
                        absolute
                        -inset-1.5
                        rounded-full
                        border
                        border-[#c5a25f]/15
                        shadow-[0_0_18px_rgba(197,162,95,0.08)]
                      "
                    />
                  )}

                  <span
                    className={`
                      h-1.5
                      w-1.5
                      rounded-full
                      ${
                        stage.state ===
                        "complete"
                          ? "bg-[#9bad82]"
                          : stage.state ===
                              "current"
                            ? "bg-[#d7b269]"
                            : "bg-white/[0.13]"
                      }
                    `}
                  />
                </div>

                <div
                  className="
                    min-w-0
                    md:mt-3
                    md:text-center
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      md:justify-center
                    "
                  >
                    <p
                      className={`
                        truncate
                        text-[8px]
                        font-semibold
                        uppercase
                        tracking-[0.15em]
                        ${
                          stage.state ===
                          "future"
                            ? "text-white/22"
                            : "text-white/50"
                        }
                      `}
                    >
                      {stage.label}
                    </p>

                    {stage.state ===
                      "current" && (
                      <span
                        className="
                          hidden
                          rounded-full
                          bg-[#c3a15f]/10
                          px-1.5
                          py-0.5
                          text-[6px]
                          font-semibold
                          uppercase
                          tracking-[0.1em]
                          text-[#caaa67]
                          xl:inline
                        "
                      >
                        Current
                      </span>
                    )}
                  </div>

                  <p
                    className={`
                      mt-1
                      truncate
                      text-[9px]
                      ${
                        stage.state ===
                        "complete"
                          ? "text-[#91a27b]"
                          : stage.state ===
                              "current"
                            ? "text-[#d0af6b]"
                            : "text-white/19"
                      }
                    `}
                  >
                    {stage.detail}
                  </p>
                </div>
              </div>

              {index <
                stages.length -
                  1 && (
                <div
                  className="
                    ml-2.5
                    mt-2
                    h-5
                    w-px
                    bg-white/[0.05]
                    md:hidden
                  "
                />
              )}
            </div>
          ),
        )}
      </div>

      <div
        className="
          mt-5
          flex
          flex-col
          gap-3
          border-t
          border-white/[0.045]
          pt-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-[#c5a25f]
              shadow-[0_0_12px_rgba(197,162,95,0.45)]
            "
          />

          <p
            className="
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.14em]
              text-white/30
            "
          >
            Current position
          </p>

          <p
            className="
              text-[9px]
              font-medium
              text-[#c4a565]
            "
          >
            {state ===
            "review"
              ? "Appointment Review"
              : state ===
                  "accepted"
                ? "Internal Activation"
                : "Active Representation"}
          </p>
        </div>

        <p
          className="
            text-[7px]
            uppercase
            tracking-[0.13em]
            text-white/18
          "
        >
          State projected from canonical Program record
        </p>
      </div>
    </div>
  );
}

function ContextRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?:
    | "neutral"
    | "gold"
    | "green";
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-white/[0.05] py-4 last:border-b-0">
      <p className="text-[9px] uppercase tracking-[0.16em] text-white/30">
        {label}
      </p>

      <p
        className={`
          text-[10px]
          font-medium
          uppercase
          tracking-[0.12em]
          ${
            tone === "gold"
              ? "text-[#d2b170]"
              : tone === "green"
                ? "text-[#95aa7e]"
                : "text-white/55"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}

const models = {
  review: {
    appointmentState:
      "Prepared for Review",

    appointmentDetail:
      "Representative review required",

    actionEyebrow:
      "Current action",

    actionTitle:
      "Appointment prepared for review",

    appointmentBody:
      "Your proposed Appointment Instrument has been prepared for review. Your response is the next representative action in the Program sequence.",

    nextAction:
      "Review the proposed Appointment Instrument and record your decision. French-Ward activation follows separately after acceptance.",

    action:
      "Review Appointment",

    timeline: {
      agreement:
        "complete" as const,
      appointment:
        "current" as const,
      activation:
        "future" as const,
      authority:
        "future" as const,
      materials:
        "future" as const,
    },

    authority:
      "NONE",

    materials:
      "PRE-ACTIVATION",
  },

  accepted: {
    appointmentState:
      "Accepted · Awaiting Activation",

    appointmentDetail:
      "Internal activation required",

    actionEyebrow:
      "Current state",

    actionTitle:
      "Appointment accepted",

    appointmentBody:
      "Your acceptance has been recorded. The Appointment is now awaiting internal French-Ward activation.",

    nextAction:
      "No further representative action is presently required. French-Ward will complete the internal activation step.",

    action:
      "View Accepted Appointment",

    timeline: {
      agreement:
        "complete" as const,
      appointment:
        "complete" as const,
      activation:
        "current" as const,
      authority:
        "future" as const,
      materials:
        "future" as const,
    },

    authority:
      "NONE",

    materials:
      "PRE-ACTIVATION",
  },

  active: {
    appointmentState:
      "Active",

    appointmentDetail:
      "Appointment operative",

    actionEyebrow:
      "Current state",

    actionTitle:
      "Appointment active",

    appointmentBody:
      "Your Appointment has completed representative acceptance and French-Ward activation. The active instrument now forms part of your Program record.",

    nextAction:
      "Review your active Appointment and the materials currently available within your Representative Field.",

    action:
      "View Active Appointment",

    timeline: {
      agreement:
        "complete" as const,
      appointment:
        "complete" as const,
      activation:
        "complete" as const,
      authority:
        "current" as const,
      materials:
        "current" as const,
    },

    authority:
      "SEPARATE RECORD",

    materials:
      "RELEASE CONTROL",
  },
};



export default async function RepresentativeFieldPreview(
  props: {
    searchParams:
      Promise<{
        state?:
          | string
          | string[];
      }>;
  },
) {
  if (
    process.env.VERCEL_ENV ===
    "production"
  ) {
    notFound();
  }

  const searchParams =
    await props.searchParams;

  const state =
    resolveState(
      searchParams.state,
    );

  const model =
    models[state];

  return (
    <main
      className="
        min-h-screen
        bg-[#071015]
        text-[#e9edf0]
      "
      style={{
        backgroundImage:
          "radial-gradient(circle at 18% 8%, rgba(32,92,113,0.16), transparent 30%), radial-gradient(circle at 72% 18%, rgba(97,73,35,0.12), transparent 26%), linear-gradient(180deg, #091116 0%, #071015 60%, #060d11 100%)",
      }}
    >
      <div className="mx-auto min-h-screen max-w-[1600px] px-3 py-3 md:px-5 md:py-5">
        <div
          className="
            grid
            min-h-[calc(100vh-24px)]
            overflow-visible
            rounded-[24px]
            border
            border-white/[0.06]
            bg-[#0b1318]/88
            shadow-[0_30px_120px_rgba(0,0,0,0.45)]
            md:min-h-[calc(100vh-40px)]
            lg:grid-cols-[minmax(0,1fr)_286px]
          "
        >
          {/* CENTER FIELD */}
          <section className="min-w-0">
            <header
              className="
                sticky
                top-3
                z-40
                mx-3
                mt-3
                rounded-[16px]
                border
                border-white/[0.065]
                bg-[#091116]/95
                px-5
                py-3.5
                shadow-[0_16px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.035)]
                backdrop-blur-2xl
                md:mx-4
                md:px-6
              "
            >
              <div
                className="
                  grid
                  gap-4
                  md:grid-cols-[auto_1fr_auto]
                  md:items-center
                "
              >
                <div>
                  <p
                    className="
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-[0.2em]
                      text-[#b9985b]
                    "
                  >
                    French-Ward, Inc.
                  </p>

                  <p
                    className="
                      mt-1
                      text-[9px]
                      text-white/28
                    "
                  >
                    Authorized Representation Program
                  </p>
                </div>

                <div
                  className="
                    md:border-l
                    md:border-white/[0.055]
                    md:pl-6
                  "
                >
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      gap-x-4
                      gap-y-1
                    "
                  >
                    <p
                      className="
                        text-[13px]
                        font-medium
                        tracking-[-0.01em]
                        text-white/88
                      "
                    >
                      Jens Peter Thomsen
                    </p>

                    <span
                      className="
                        hidden
                        h-1
                        w-1
                        rounded-full
                        bg-white/15
                        sm:block
                      "
                    />

                    <p
                      className="
                        font-mono
                        text-[9px]
                        tracking-[0.05em]
                        text-white/26
                      "
                    >
                      FWI-26-RP-001
                    </p>
                  </div>
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    md:justify-end
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-[#c5a25f]
                      shadow-[0_0_14px_rgba(197,162,95,0.5)]
                    "
                  />

                  <div
                    className="
                      md:text-right
                    "
                  >
                    <p
                      className="
                        text-[7px]
                        uppercase
                        tracking-[0.14em]
                        text-white/20
                      "
                    >
                      Program standing
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[10px]
                        font-medium
                        text-[#d3b16e]
                      "
                    >
                      Provisional
                    </p>
                  </div>
                </div>
              </div>
            </header>

            <div className="px-5 pb-28 pt-7 md:px-8 md:pb-32 md:pt-9">
              {/* STATE SWITCHER */}
              <nav
                className="
                  mb-8
                  flex
                  gap-5
                  overflow-x-auto
                  border-b
                  border-white/[0.05]
                  pb-3
                "
              >
                {(
                  [
                    [
                      "review",
                      "A · Review",
                    ],
                    [
                      "accepted",
                      "B · Accepted",
                    ],
                    [
                      "active",
                      "C · Active",
                    ],
                  ] as const
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <Link
                      key={value}
                      href={
                        `/representative/workspace-preview?state=${value}`
                      }
                      className={`
                        shrink-0
                        border-b
                        pb-2
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.16em]
                        ${
                          state === value
                            ? "border-[#c1a15f] text-[#d6b46c]"
                            : "border-transparent text-white/20"
                        }
                      `}
                    >
                      {label}
                    </Link>
                  ),
                )}
              </nav>

              {/* FIELD STATE */}
              <section
                id="field-state"
                className="
                  mt-7
                "
              >
                <div
                  className="
                    mb-4
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                    sm:items-end
                    sm:justify-between
                  "
                >
                  <div>
                    <p
                      className="
                        text-[8px]
                        font-semibold
                        uppercase
                        tracking-[0.18em]
                        text-white/40
                      "
                    >
                      Program Field State
                    </p>

                    <p
                      className="
                        mt-1
                        text-[9px]
                        text-white/20
                      "
                    >
                      Institutional progression
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <span
                      className="
                        h-1
                        w-1
                        rounded-full
                        bg-[#c5a25f]
                      "
                    />

                    <p
                      className="
                        text-[7px]
                        font-semibold
                        uppercase
                        tracking-[0.14em]
                        text-[#9f8556]
                      "
                    >
                      {model.appointmentDetail}
                    </p>
                  </div>
                </div>

                <FieldStateStrip
                  state={state}
                />
              </section>

              {/* CURRENT ACTION */}
              <section
                id="appointment"
                className="
                  relative
                  mt-8
                  overflow-hidden
                  rounded-[22px]
                  border
                  border-[#b18e51]/20
                  bg-gradient-to-br
                  from-[#17232a]/95
                  via-[#10191e]/95
                  to-[#17140f]/95
                  p-6
                  shadow-[0_20px_70px_rgba(0,0,0,0.22)]
                  transition-[border-color,box-shadow,transform]
                  duration-300
                  hover:-translate-y-[1px]
                  hover:border-[#c0a05e]/30
                  hover:shadow-[0_24px_80px_rgba(0,0,0,0.30),0_0_36px_rgba(180,145,78,0.05)]
                  md:p-8
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    -left-24
                    top-0
                    h-64
                    w-64
                    rounded-full
                    bg-[#146a87]/[0.12]
                    blur-3xl
                  "
                />

                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-20
                    -top-24
                    h-56
                    w-56
                    rounded-full
                    bg-[#ad8a4a]/[0.09]
                    blur-3xl
                  "
                />

                <div className="relative">
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                    <div>
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >
                        <span
                          className="
                            relative
                            flex
                            h-2
                            w-2
                            items-center
                            justify-center
                          "
                        >
                          <span
                            className="
                              absolute
                              h-2
                              w-2
                              rounded-full
                              bg-[#c7a45e]/20
                              animate-ping
                            "
                          />

                          <span
                            className="
                              relative
                              h-1.5
                              w-1.5
                              rounded-full
                              bg-[#c7a45e]
                              shadow-[0_0_12px_rgba(199,164,94,0.45)]
                            "
                          />
                        </span>

                        <p
                          className="
                            text-[9px]
                            font-semibold
                            uppercase
                            tracking-[0.19em]
                            text-[#b89a61]
                          "
                        >
                          {model.actionEyebrow}
                        </p>
                      </div>

                      <h2
                        className="
                          mt-4
                          max-w-2xl
                          text-2xl
                          font-medium
                          tracking-[-0.025em]
                          text-white
                          md:text-3xl
                        "
                      >
                        {model.actionTitle}
                      </h2>

                      <p className="mt-2 text-sm text-white/48">
                        Authorized Commercial Representative
                      </p>
                    </div>

                    <span
                      className="
                        self-start
                        rounded-full
                        border
                        border-[#c1a15f]/25
                        bg-[#c1a15f]/[0.055]
                        px-3
                        py-2
                        text-[8px]
                        font-semibold
                        uppercase
                        tracking-[0.14em]
                        text-[#cdb06f]
                      "
                    >
                      {model.appointmentState}
                    </span>
                  </div>

                  <p
                    className="
                      mt-6
                      max-w-3xl
                      text-sm
                      leading-7
                      text-white/52
                    "
                  >
                    {model.appointmentBody}
                  </p>

                  <div
                    className="
                      mt-7
                      grid
                      gap-4
                      border-t
                      border-white/[0.06]
                      pt-5
                      md:grid-cols-2
                    "
                  >
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.15em] text-white/24">
                        Appointment class
                      </p>

                      <p className="mt-2 text-xs text-white/58">
                        Authorized Commercial Representative
                      </p>
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-[0.15em] text-white/24">
                        Form
                      </p>

                      <p className="mt-2 text-xs text-white/58">
                        Individual Representation
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      mt-7
                      flex
                      flex-col
                      justify-between
                      gap-5
                      md:flex-row
                      md:items-end
                    "
                  >
                    <div
                      className="
                        border-l
                        border-[#b18e51]/40
                        pl-4
                      "
                    >
                      <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#a98b57]">
                        Next institutional action
                      </p>

                      <p className="mt-2 max-w-xl text-[11px] leading-6 text-white/40">
                        {model.nextAction}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-[#c1a15f]/40
                        bg-[#c1a15f]/[0.07]
                        px-5
                        py-3
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.15em]
                        text-[#d7b971]
                        shadow-[0_0_25px_rgba(193,161,95,0.06)]
                      "
                    >
                      {model.action}
                    </button>
                  </div>

                </div>
              </section>

              {/* AGREEMENT RECORD */}
              <section
                id="agreement"
                className="
                  mt-10
                  overflow-hidden
                  rounded-[22px]
                  border
                  border-[#23343a]/80
                  bg-[linear-gradient(180deg,rgba(14,27,33,0.78)_0%,rgba(9,20,25,0.72)_100%)]
                  px-6
                  py-6
                  shadow-[inset_3px_0_0_rgba(118,148,96,0.22),inset_0_1px_0_rgba(255,255,255,0.035),0_18px_45px_rgba(0,0,0,0.14)]
                  transition-[border-color,background-color]
                  duration-300
                  hover:border-[#385044]/70
                  md:px-7
                "
              >
                <div className="flex items-end justify-between gap-5 border-b border-white/[0.06] pb-4">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/38">
                      Agreement Record
                    </p>

                    <h2 className="mt-2 text-lg font-medium text-white/86">
                      Representative Program Master Agreement
                    </h2>
                  </div>

                  <span className="text-[8px] uppercase tracking-[0.14em] text-[#91a27c]">
                    Executed
                  </span>
                </div>

                <div
                  className="
                    grid
                    gap-4
                    py-5
                    text-[10px]
                    md:grid-cols-[1fr_auto]
                    md:items-center
                  "
                >
                  <div>
                    <p className="font-mono text-white/30">
                      FWI-26-RP-ONB-CFCC47E131-MA
                    </p>

                    <p className="mt-2 max-w-2xl leading-6 text-white/35">
                      Admission to the Authorized Representation Program is recorded under this executed Program Agreement.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="
                      justify-self-start
                      rounded-full
                      border
                      border-white/[0.08]
                      px-4
                      py-2
                      text-[8px]
                      uppercase
                      tracking-[0.14em]
                      text-white/28
                      md:justify-self-end
                    "
                  >
                    View Agreement
                  </button>
                </div>
              </section>

              {/* FIELD MATERIALS */}
              <section
                id="materials"
                className="
                  relative
                  mt-8
                  overflow-hidden
                  rounded-[26px]
                  border
                  border-[#183943]/85
                  bg-[radial-gradient(circle_at_0%_0%,rgba(28,100,119,0.12),transparent_34%),linear-gradient(180deg,rgba(7,19,25,0.96)_0%,rgba(5,14,19,0.96)_100%)]
                  px-6
                  py-6
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_24px_65px_rgba(0,0,0,0.20)]
                  md:px-7
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    -left-28
                    -top-32
                    h-72
                    w-72
                    rounded-full
                    bg-[#176b82]/[0.10]
                    blur-3xl
                  "
                />

                <div
                  className="
                    pointer-events-none
                    absolute
                    -bottom-40
                    right-10
                    h-72
                    w-72
                    rounded-full
                    bg-[#9d793f]/[0.07]
                    blur-3xl
                  "
                />

                <div className="relative">
                  {/* ROOM HEADER */}
                  <div
                    className="
                      flex
                      flex-col
                      gap-4
                      border-b
                      border-white/[0.055]
                      pb-5
                      sm:flex-row
                      sm:items-end
                      sm:justify-between
                    "
                  >
                    <div>
                      <p
                        className="
                          text-[9px]
                          font-semibold
                          uppercase
                          tracking-[0.19em]
                          text-[#819ca5]
                        "
                      >
                        Field Materials
                      </p>

                      <h2
                        className="
                          mt-2
                          text-xl
                          font-medium
                          tracking-[-0.02em]
                          text-white/88
                        "
                      >
                        Representative operating resources
                      </h2>

                      <p
                        className="
                          mt-2
                          max-w-2xl
                          text-[10px]
                          leading-5
                          text-white/30
                        "
                      >
                        Source context and French-Ward operating materials
                        currently available within this Representative Field.
                      </p>
                    </div>

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <span
                        className="
                          h-1.5
                          w-1.5
                          rounded-full
                          bg-[#527f8a]
                          shadow-[0_0_10px_rgba(82,127,138,0.35)]
                        "
                      />

                      <span
                        className="
                          text-[8px]
                          uppercase
                          tracking-[0.14em]
                          text-[#849aa1]
                        "
                      >
                        Pre-activation
                      </span>
                    </div>
                  </div>

                  {/* SOURCE CONTEXT */}
                  <div
                    className="
                      mt-6
                      grid
                      gap-5
                      lg:grid-cols-[170px_1fr_auto]
                      lg:items-center
                    "
                  >
                    <div>
                      <p
                        className="
                          text-[8px]
                          font-semibold
                          uppercase
                          tracking-[0.18em]
                          text-white/30
                        "
                      >
                        Source Context
                      </p>

                      <p
                        className="
                          mt-1
                          text-[8px]
                          text-white/18
                        "
                      >
                        Representative orientation
                      </p>
                    </div>

                    <div
                      className="
                        rounded-[17px]
                        border
                        border-[#26515e]/55
                        bg-[#091a20]/65
                        px-5
                        py-4
                        shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]
                        transition-[border-color,background-color]
                        duration-300
                        hover:border-[#347080]/65
                        hover:bg-[#0a1d24]/75
                      "
                    >
                      <div
                        className="
                          flex
                          flex-col
                          justify-between
                          gap-4
                          sm:flex-row
                          sm:items-start
                        "
                      >
                        <div>
                          <p
                            className="
                              text-[8px]
                              uppercase
                              tracking-[0.14em]
                              text-[#73909a]
                            "
                          >
                            Source Authority
                          </p>

                          <h3
                            className="
                              mt-2
                              text-sm
                              font-medium
                              text-white/82
                            "
                          >
                            Bafoula Source Authority Digital Instrument
                          </h3>

                          <p
                            className="
                              mt-3
                              max-w-2xl
                              text-[10px]
                              leading-5
                              text-white/31
                            "
                          >
                            Source Authority material will appear here when
                            released for representative review.
                          </p>
                        </div>

                        <span
                          className="
                            shrink-0
                            rounded-full
                            border
                            border-[#416671]/45
                            bg-[#416671]/[0.055]
                            px-3
                            py-1.5
                            text-[7px]
                            uppercase
                            tracking-[0.12em]
                            text-[#78939b]
                          "
                        >
                          Review material
                        </span>
                      </div>
                    </div>

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        lg:justify-end
                      "
                    >
                      <span
                        className="
                          h-1.5
                          w-1.5
                          rounded-full
                          bg-[#527f8a]
                        "
                      />

                      <p
                        className="
                          text-[8px]
                          uppercase
                          tracking-[0.12em]
                          text-[#6f8991]
                        "
                      >
                        Awaiting release
                      </p>
                    </div>
                  </div>

                  {/* CUP SIGNATURE SURFACE */}
                  <div
                    className="
                      relative
                      mt-7
                      overflow-hidden
                      rounded-[22px]
                      border
                      border-[#80663b]/40
                      bg-[radial-gradient(circle_at_100%_0%,rgba(178,136,61,0.12),transparent_32%),radial-gradient(circle_at_0%_100%,rgba(22,100,122,0.10),transparent_38%),linear-gradient(135deg,rgba(18,28,31,0.96)_0%,rgba(15,23,25,0.97)_48%,rgba(22,20,16,0.96)_100%)]
                      p-6
                      shadow-[inset_0_1px_0_rgba(230,195,125,0.06),0_20px_55px_rgba(0,0,0,0.22)]
                      md:p-7
                    "
                  >
                    <div
                      className="
                        pointer-events-none
                        absolute
                        right-0
                        top-0
                        h-px
                        w-2/5
                        bg-gradient-to-l
                        from-[#c19c58]/45
                        to-transparent
                      "
                    />

                    <div
                      className="
                        flex
                        flex-col
                        justify-between
                        gap-6
                        lg:flex-row
                        lg:items-start
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          gap-4
                        "
                      >
                        <div
                          className="
                            flex
                            h-12
                            w-12
                            shrink-0
                            items-center
                            justify-center
                            rounded-[14px]
                            border
                            border-[#ac8849]/35
                            bg-[#ac8849]/[0.055]
                            font-mono
                            text-[9px]
                            font-semibold
                            tracking-[0.11em]
                            text-[#d0ae6b]
                            shadow-[0_0_26px_rgba(172,136,73,0.07)]
                          "
                        >
                          CUP
                        </div>

                        <div>
                          <p
                            className="
                              text-[8px]
                              font-semibold
                              uppercase
                              tracking-[0.19em]
                              text-[#b49256]
                            "
                          >
                            French-Ward
                          </p>

                          <h3
                            className="
                              mt-2
                              text-xl
                              font-medium
                              tracking-[-0.025em]
                              text-white/90
                            "
                          >
                            Commercial Utility Pack
                          </h3>

                          <p
                            className="
                              mt-2
                              max-w-2xl
                              text-[10px]
                              leading-5
                              text-white/34
                            "
                          >
                            The representative-specific operating package for
                            approved commercial language, materials, parameters,
                            boundaries, and opportunity support.
                          </p>
                        </div>
                      </div>

                      <div
                        className="
                          shrink-0
                          rounded-full
                          border
                          border-[#a78346]/30
                          bg-[#a78346]/[0.05]
                          px-4
                          py-2
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              h-1.5
                              w-1.5
                              rounded-full
                              bg-[#755e35]
                            "
                          />

                          <span
                            className="
                              text-[7px]
                              font-semibold
                              uppercase
                              tracking-[0.13em]
                              text-[#aa8b54]
                            "
                          >
                            Not yet released
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CUP CAPABILITIES */}
                    <div
                      className="
                        mt-7
                        grid
                        gap-2
                        sm:grid-cols-2
                        xl:grid-cols-5
                      "
                    >
                      {[
                        [
                          "Representation",
                          "Approved language",
                        ],
                        [
                          "Commercial",
                          "Parameters",
                        ],
                        [
                          "Documents",
                          "Released records",
                        ],
                        [
                          "Boundaries",
                          "Operating scope",
                        ],
                        [
                          "Opportunities",
                          "Field support",
                        ],
                      ].map(
                        ([
                          label,
                          detail,
                        ]) => (
                          <div
                            key={label}
                            className="
                              group
                              rounded-[14px]
                              border
                              border-white/[0.045]
                              bg-black/[0.10]
                              px-4
                              py-4
                              transition-[background-color,border-color,transform]
                              duration-300
                              hover:-translate-y-[1px]
                              hover:border-[#9a7842]/25
                              hover:bg-white/[0.018]
                            "
                          >
                            <div
                              className="
                                mb-3
                                flex
                                items-center
                                justify-between
                                gap-2
                              "
                            >
                              <span
                                className="
                                  h-1.5
                                  w-1.5
                                  rounded-full
                                  bg-white/10
                                  transition
                                  group-hover:bg-[#9b7b44]/55
                                "
                              />

                              <span
                                className="
                                  text-[6px]
                                  uppercase
                                  tracking-[0.12em]
                                  text-white/12
                                "
                              >
                                Standby
                              </span>
                            </div>

                            <p
                              className="
                                text-[8px]
                                font-semibold
                                uppercase
                                tracking-[0.13em]
                                text-white/42
                              "
                            >
                              {label}
                            </p>

                            <p
                              className="
                                mt-1.5
                                text-[8px]
                                text-white/20
                              "
                            >
                              {detail}
                            </p>
                          </div>
                        ),
                      )}
                    </div>

                    {/* CUP RELEASE BAR */}
                    <div
                      className="
                        mt-6
                        flex
                        flex-col
                        gap-3
                        border-t
                        border-white/[0.05]
                        pt-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >
                        <p
                          className="
                            text-[7px]
                            uppercase
                            tracking-[0.14em]
                            text-white/20
                          "
                        >
                          Current package state
                        </p>

                        <span
                          className="
                            text-[8px]
                            font-medium
                            text-[#a68852]
                          "
                        >
                          Standing by for release
                        </span>
                      </div>

                      <p
                        className="
                          text-[7px]
                          uppercase
                          tracking-[0.12em]
                          text-white/16
                        "
                      >
                        Representative-specific composition
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      mt-5
                      border-t
                      border-white/[0.045]
                      pt-4
                    "
                  >
                    <p
                      className="
                        text-[9px]
                        leading-5
                        text-white/21
                      "
                    >
                      Available materials are organized here according to their
                      current Program and release state.
                    </p>
                  </div>
                </div>
              </section>


            </div>
          </section>

          {/* RIGHT CONTEXT RAIL */}
          <aside
            className="
              relative
              hidden
              lg:block
              lg:self-start
            "
          >
            <div
              className="
                fixed
                right-[max(16px,calc((100vw-1600px)/2+16px))]
                top-4
                z-50
                w-[286px]
                max-h-[calc(100vh-32px)]
                overflow-y-auto
                rounded-[24px]
                border
                border-[#17323c]/80
                bg-[linear-gradient(180deg,#071117_0%,#050d12_55%,#050b0f_100%)]
                p-4
                shadow-[inset_1px_0_0_rgba(68,126,143,0.12),inset_0_1px_0_rgba(255,255,255,0.035),0_24px_70px_rgba(0,0,0,0.32)]
                backdrop-blur-2xl
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  bottom-8
                  left-0
                  top-8
                  w-px
                  bg-gradient-to-b
                  from-transparent
                  via-[#315c68]/60
                  to-transparent
                "
              />
              <div
                className="
                  mb-4
                  flex
                  items-center
                  justify-between
                  gap-4
                  px-1
                "
              >
                <div>
                  <p
                    className="
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-[0.2em]
                      text-[#74919b]/65
                    "
                  >
                    Institutional Context
                  </p>

                  <p
                    className="
                      mt-1
                      text-[8px]
                      text-white/18
                    "
                  >
                    Persistent representative state
                  </p>
                </div>

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[#537e8b]
                    shadow-[0_0_12px_rgba(83,126,139,0.35)]
                  "
                />
              </div>

            <div
              className="
                rounded-[18px]
                border
                border-[#19313a]/60
                bg-[#0a151b]/60
                p-5
                shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]
              "
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a6b9bf]/70">
                Institutional State
              </p>

              <div className="mt-4">
                <ContextRow
                  label="Program"
                  value="Provisional"
                  tone="gold"
                />

                <ContextRow
                  label="Agreement"
                  value="Executed"
                  tone="green"
                />

                <ContextRow
                  label="Appointment"
                  value={
                    state === "review"
                      ? "Review"
                      : state === "accepted"
                        ? "Accepted"
                        : "Active"
                  }
                  tone="gold"
                />

                <ContextRow
                  label="Authority"
                  value={
                    model.authority
                  }
                />

                <ContextRow
                  label="Materials"
                  value={
                    model.materials
                  }
                />
              </div>
            </div>

            <div
              className="
                mt-5
                rounded-[18px]
                border
                border-[#19313a]/60
                bg-[#0a151b]/60
                p-5
                shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]
              "
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a6b9bf]/70">
                Field Position
              </p>

              <p className="mt-4 text-sm font-medium text-white/72">
                {state === "review"
                  ? "Appointment Review"
                  : state === "accepted"
                    ? "Awaiting Activation"
                    : "Active Representation"}
              </p>

              <p className="mt-3 text-[10px] leading-5 text-white/28">
                {state === "review"
                  ? "Jens is admitted under an executed Program Agreement. Appointment review is the present institutional action."
                  : state === "accepted"
                    ? "Representative acceptance is recorded. French-Ward internal activation is the present institutional step."
                    : "The Appointment is active. The Representative Field now reflects the current Program, authority, and material-release state."}
              </p>
            </div>

            <div
              className="
                mt-5
                rounded-[18px]
                border
                border-[#1d3943]/65
                bg-[radial-gradient(circle_at_100%_0%,rgba(35,92,108,0.16),transparent_45%),#09151b]
                p-5
                shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]
              "
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a6b9bf]/70">
                Source Field
              </p>

              <p className="mt-4 text-sm font-medium text-white/70">
                Bafoula
              </p>

              <p className="mt-2 text-[10px] leading-5 text-white/27">
                Source Authority material will appear here when released for representative review.
              </p>

              <p className="mt-4 text-[8px] uppercase tracking-[0.12em] text-[#8c744e]">
                Awaiting source release
              </p>
            </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FIXED FIELD DOCK */}
      <footer
        className="
          fixed
          bottom-3
          left-[max(16px,calc((100vw-1600px)/2+16px))]
          right-4
          z-50
          rounded-[18px]
          border
          border-[#1c333c]/80
          bg-[#071116]/94
          px-4
          py-2.5
          shadow-[0_18px_55px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(255,255,255,0.04)]
          backdrop-blur-2xl
          lg:right-[max(318px,calc((100vw-1600px)/2+318px))]
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <nav
            className="
              flex
              min-w-0
              items-center
              gap-1
              overflow-x-auto
            "
            aria-label="Representative Field navigation"
          >
            <a
              href="#field-state"
              className="
                shrink-0
                rounded-full
                px-3
                py-2
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.13em]
                text-[#c5a45f]
                transition
                hover:bg-white/[0.035]
              "
            >
              Field
            </a>

            <a
              href="#appointment"
              className="
                shrink-0
                rounded-full
                px-3
                py-2
                text-[8px]
                uppercase
                tracking-[0.13em]
                text-white/38
                transition
                hover:bg-white/[0.035]
                hover:text-white/65
              "
            >
              Appointment
            </a>

            <a
              href="#agreement"
              className="
                shrink-0
                rounded-full
                px-3
                py-2
                text-[8px]
                uppercase
                tracking-[0.13em]
                text-white/38
                transition
                hover:bg-white/[0.035]
                hover:text-white/65
              "
            >
              Agreement
            </a>

            <a
              href="#materials"
              className="
                shrink-0
                rounded-full
                px-3
                py-2
                text-[8px]
                uppercase
                tracking-[0.13em]
                text-white/38
                transition
                hover:bg-white/[0.035]
                hover:text-white/65
              "
            >
              Materials
            </a>
          </nav>

          <div
            className="
              hidden
              shrink-0
              items-center
              gap-3
              sm:flex
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#527f8a]
                  shadow-[0_0_10px_rgba(82,127,138,0.35)]
                "
              />

              <span
                className="
                  text-[7px]
                  uppercase
                  tracking-[0.13em]
                  text-white/24
                "
              >
                Representative Field
              </span>
            </div>

            <span
              className="
                h-4
                w-px
                bg-white/[0.06]
              "
            />

            <span
              className="
                text-[7px]
                uppercase
                tracking-[0.13em]
                text-white/18
              "
            >
              AXPT
            </span>
          </div>
        </div>
      </footer>

    </main>
  );
}
