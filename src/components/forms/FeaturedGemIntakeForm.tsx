'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '@/app/french-ward/shadow-vault/ShadowVaultForm.module.css';

type Props = { compact?: boolean };

type FormState = {
  name: string;
  email: string;
  phone: string;
  desiredGem: string;
  format: string;
  size: string;
  quantity: string;
  notes: string;
};

type Errors = Partial<Record<keyof FormState, string>>;
type Touched = Partial<Record<keyof FormState, boolean>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function FeaturedGemIntakeForm({ compact = false }: Props) {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    desiredGem: '',
    format: '',
    size: '',
    quantity: '',
    notes: '',
  });
  const [debouncedForm, setDebouncedForm] = useState<FormState>(form);
  const [touched, setTouched] = useState<Touched>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shakeField, setShakeField] = useState<keyof FormState | null>(null);

  // throttle guard for scrollIntoView
  const lastScrollRef = useRef(0);

  // universal debounce (calm, non-naggy errors while typing)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedForm(form), 400);
    return () => clearTimeout(t);
  }, [form]);

  // validation
  const validate = (f: FormState): Errors => {
    const e: Errors = {};
    if (!f.name.trim()) e.name = 'Please enter your full name.';
    if (!f.email.trim()) e.email = 'An email address is required.';
    else if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email address.';
    if (!f.desiredGem.trim()) e.desiredGem = 'Tell us the gem you’re seeking.';
    if (!f.format) e.format = 'Choose a format (raw, faceted, cabochon, tumbled).';
    if (f.quantity && !/^\d+$/.test(f.quantity)) e.quantity = 'Quantity must be a whole number.';
    return e;
  };

  const debouncedErrors = useMemo(() => validate(debouncedForm), [debouncedForm]);
  const immediateErrors = useMemo(() => validate(form), [form]);
  const isValidNow = Object.keys(immediateErrors).length === 0;

  // helpers
  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const markAllTouched = () => {
    const all: Touched = Object.keys(form).reduce((acc, k) => {
      acc[k as keyof FormState] = true;
      return acc;
    }, {} as Touched);
    setTouched(all);
  };

  const scrollToField = (field: keyof FormState) => {
    const now = Date.now();
    if (now - lastScrollRef.current < 1000) return; // throttle: 1s
    lastScrollRef.current = now;
    const el = document.getElementById(field);
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  };

  // Shake on blur if the specific field is invalid
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target as { name: keyof FormState };
    setTouched((t) => ({ ...t, [name]: true }));

    // use *immediate* validation to catch current keystroke state
    const errs = validate(form);
    if (errs[name]) setShakeField(name);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    markAllTouched();

    if (!isValidNow) {
      const firstKey = (Object.keys(immediateErrors) as (keyof FormState)[])[0];
      setShakeField(firstKey);       // shake the first invalid
      scrollToField(firstKey);       // bring it into view
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/shadow-vault/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Submission failed');

      setToast(data?.message || 'Saved.');
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
      setTouched({});
    } catch (err: any) {
      setToast(err?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // class + aria helpers (uses debounced errors for display)
  const fieldClass = (key: keyof FormState) => {
    const hasErr = !!debouncedErrors[key] && touched[key];
    const shake = shakeField === key;
    return [
      styles.input,
      hasErr ? styles.inputError : '',
      shake ? styles.shake : '',
    ].filter(Boolean).join(' ');
  };

  const fieldA11y = (key: keyof FormState) => {
    const hasErr = !!debouncedErrors[key] && touched[key];
    return {
      'aria-invalid': hasErr || undefined,
      'aria-describedby': hasErr ? `${key}-error` : undefined,
      onAnimationEnd: () => {
        if (shakeField === key) setShakeField(null);
      },
    };
  };

  const fieldErrorIfTouched = (key: keyof FormState) =>
    touched[key] && debouncedErrors[key] ? (
      <span id={`${key}-error`} className={styles.errorText}>
        {debouncedErrors[key]}
      </span>
    ) : null;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {/* Contact */}
      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onChange}
            onBlur={onBlur}
            className={fieldClass('name')}
            autoComplete="name"
            required
            {...fieldA11y('name')}
          />
          {fieldErrorIfTouched('name')}
        </div>

        <div>
          <label className={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            className={fieldClass('email')}
            autoComplete="email"
            required
            {...fieldA11y('email')}
          />
          {fieldErrorIfTouched('email')}
        </div>

        <div>
          <label className={styles.label} htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={onChange}
            onBlur={onBlur}
            className={styles.input}
            autoComplete="tel"
            placeholder="Optional"
            {...fieldA11y('phone')}
          />
        </div>
      </div>

      {/* Request details */}
      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor="desiredGem">Desired Gem</label>
          <input
            id="desiredGem"
            name="desiredGem"
            value={form.desiredGem}
            onChange={onChange}
            onBlur={onBlur}
            className={fieldClass('desiredGem')}
            placeholder="e.g., Black Diamond"
            required
            {...fieldA11y('desiredGem')}
          />
          {fieldErrorIfTouched('desiredGem')}
        </div>

        <div>
          <label className={styles.label} htmlFor="format">Format</label>
          <select
            id="format"
            name="format"
            value={form.format}
            onChange={onChange}
            onBlur={onBlur}
            className={fieldClass('format')}
            required
            {...fieldA11y('format')}
          >
            <option value="" disabled>Choose a format…</option>
            <option value="raw">Raw (uncut)</option>
            <option value="faceted">Faceted (brilliance)</option>
            <option value="cabochon">Cabochon (cab, domed)</option>
            <option value="tumbled">Tumbled (smooth pebble)</option>
            <option value="other">Other / Describe in notes</option>
          </select>
          {fieldErrorIfTouched('format')}
        </div>

        <div>
          <label className={styles.label} htmlFor="size">Size</label>
          <input
            id="size"
            name="size"
            value={form.size}
            onChange={onChange}
            onBlur={onBlur}
            className={styles.input}
            placeholder={compact ? 'mm, carats, or dimensions' : 'e.g., 12×8 mm oval, 3 ct, or custom dimensions'}
            {...fieldA11y('size')}
          />
        </div>

        <div>
          <label className={styles.label} htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            name="quantity"
            value={form.quantity}
            onChange={onChange}
            onBlur={onBlur}
            className={fieldClass('quantity')}
            placeholder="e.g., 1"
            inputMode="numeric"
            pattern="[0-9]*"
            {...fieldA11y('quantity')}
          />
          {fieldErrorIfTouched('quantity')}
        </div>
      </div>

      <div>
        <label className={styles.label} htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={compact ? 4 : 6}
          value={form.notes}
          onChange={onChange}
          onBlur={onBlur}
          className={styles.input}
          placeholder="Origin, cut style, setting, budget, timeline, etc."
          {...fieldA11y('notes')}
        />
      </div>

      {toast && <p className={styles.successText}>{toast}</p>}

      <button className={styles.submit} disabled={submitting} type="submit">
        {submitting ? 'Submitting…' : 'Submit Request'}
      </button>

      {Object.values(touched).some(Boolean) && Object.keys(debouncedErrors).length > 0 && (
        <p className={styles.formErrorSummary} role="alert">
          Please fix the highlighted fields before submitting.
        </p>
      )}
    </form>
  );
}