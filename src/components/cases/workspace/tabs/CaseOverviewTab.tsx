type Props = {
  caseId: string
}

export default function CaseOverviewTab({ caseId }: Props) {

  return (
    <div className="space-y-4">

      <h2 className="text-xl font-semibold">
        Case Overview
      </h2>

      <div className="border border-neutral-800 p-4 rounded">
        Overview information for case {caseId}
      </div>

    </div>
  )
}