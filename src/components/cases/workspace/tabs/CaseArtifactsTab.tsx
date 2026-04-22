type Props = {
  caseId: string
}

export default function CaseArtifactsTab({ caseId }: Props) {

  return (
    <div>

      <h2 className="text-xl font-semibold">
        Artifacts
      </h2>

      Artifact vault for case {caseId}

    </div>
  )
}