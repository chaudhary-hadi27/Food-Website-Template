"use client";

import { useEffect, useState, useCallback } from "react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import type { AdminRole, AdminUser } from "@/types";

const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  admin: "Full control — menu, orders, reservations, coupons, staff, and settings.",
  manager: "Can manage menu, orders, reservations, and coupons. Cannot manage staff or site settings.",
  kitchen: "Can view orders and update their status only. No access to pricing or settings.",
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("kitchen");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    if (res.ok) {
      const data = await res.json();
      setStaff(data.staff ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add staff member.");
      setSaving(false);
      return;
    }
    setEmail("");
    setPassword("");
    setRole("kitchen");
    setSaving(false);
    load();
  }

  async function updateRole(id: number, newRole: AdminRole) {
    const res = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.error || "Failed to update role.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this staff member's access?")) return;
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.error || "Failed to remove staff member.");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-[var(--font-display)] text-2xl font-bold">Staff & Roles</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Control who can access the dashboard and what they can do.
      </p>

      <form onSubmit={handleAdd} className="mt-6 space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-sm font-semibold">Add Staff Member</h2>
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Temporary Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
          <option value="kitchen">Kitchen Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </Select>
        <p className="text-xs text-[var(--color-text-secondary)]">{ROLE_DESCRIPTIONS[role]}</p>
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        <Button type="submit" loading={saving}>Add Staff Member</Button>
      </form>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Loading staff...</p>
        ) : (
          staff.map((member) => (
            <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <div>
                <p className="text-sm font-medium">{member.email}</p>
                <Badge variant="neutral" className="mt-1 capitalize">{member.role}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) => updateRole(member.id, e.target.value as AdminRole)}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <Button size="sm" variant="danger" onClick={() => handleDelete(member.id)}>Remove</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
