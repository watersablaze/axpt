import { getApprovalTemplateRequirements } from "./ApprovalTemplates";

export type ApprovalGateCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
};

export type ApprovalGateResult = {
  passed: boolean;
  blockingReason?: string;
  checks: ApprovalGateCheck[];
};

type ApprovalRequirementForGate = {
  transitionKey: string;
  requiredRole: string;
  requiredCount: number;
  status: string;
};

type ApprovalGateInput = {
  fromState: string;
  toState: string;
  operatorRoles?: string[];
  requirements?: ApprovalRequirementForGate[];
};

export function getTransitionKey(fromState: string, toState: string) {
  return `${fromState}_TO_${toState}`;
}

export function checkDossierApprovalGate({
  fromState,
  toState,
  operatorRoles = [],
  requirements = [],
}: ApprovalGateInput): ApprovalGateResult {
  const transitionKey = getTransitionKey(fromState, toState);

  const storedRequirements = requirements.filter(
    (item) => item.transitionKey === transitionKey,
  );

  const templateRequirements = getApprovalTemplateRequirements(transitionKey);

  const activeRequirements =
    storedRequirements.length > 0
      ? storedRequirements
      : templateRequirements.map((requirement) => ({
          transitionKey,
          requiredRole: requirement.requiredRole,
          requiredCount: requirement.requiredCount,
          status: "PENDING",
        }));

  if (activeRequirements.length === 0) {
    return {
      passed: true,
      checks: [
        {
          id: "baseline",
          label: "No approval gate required",
          passed: true,
          detail: "Current transition does not require additional approval.",
        },
      ],
    };
  }

  const checks = activeRequirements.map((requirement) => {
    const operatorHasRole = operatorRoles.includes(requirement.requiredRole);
    const satisfied = requirement.status === "SATISFIED";

    return {
      id: `approval-${requirement.requiredRole.toLowerCase()}`,
      label: `${requirement.requiredRole} approval`,
      passed: satisfied,
      detail: satisfied
        ? "Stored approval requirement has been satisfied."
        : operatorHasRole
          ? "This approval requirement is pending. Use the approval gate panel to grant approval before advancing."
          : "This approval requirement is pending and requires an authorized operator role.",
    };
  });

  const failed = checks.filter((check) => !check.passed);

  return {
    passed: failed.length === 0,
    blockingReason:
      failed.length > 0
        ? "Stored transition approval requirements must be satisfied before this transition can execute."
        : undefined,
    checks,
  };
}
