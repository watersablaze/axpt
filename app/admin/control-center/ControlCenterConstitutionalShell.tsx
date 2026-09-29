'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import styles from './control-center-shell.module.css'

const PRIMARY_DOMAINS = [
  {
    label: 'Command',
    href: '/admin/control-center',
    match: (pathname: string) =>
      pathname === '/admin/control-center',
  },
  {
    label: 'Transactions',
    href: '/admin/control-center/transactions',
    match: (pathname: string) =>
      pathname.startsWith('/admin/control-center/transactions'),
  },
  {
    label: 'Treasury',
    href: '/admin/control-center/treasury',
    match: (pathname: string) =>
      pathname.startsWith('/admin/control-center/treasury'),
  },
  {
    label: 'Instruments',
    href: '/admin/control-center/instruments',
    match: (pathname: string) =>
      pathname.startsWith('/admin/control-center/instruments'),
  },
] as const

const SECONDARY_DOMAINS = [
  {
    label: 'Execution',
    href: '/admin/control-center/execution',
    match: (pathname: string) =>
      pathname.startsWith('/admin/control-center/execution'),
  },
  {
    label: 'Spine',
    href: '/admin/control-center/spine',
    match: (pathname: string) =>
      pathname.startsWith('/admin/control-center/spine'),
  },
  {
    label: 'System',
    href: '/admin/control-center/system',
    match: (pathname: string) =>
      pathname.startsWith('/admin/control-center/system'),
  },
] as const

function getLocation(pathname: string) {
  if (pathname.startsWith('/admin/control-center/transactions')) {
    return 'TRANSACTIONS / GOVERNED TRANSACTION RECORD'
  }

  if (pathname.startsWith('/admin/control-center/treasury')) {
    return 'TREASURY / OPERATING SURFACE'
  }

  if (pathname.startsWith('/admin/control-center/instruments')) {
    return 'INSTRUMENTS / INSTITUTIONAL INSTRUMENT CONTROL'
  }

  if (pathname.startsWith('/admin/control-center/execution')) {
    return 'EXECUTION / OPERATING DOMAIN'
  }

  if (pathname.startsWith('/admin/control-center/spine')) {
    return 'SPINE / EXECUTION LINEAGE'
  }

  if (pathname.startsWith('/admin/control-center/system')) {
    return 'SYSTEM / CONTROL PLANE'
  }

  return 'COMMAND / INSTITUTIONAL OPERATING PICTURE'
}

export default function ControlCenterConstitutionalShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const domains = [
    ...PRIMARY_DOMAINS,
    ...SECONDARY_DOMAINS,
  ]

  const activeDomain =
    domains.find((domain) => domain.match(pathname)) ??
    PRIMARY_DOMAINS[0]

  return (
    <section className={styles.shell}>
      <header className={styles.axis}>
        <div className={styles.identity}>
          <span>CONTROL CENTER</span>
          <strong>INSTITUTIONAL CONTROL PLANE</strong>
        </div>

        <div className={styles.desktopNavigation}>
          <div className={styles.navigationRow}>
            <nav
              className={styles.primaryNavigation}
              aria-label="Control Center domains"
            >
              {PRIMARY_DOMAINS.map((domain) => {
                const active = domain.match(pathname)

                return (
                  <Link
                    key={domain.href}
                    href={domain.href}
                    aria-current={active ? 'page' : undefined}
                    className={active ? styles.active : undefined}
                  >
                    {domain.label}
                  </Link>
                )
              })}
            </nav>

            <div className={styles.axisDivider} aria-hidden="true" />

            <nav
              className={styles.secondaryNavigation}
              aria-label="Control Center system domains"
            >
              {SECONDARY_DOMAINS.map((domain) => {
                const active = domain.match(pathname)

                return (
                  <Link
                    key={domain.href}
                    href={domain.href}
                    aria-current={active ? 'page' : undefined}
                    className={active ? styles.active : undefined}
                  >
                    {domain.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        <details className={styles.mobileDisclosure}>
          <summary>
            <span>{activeDomain.label}</span>
            <span
              className={styles.disclosureMark}
              aria-hidden="true"
            >
              +
            </span>
          </summary>

          <nav
            className={styles.mobileDomainNavigation}
            aria-label="Control Center domains"
          >
            {domains.map((domain) => {
              const active = domain.match(pathname)

              return (
                <Link
                  key={domain.href}
                  href={domain.href}
                  aria-current={active ? 'page' : undefined}
                  className={active ? styles.active : undefined}
                >
                  {domain.label}
                </Link>
              )
            })}
          </nav>
        </details>

        <div className={styles.location}>
          {getLocation(pathname)}
        </div>
      </header>

      <div className={styles.content}>
        {children}
      </div>
    </section>
  )
}
