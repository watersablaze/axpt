type Props = {
  caseId: string
}

export default function CaseEscrowTab({ caseId }: Props) {

  return (
    <div>

      <h2 className="text-xl font-semibold">
        Escrow
      </h2>

      Escrow state and token balances.

    </div>
  )
}