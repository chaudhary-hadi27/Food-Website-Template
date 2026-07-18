import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { AdminSidebar } from "@/components/features/admin/admin-sidebar";
import { getSiteSettings } from "@/lib/get-settings";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const settings = await getSiteSettings();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface)] flex-col lg:flex-row">
      <AdminSidebar email={session.email} role={session.role} restaurantName={settings.restaurant_name} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}
