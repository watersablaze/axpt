// app/account/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

export default async function DashboardRedirectPage() {
  const session = await getCurrentUser();

  // Redirect if no session or tier present
 if (!session?.tier) {
  redirect('/account/upgrade');
}
const tier = session.tier.toLowerCase();
redirect(`/account/dashboard/${tier}`);
}