// app/admin/settings/page.tsx
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { getSettings } from '@/lib/settings';
import AdminNav from '../AdminNav';
import SettingsForm from './settings-form';

export default async function AdminSettingsPage() {
  await requireElderServer();
  const settings = await getSettings();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <AdminNav current="settings" />

        <h1 className="text-2xl font-semibold mt-6">Council Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configure notification targets and email provider without redeploys.
        </p>

        <div className="mt-8">
          <SettingsForm initial={settings} />
        </div>
      </div>
    </main>
  );
}