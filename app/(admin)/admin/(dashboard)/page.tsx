import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { DashboardOverview } from "@/components/features/admin/dashboard-overview";
import { PageHeader } from "@/components/ui/layout-primitives";

export default async function AdminDashboardPage() {
  // Server-rendered with "today" (the default range) so the dashboard has real numbers
  // on first paint — the client component takes over from here when the range changes.
  const initialData = await getDashboardAnalytics("today");

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Here's what's happening." />
      <div className="mt-6">
        <DashboardOverview initialData={initialData} />
      </div>
    </div>
  );
}
