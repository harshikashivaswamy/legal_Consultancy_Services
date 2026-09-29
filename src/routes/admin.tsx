import { Outlet, createFileRoute } from "@tanstack/react-router";
import {
  BarChart2,
  CheckSquare,
  LayoutDashboard,
  Settings,
  Users,
  ShieldAlert,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

const ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Advocate Approvals", to: "/admin/approvals", icon: CheckSquare },
  { label: "Manage Lawyers", to: "/admin/lawyers", icon: Users },
  { label: "Disputes & Reports", to: "/admin/disputes", icon: ShieldAlert },
  { label: "Transactions", to: "/admin/transactions", icon: BarChart2 },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export const Route = createFileRoute("/admin")({
  component: () => (
    <DashboardShell role="admin" items={ITEMS}>
      <Outlet />
    </DashboardShell>
  ),
});
