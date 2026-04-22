type Props = {
  caseId: string
}

export default function CasePartiesTab({ caseId }: Props) {

  return (
    <div>

      <h2 className="text-xl font-semibold">
        Parties
      </h2>

      Parties involved in this case.

    </div>
  )
}