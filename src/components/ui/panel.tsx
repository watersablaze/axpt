export default function Panel({
  children,
  title,
}: {
  children: React.ReactNode
  title?: string
}) {
  return (
    <div className="border border-neutral-800 rounded-lg p-4 bg-black/40 space-y-3">
      {title && (
        <div className="text-xs uppercase text-neutral-500">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}