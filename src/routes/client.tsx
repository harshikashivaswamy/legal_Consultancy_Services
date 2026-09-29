import { Outlet, createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CalendarCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Star,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

const ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/client", icon: LayoutDashboard },
  { label: "Find Lawyers", to: "/client/lawyers", icon: Search },
  { label: "Bookings", to: "/client/bookings", icon: CalendarCheck },
  { label: "Payments", to: "/client/payments", icon: CreditCard },
  { label: "Documents", to: "/client/documents", icon: FileText },
  { label: "Reviews", to: "/client/reviews", icon: Star },
  { label: "Notifications", to: "/client/notifications", icon: Bell },
  { label: "Settings", to: "/client/settings", icon: Settings },
];

export const Route = createFileRoute("/client")({
  component: () => (
    <DashboardShell role="client" items={ITEMS}>
      <Outlet />
    </DashboardShell>
  ),
});