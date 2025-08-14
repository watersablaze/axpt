'use client';

import { useState } from 'react';
import styles from './FeaturedGemIntakeForm.module.css';

export default function FeaturedGemIntakeForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    desiredGem: '',
    format: '',
    size: '',
    quantity: '',
    notes: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/shadow-vault/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Submission failed.');

      setStatus('success');
      setMessage('Thank you. Your request has been recorded.');

      // Reset form after success
      setForm({
        name: '',
        email: '',
        phone: '',
        desiredGem: '',
        format: '',
        size: '',
        quantity: '',
        notes: '',
      });
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Unexpected error. Try again.');
    }
  };

  return (
    <div className={styles.container}>
      {status === 'success' ? (
        <div className={styles.successBox}>
          <h3 className={styles.successHeading}>🎉 Thank You</h3>
          <p className={styles.successMessage}>{message}</p>
          <a
            className={styles.downloadBtn}
            href="/docs/shadow-vault/shadow-vault-catalogue.pdf"
            download
          >
            📥 Download Catalogue
          </a>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3 className={styles.formHeading}>Submit Your Request</h3>

          <input
            type="text"
            name="name"
            placeholder="Your Full Name"
            value={form.name}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number (optional)"
            value={form.phone}
            onChange={handleChange}
            className={styles.input}
          />

          <input
            type="text"
            name="desiredGem"
            placeholder="Gem of Interest (e.g. Black Diamond)"
            value={form.desiredGem}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <input
            type="text"
            name="format"
            placeholder="Format (e.g. Pendant, Sculpture)"
            value={form.format}
            onChange={handleChange}
            className={styles.input}
          />

          <input
            type="text"
            name="size"
            placeholder="Preferred Size or Dimensions"
            value={form.size}
            onChange={handleChange}
            className={styles.input}
          />

          <input
            type="text"
            name="quantity"
            placeholder="Quantity Desired"
            value={form.quantity}
            onChange={handleChange}
            className={styles.input}
          />

          <textarea
            name="notes"
            placeholder="Additional notes or inspiration..."
            value={form.notes}
            onChange={handleChange}
            className={styles.textarea}
          />

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Submitting...' : 'Submit Request'}
          </button>

          {status === 'error' && (
            <p className={styles.errorMessage}>❌ {message}</p>
          )}
        </form>
      )}
    </div>
  );
}