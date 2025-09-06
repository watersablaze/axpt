'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

type Props = {
  statuses: readonly string[];
  categories: readonly string[];
};

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  category: z.string(),
  status: z.string(),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function Form({ statuses, categories }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'ENERGY');
  const [status, setStatus] = useState(statuses.includes('ACTIVE') ? 'ACTIVE' : statuses[0] ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // slug availability
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugCheckAbort = useRef<AbortController | null>(null);

  const suggestedSlug = useMemo(() => slugify(title), [title]);
  const effectiveSlug = slug.length ? slugify(slug) : suggestedSlug;

  // Debounced slug check with abort
  useEffect(() => {
    setSlugAvailable(null);
    setMsg(null);
    if (!effectiveSlug) return;

    const t = setTimeout(async () => {
      try {
        // cancel previous request if any
        slugCheckAbort.current?.abort();
        const ac = new AbortController();
        slugCheckAbort.current = ac;

        setCheckingSlug(true);
        const r = await fetch(
          `/api/admin/initiatives/slug-available?slug=${encodeURIComponent(effectiveSlug)}`,
          { cache: 'no-store', signal: ac.signal }
        );
        const j = (await r.json()) as { ok: boolean; available?: boolean; error?: string };
        if (!r.ok || !j.ok) throw new Error(j.error || 'Slug check failed');
        setSlugAvailable(Boolean(j.available));
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setSlugAvailable(null);
          setMsg(e?.message || 'Could not verify slug availability');
        }
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => {
      clearTimeout(t);
      slugCheckAbort.current?.abort();
    };
  }, [effectiveSlug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const body = {
      slug: effectiveSlug,
      title: title.trim(),
      summary: summary.trim(),
      category,
      status,
    };

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      setMsg(parsed.error.issues.map(i => i.message).join(' · '));
      return;
    }
    if (slugAvailable === false) {
      setMsg('That slug is already in use.');
      return;
    }

    startTransition(async () => {
      try {
        const r = await fetch('/api/admin/initiatives', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to create initiative');
        router.push(`/admin/initiatives/${body.slug}`);
      } catch (err: any) {
        setMsg(err?.message || 'Error creating initiative.');
      }
    });
  }

  const slugPreview = effectiveSlug ? `/admin/initiatives/${effectiveSlug}` : '/admin/initiatives/…';

  const disableSubmit =
    isPending ||
    checkingSlug ||
    !title.trim() ||
    !summary.trim() ||
    !effectiveSlug ||
    slugAvailable === false;

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm mb-1" htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"
          placeholder="Protium Energy Initiative"
        />
      </div>

      {/* Slug + helper */}
      <div>
        <label className="block text-sm mb-1" htmlFor="slug">Slug</label>
        <input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"
          placeholder={suggestedSlug || 'protium-energy-initiative'}
          aria-invalid={slugAvailable === false}
          aria-describedby="slug-help"
        />
        <p id="slug-help" className="text-xs text-zinc-500 mt-1">
          URL: <code className="text-zinc-300">{slugPreview}</code>{' '}
          {checkingSlug && <span className="text-zinc-400">· checking…</span>}
          {slugAvailable === true && <span className="text-green-400">· available</span>}
          {slugAvailable === false && <span className="text-red-400">· taken</span>}
        </p>
      </div>

      {/* Category + Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div>
        <label className="block text-sm mb-1" htmlFor="summary">Summary</label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          rows={8}
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"
          placeholder="Briefly describe the intent, scope, and outcomes."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          disabled={disableSubmit}
          className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-purple-500/60 disabled:opacity-60"
          type="submit"
          aria-busy={isPending}
        >
          {isPending ? 'Saving…' : 'Create'}
        </button>
        {msg && <span className="text-sm text-zinc-400">{msg}</span>}
      </div>
    </form>
  );
}