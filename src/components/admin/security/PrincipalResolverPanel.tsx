type Props = {
  principalId: string | null
  email: string | null
  authSource: string
  sessionCookiePresent: boolean
  expiresAt: string | null
  decodedClaims: Record<string, unknown>
}

export default function PrincipalResolverPanel({
  data,
}: {
  data: Props
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Principal Resolver</h2>

      <div className="grid gap-4 lg:grid-cols-2 text-sm">
        <Field label="Principal ID" value={data.principalId} />
        <Field label="Email" value={data.email} />
        <Field label="Auth Source" value={data.authSource} />
        <Field
          label="Session Cookie"
          value={data.sessionCookiePresent ? 'Present' : 'Missing'}
        />
        <Field label="Expires At" value={data.expiresAt} />
      </div>

      <div className="mt-6">
        <div className="mb-2 text-xs text-neutral-500">Decoded Claims</div>

        <pre className="overflow-auto rounded-lg bg-black p-3 text-xs text-neutral-300">
          {JSON.stringify(data.decodedClaims, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-sm text-white">{value ?? '—'}</div>
    </div>
  )
}