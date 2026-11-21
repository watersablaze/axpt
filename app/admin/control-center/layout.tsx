import ControlCenterConstitutionalShell from './ControlCenterConstitutionalShell'

export default function ControlCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ControlCenterConstitutionalShell>
      {children}
    </ControlCenterConstitutionalShell>
  )
}
