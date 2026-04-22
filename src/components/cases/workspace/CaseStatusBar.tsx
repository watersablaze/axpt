import { CaseData, CaseStatus } from "@/shared/types/case"

type Props = {
  caseData: CaseData
}

const statusColorMap: Record<CaseStatus, string> = {
  DRAFT: "#6B7280",
  OPEN: "#4DA3FF",
  IN_REVIEW: "#A78BFA",
  ACTIVE: "#00D084",
  ESCROW_INITIATED: "#F7B500",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
  ARCHIVED: "#4B5563"
}

export default function CaseStatusBar({ caseData }: Props) {

  const color = statusColorMap[caseData.status]

  return (
    <div className="caseStatusBar">

      <div className="statusLeft">
        <span className="caseTitle">{caseData.title}</span>
      </div>

      <div className="statusRight">

        <div
          className="caseStatusIndicator"
          style={{ background: color }}
        >
          {caseData.status}
        </div>

      </div>

    </div>
  )
}