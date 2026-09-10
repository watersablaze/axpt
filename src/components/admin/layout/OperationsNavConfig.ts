type AdminNavItem = {
  label: string
  href: string
  entity: {
    assets: string[]
  }
  requiredAnyPermissions: string[]
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  {
    label: 'Overview',
    href: '/admin',
    entity: { assets: [] as string[] },
    requiredAnyPermissions: ['admin.access'],
  },
  {
    label: 'Control Center',
    href: '/admin/control-center',
    entity: { assets: [] as string[] },
    requiredAnyPermissions: ['admin.access'],
  },
  {
    label: 'Treasury',
    href: '/admin/treasury',
    entity: { assets: ['AXG'] as string[] },
    requiredAnyPermissions: ['admin.access'],
  },
  {
    label: 'Communications',
    href: '/admin/communications',
    entity: { assets: [] as string[] },
    requiredAnyPermissions: ['COMMUNICATIONS_ACCESS'],
  },
  {
    label: 'Initiatives',
    href: '/admin/initiatives',
    entity: { assets: [] as string[] },
    requiredAnyPermissions: ['admin.access'],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    entity: { assets: [] as string[] },
    requiredAnyPermissions: ['admin.access'],
  },
] as const

export function getVisibleAdminNav(
  permissions: readonly string[]
) {
  const permissionSet =
    new Set(permissions)

  return ADMIN_NAV.filter(
    (item) =>
      item.requiredAnyPermissions.some(
        (permission) =>
          permissionSet.has(permission)
      )
  )
}

export function getAdminPageMeta(pathname: string) {
  if (pathname.startsWith('/admin/treasury')) {
    return {
      title: 'Treasury Control Center',
      subtitle: 'Situation, decision, control, diagnostics, and system history.',
    }
  }

  if (pathname.startsWith('/admin/control-center')) {
    return {
      title: 'Control Center',
      subtitle: 'Live operations, queue priority, and execution awareness.',
    }
  }

  if (pathname.startsWith('/admin/communications')) {
    return {
      title: 'Communications',
      subtitle: 'Private institutional messaging and operational coordination.',
    }
  }

  if (pathname.startsWith('/admin/initiatives')) {
    return {
      title: 'Initiatives',
      subtitle: 'Review, update, and create initiative records.',
    }
  }

  if (pathname.startsWith('/admin/settings')) {
    return {
      title: 'Settings',
      subtitle: 'System configuration and operational controls.',
    }
  }

  return {
    title: 'AXPT Admin',
    subtitle: 'Navigation, command access, and operational oversight.',
  }
}
