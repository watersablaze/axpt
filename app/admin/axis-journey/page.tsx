import { requireElderServer } from '@/lib/auth/requireElderServer';
import AxisJourneySubscriberTable from './AxisJourneySubscriberTable';

export default async function AxisJourneyAdminPage() {
  await requireElderServer();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-white">
        🌍 Axis Journey Subscribers
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        Manage and monitor all Axis Journey signups.
      </p>

      <AxisJourneySubscriberTable />
    </div>
  );
}