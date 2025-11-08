import { requireElderServer } from '@/lib/auth/requireElderServer';
import EmailLogTable from './EmailLogTable';

export default async function AdminEmailPage() {
  await requireElderServer();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-white">📬 Email Activity</h1>
      <EmailLogTable />
    </div>
  );
}