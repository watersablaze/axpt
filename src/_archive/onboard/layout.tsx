// app/onboard/layout.tsx

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-screen bg-black text-white antialiased">
      {children}
    </div>
  );
}