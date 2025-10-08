'use client';

import { useState } from 'react';
import styles from '@/app/cada/cada.module.css';

export default function CadaWaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/cada/join', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        setSubmitted(true);

        // Trigger flyer download
        const link = document.createElement('a');
        link.href = '/images/cada/cada16flyer.jpg';
        link.download = 'CADA_16th_Anniversary.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('There was an error. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  return (
    <div>
      {!submitted ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
              className="w-full px-4 py-2 rounded bg-black text-white border border-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Join the Waitlist
          </button>
        </form>
      ) : (
        <p className="text-black text-center font-medium mt-4 animate-fade-in">
          ✅ Thank you for joining! Your flyer is downloading...
        </p>
      )}
    </div>
  );
}