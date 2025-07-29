// app/onboard/layout.tsx
export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen">
      {children}
    </section>
  );
}