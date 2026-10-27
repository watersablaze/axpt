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
  if (pathname === '/admin/control-center/transactions') {
    return {
      label: 'TRANSACTIONS / TRANSACTION REGISTRY',
      description:
        'Governed commercial records. Registry presence does not authorize execution, settlement, or movement of value.',
    }
  }

  if (pathname.startsWith('/admin/control-center/transactions/')) {
    const reference = decodeURIComponent(
      pathname.slice('/admin/control-center/transactions/'.length).split('/')[0] || ''
    )

    return {
      label: reference
        ? `TRANSACTIONS / ${reference}`
        : 'TRANSACTIONS / GOVERNED TRANSACTION RECORD',
      description: 'Governed transaction record · operator-controlled institutional workspace.',
    }
  }

  if (pathname.startsWith('/admin/control-center/treasury')) {
    return { label: 'TREASURY / OPERATING SURFACE', description: null }
  }

  if (pathname === '/admin/control-center/instruments') {
    return {
      label: 'INSTRUMENTS / INSTITUTIONAL INSTRUMENT REGISTRY',
      description:
        'Canonical institutional records. Each instrument retains its own authority boundary.',
    }
  }

  if (pathname.startsWith('/admin/control-center/instruments')) {
    return {
      label: 'INSTRUMENTS / INSTITUTIONAL INSTRUMENT CONTROL',
      description: null,
    }
  }

  if (pathname.startsWith('/admin/control-center/execution')) {
    return { label: 'EXECUTION / OPERATING DOMAIN', description: null }
  }

  if (pathname.startsWith('/admin/control-center/spine')) {
    return { label: 'SPINE / EXECUTION LINEAGE', description: null }
  }

  if (pathname.startsWith('/admin/control-center/system')) {
    return { label: 'SYSTEM / CONTROL PLANE', description: null }
  }

  return { label: 'COMMAND / INSTITUTIONAL OPERATING PICTURE', description: null }
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

  const location = getLocation(pathname)

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
          <span>{location.label}</span>
          {location.description ? (
            <p>{location.description}</p>
          ) : null}
        </div>
      </header>

      <div className={`${styles.content} ${
        pathname === '/admin/control-center' ? styles.commandContent : ''
      }`}>
        {children}
      </div>
    </section>
  )
}
