type Input = {
  roles: string[]
  permissions: string[]
}

export function getOperatorAuthorityProfile({
  roles,
  permissions,
}: Input) {
  const hasRole = (role: string) =>
    roles.includes(role)

  const hasPermission = (permission: string) =>
    permissions.includes(permission)

  return {
    transitionAuthority: {
      status: hasRole('ADMIN_PLATFORM')
        ? 'ACTIVE'
        : 'LIMITED',
      detail:
        'Can preview and execute allowed dossier transitions.',
    },

    approvalAuthority: {
      status: hasRole('ADMIN_PLATFORM')
        ? 'ACTIVE'
        : 'LIMITED',
      detail:
        'Can grant approval requirements for governed transitions.',
    },

    incidentAuthority: {
      status:
        hasPermission('CONTROL_CENTER_INCIDENT_WRITE') ||
        hasRole('ADMIN_PLATFORM')
          ? 'ACTIVE'
          : 'LIMITED',
      detail:
        'Can acknowledge and resolve operational incidents.',
    },

    treasuryAuthority: {
      status:
        hasPermission('TREASURY_WRITE') ||
        hasRole('ADMIN_PLATFORM')
          ? 'ACTIVE'
          : 'PENDING',
      detail:
        'Can participate in treasury execution workflows.',
    },

    artifactAuthority: {
      status: hasRole('ADMIN_PLATFORM')
        ? 'ACTIVE'
        : 'LIMITED',
      detail:
        'Can trigger system-generated transaction instruments through transitions.',
    },
  }
}