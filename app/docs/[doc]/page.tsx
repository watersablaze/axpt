import { notFound } from 'next/navigation';
import { verifyToken } from '@/lib/token/verifyToken';
import { TokenPayloadSafeSchema } from '@/lib/token/tokenSchema';
import SecureScroll from '@/components/vault/SecureScroll';

interface DocsPageProps {
  params: { doc?: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function DocsPage({ params, searchParams }: DocsPageProps) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : undefined;
  const docParam = params?.doc;

  if (!docParam) {
    console.error('[AXPT] ❌ Missing `params.doc` — invalid route');
    return notFound();
  }

  const requestedKey = docParam.toLowerCase().trim();
  console.log('[AXPT] 🔎 Requested doc:', requestedKey);

  if (!token) {
    console.warn('[AXPT] ❌ Missing token in searchParams');
    return notFound();
  }

  const { valid, payload } = await verifyToken(token);

  if (!valid || !payload) {
    console.warn('[AXPT] ❌ Token failed validation or missing payload');
    return notFound();
  }

  const parsed = TokenPayloadSafeSchema.safeParse(payload);
  if (!parsed.success) {
    console.warn('[AXPT] ❌ Token payload structure invalid:', parsed.error.format());
    return notFound();
  }

  const allowedDocs = parsed.data.docs.map((d) => d.toLowerCase().trim());
  console.log('[AXPT] 📜 Allowed in token:', allowedDocs);

  if (!allowedDocs.includes(requestedKey)) {
    console.warn('[AXPT] 🚫 Access denied for:', requestedKey);
    return notFound();
  }

  console.log('[AXPT] ✅ Access granted. Rendering SecureScroll');

  return (
    <SecureScroll
      params={{ doc: requestedKey }}
      searchParams={{ token }}
    />
  );
}