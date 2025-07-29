// app/french-ward/shadow-vault/ShadowVaultPage.tsx
'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import styles from './ShadowVaultForm.module.css';

export default function ShadowVaultPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    desiredGem: '',
    format: '',
    size: '',
    quantity: '',
    notes: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shadow-vault/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      alert(data.message);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <h1 className={styles.title}>The Shadow Vault</h1>
        <p className={styles.subtitle}>Black Diamond Edition | Rare Gem & Mineral Intake</p>

        <div className={styles.formBox}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label className={styles.label}>Full Name</label>
              <input name="name" onChange={handleChange} value={form.name} className={styles.input} required />
            </div>

            <div>
              <label className={styles.label}>Email Address</label>
              <input type="email" name="email" onChange={handleChange} value={form.email} className={styles.input} required />
            </div>

            <div>
              <label className={styles.label}>Desired Gem, Crystal, or Mineral</label>
              <input name="desiredGem" onChange={handleChange} value={form.desiredGem} className={styles.input} required />
            </div>

            <div className={styles.row}>
              <div>
                <label className={styles.label}>Format</label>
                <select name="format" onChange={handleChange} value={form.format} className={styles.input}>
                  <option value="">Select Format</option>
                  <option value="raw">Raw</option>
                  <option value="cut">Cut</option>
                  <option value="calibrated">Calibrated</option>
                </select>
              </div>
              <div>
                <label className={styles.label}>Size Range</label>
                <input name="size" onChange={handleChange} value={form.size} className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>Quantity</label>
                <input name="quantity" onChange={handleChange} value={form.quantity} className={styles.input} />
              </div>
            </div>

            <div>
              <label className={styles.label}>Refinement Specs / Certifications</label>
              <textarea name="notes" rows={4} onChange={handleChange} value={form.notes} className={styles.input}></textarea>
            </div>

            <button type="submit" className={styles.submit}>Submit to the Vault</button>
          </form>
        </div>
      </div>
    </div>
  );
}