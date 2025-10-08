// 📁 scripts/testResendConnection.ts
import { Resend } from 'resend';
import 'dotenv/config';

function normalizeDomains(resp: any): any[] {
  // Handles { data: { data: [...] } }, { data: [...] }, { items: [...] }, or []
  if (Array.isArray(resp)) return resp;
  if (resp?.data?.data && Array.isArray(resp.data.data)) return resp.data.data;
  if (resp?.data && Array.isArray(resp.data)) return resp.data;
  if (resp?.items && Array.isArray(resp.items)) return resp.items;
  return [];
}

(async () => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('❌ Missing RESEND_API_KEY in .env.local');
    process.exit(1);
  }

  console.log('🔍 Initiating Resend diagnostics...\n');
  const resend = new Resend(resendKey);

  try {
    const raw = await resend.domains.list();
    const domains = normalizeDomains(raw);

    if (!domains.length) {
      console.warn('⚠️ No verified domains found.');
      console.log('Raw response shape:', JSON.stringify(raw, null, 2));
    } else {
      console.log('✅ Connected to Resend.\n');
      console.table(
        domains.map((d: any) => ({
          Name: d.name,
          Status: d.status,
          Region: d.region || '—',
          Created: d.created_at || '—',
          Id: d.id || '—',
        }))
      );
    }

    const testEmail = process.env.TEST_EMAIL || 'connect@axpt.io';
    console.log(`\n📤 Sending test email to: ${testEmail}...\n`);
    const response = await resend.emails.send({
      from: 'AXPT Diagnostics <noreply@axpt.io>',
      to: [testEmail],
      subject: '✨ AXPT ↔ Resend Diagnostics',
      html: `
        <div style="font-family:sans-serif;padding:1.5rem;background:#0b0b0b;color:#fff;border-radius:6px;">
          <h2>Connection Successful</h2>
          <p><strong>Domains found:</strong> ${domains.length}</p>
          <ul>${domains.map((d: any) => `<li>${d.name} — ${d.status}</li>`).join('')}</ul>
        </div>
      `,
    });

    console.log('✅ Test email dispatched successfully.');
    console.log('📦 Response:', response);
  } catch (err: any) {
    console.error('\n❌ Connection or send failed:');
    console.error(err);
  }
})();