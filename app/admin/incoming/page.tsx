import { Suspense } from "react";
import AdminWorkDesk from "@/components/admin/incoming/AdminWorkDesk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function IncomingAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ lane?: string; page?: string; item?: string }>;
}) {
  return (
    <Suspense fallback={
      <p role="status" className="py-8 text-sm text-neutral-400">
        Loading incoming work…
      </p>
    }>
      <AdminWorkDesk searchParams={searchParams} />
    </Suspense>
  );
}
