import {
  transitionRegistry,
} from './transitionRegistry'

type RegistryIssue = {
  transitionKey: string
  severity: 'WARNING' | 'CRITICAL'
  message: string
}

export function validateTransitionRegistry() {
  const issues: RegistryIssue[] = []

  for (const [
    transitionKey,
    entry,
  ] of Object.entries(transitionRegistry)) {
    if (!entry.fromState) {
      issues.push({
        transitionKey,
        severity: 'CRITICAL',
        message: 'Missing fromState.',
      })
    }

    if (!entry.toState) {
      issues.push({
        transitionKey,
        severity: 'CRITICAL',
        message: 'Missing toState.',
      })
    }

    if (
      transitionKey !==
      `${entry.fromState}_TO_${entry.toState}`
    ) {
      issues.push({
        transitionKey,
        severity: 'CRITICAL',
        message:
          'Transition key does not match fromState/toState.',
      })
    }

    if (entry.consequences.length === 0) {
      issues.push({
        transitionKey,
        severity: 'WARNING',
        message:
          'Transition has no declared consequences.',
      })
    }

    if (
      entry.toState.includes('RELEASED') &&
      entry.generatedArtifacts.length === 0
    ) {
      issues.push({
        transitionKey,
        severity: 'WARNING',
        message:
          'Release transition has no generated artifacts.',
      })
    }

    if (
      entry.toState.includes('RELEASED') &&
      entry.requiredApprovals.length === 0
    ) {
      issues.push({
        transitionKey,
        severity: 'CRITICAL',
        message:
          'Release transition has no required approvals.',
      })
    }
  }

  return {
    ok: issues.every(
      (issue) => issue.severity !== 'CRITICAL'
    ),
    issues,
  }
}