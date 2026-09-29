import { Outlet, createFileRoute } from "@tanstack/react-router";
import {
  BarChart2,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

const ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/lawyer", icon: LayoutDashboard },
  { label: "My Schedule", to: "/lawyer/schedule", icon: CalendarCheck },
  { label: "Clients", to: "/lawyer/clients", icon: Users },
  { label: "Documents", to: "/lawyer/documents", icon: FileText },
  { label: "Earnings", to: "/lawyer/earnings", icon: BarChart2 },
  { label: "Settings", to: "/lawyer/settings", icon: Settings },
];

export const Route = createFileRoute("/lawyer")({
  component: () => (
    <DashboardShell role="lawyer" items={ITEMS}>
      <Outlet />
    </DashboardShell>
  ),
});
