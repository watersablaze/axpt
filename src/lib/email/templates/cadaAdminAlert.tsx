// 📁 src/lib/email/templates/cadaAdminAlert.tsx
export default function CadaAdminAlert({ email }: { email: string }) {
  return (
    <div style={{ fontFamily: 'sans-serif', lineHeight: 1.6, padding: '1rem' }}>
      <h2>New CADA Waitlist Entry</h2>
      <p><strong>Email:</strong> {email}</p>
      <p><em>Received at:</em> {new Date().toLocaleString()}</p>
    </div>
  );
}