import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { AdminSidebar } from "@/components/features/admin/admin-sidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface)] lg:flex-row">
      <AdminSidebar email={session.email} role={session.role} />
      <main className="flex-1 overflow-y-auto p-5 sm:p-8">{children}</main>
    </div>
  );
}
