export const ADMIN_NAV = [
  {
    label: 'Overview',
    href: '/admin',
    entity: { assets: [] as string[] },
  },
  {
    label: 'Control Center',
    href: '/admin/control-center',
    entity: { assets: [] as string[] },
  },
  {
    label: 'Treasury',
    href: '/admin/treasury',
    entity: { assets: ['AXG'] as string[] },
  },
  {
    label: 'Initiatives',
    href: '/admin/initiatives',
    entity: { assets: [] as string[] },
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    entity: { assets: [] as string[] },
  },
] as const

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
