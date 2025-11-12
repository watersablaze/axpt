import { requireElderServer } from '@/lib/auth/requireElderServer';
import ContractsScroll from './ContractsScroll';

export default async function ContractsPage() {
  const elder = await requireElderServer();

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <ContractsScroll isElder={!!elder} />
    </div>
  );
}