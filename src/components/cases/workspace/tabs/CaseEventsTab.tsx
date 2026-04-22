type Props = {
  caseId: string
}

export default function CaseEventsTab({ caseId }: Props) {

  return (
    <div>

      <h2 className="text-xl font-semibold">
        Event Log
      </h2>

      Event history for case {caseId}

    </div>
  )
}