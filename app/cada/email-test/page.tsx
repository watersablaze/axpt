'use client';

import { useState, useEffect } from 'react';
import CadaWelcome from '@/lib/email/templates/CadaWelcome';
import { render } from '@react-email/render';

export default function CadaEmailTestPage() {
  const [email, setEmail] = useState('mayasvisions@gmail.com');
  const [joinedAtISO, setJoinedAtISO] = useState(new Date().toISOString());
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [response, setResponse] = useState<string>('');

  useEffect(() => {
    const renderEmail = async () => {
      const rendered = await render(
        <CadaWelcome
          email={email}
          joinedAtISO={joinedAtISO}
          heroImage="https://www.axpt.io/emails/assets/cada-bg-palms.png"
          logo="https://www.axpt.io/images/cada/cada-logo.png"
          primaryColor="#000000"
        />,
        { pretty: true }
      );
      setHtml(rendered);
    };

    renderEmail();
  }, [email, joinedAtISO]);

  const handleSendTest = async () => {
    if (!email || !email.includes('@')) {
      setResponse('❌ Please enter a valid email.');
      return;
    }

    setStatus('sending');
    setResponse('');

    try {
      const res = await fetch('/api/cada/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('sent');
        setResponse('✅ Test email sent successfully.');
        setJoinedAtISO(new Date().toISOString()); // Refresh for JSX
      } else {
        setStatus('error');
        setResponse(`❌ Failed to send: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus('error');
      setResponse('❌ Network or server error.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Rendered HTML Preview */}
      <div className="w-full md:w-1/2 border-r border-gray-300 p-4">
        <h2 className="text-xl font-semibold mb-4">📄 Raw Rendered HTML</h2>
        <div className="mb-4">
          <input
            type="email"
            placeholder="Enter test email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-3 py-2 rounded w-full text-black"
          />
          <button
            onClick={handleSendTest}
            className="mt-2 bg-black text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending...' : 'Send Test Email'}
          </button>
          {response && <p className="text-sm mt-2">{response}</p>}
        </div>
        <iframe
          srcDoc={html}
          className="w-full h-[70vh] border rounded shadow"
        />
      </div>

      {/* Right: JSX Live Component */}
      <div className="w-full md:w-1/2 p-4">
        <h2 className="text-xl font-semibold mb-4">🎨 Live JSX Preview</h2>
        <div className="border border-gray-300 rounded shadow overflow-hidden max-h-[80vh] overflow-y-auto">
          <CadaWelcome
            email={email}
            joinedAtISO={joinedAtISO}
            heroImage="https://www.axpt.io/emails/assets/cada-bg-palms.png"
            logo="https://www.axpt.io/images/cada/cada-logo.png"
            primaryColor="#000000"
          />
        </div>
      </div>
    </div>
  );
}