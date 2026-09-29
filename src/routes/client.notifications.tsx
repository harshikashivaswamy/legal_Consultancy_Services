import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  FileText,
  Trash2,
  Check,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/dashboard/primitives";
import { toast } from "sonner";

export const Route = createFileRoute("/client/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center — Legal Consultancy Service" },
      { name: "description", content: "Stay updated on scheduled consultations, document reviews, and payment receipts." },
    ],
  }),
  component: ClientNotificationsPage,
});

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: "consultation" | "document" | "payment" | "security";
  timestamp: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Document Accepted for Review",
    description: "Advocate Ananya Iyer has accessed and accepted 'Agreement_Draft.pdf' for your upcoming consultation.",
    category: "document",
    timestamp: "10 minutes ago",
    read: false,
  },
  {
    id: "n-2",
    title: "Consultation Hearing Reminder",
    description: "Your video consultation with Adv. Rajesh Sharma starts tomorrow at 10:30 AM IST. Encrypted room is ready.",
    category: "consultation",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "n-3",
    title: "Escrow Payment Received & Locked",
    description: "Transaction reference TXN_984210 for ₹3,186 was settled to the multi-sig Escrow vault successfully.",
    category: "payment",
    timestamp: "Yesterday",
    read: true,
  },
  {
    id: "n-4",
    title: "Security Shield Verification",
    description: "Two-Factor verification enabled. Your client session is encrypted with 256-bit AES protocol.",
    category: "security",
    timestamp: "3 days ago",
    read: true,
  },
];

function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [tab, setTab] = useState<"ALL" | "UNREAD" | "PAYMENTS" | "DOCUMENTS">("ALL");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.info("Notification removed.");
  };

  const getCategoryIcon = (category: NotificationItem["category"]) => {
    switch (category) {
      case "consultation":
        return <Calendar className="size-4 text-blue-500" />;
      case "document":
        return <FileText className="size-4 text-purple-500" />;
      case "payment":
        return <CreditCard className="size-4 text-emerald-500" />;
      case "security":
        return <ShieldCheck className="size-4 text-amber-500" />;
    }
  };

  const filtered = notifications.filter((n) => {
    if (tab === "UNREAD") return !n.read;
    if (tab === "PAYMENTS") return n.category === "payment";
    if (tab === "DOCUMENTS") return n.category === "document";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Notification Center"
          subtitle="Real-time alerts regarding your hearings, document status, and escrow releases."
        />
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="rounded-xl text-xs gap-1.5 font-semibold"
            >
              <Check className="size-3.5" /> Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        {(["ALL", "UNREAD", "PAYMENTS", "DOCUMENTS"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "outline"}
            className="rounded-xl text-xs font-semibold"
            onClick={() => setTab(t)}
          >
            {t === "ALL"
              ? `All (${notifications.length})`
              : t === "UNREAD"
              ? `Unread (${unreadCount})`
              : t}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      <SectionCard title="Recent Activity & Notifications">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Bell className="size-10 mx-auto opacity-30 mb-2" />
            <p className="font-semibold text-foreground text-sm">No notifications to display</p>
            <p className="text-xs mt-1">You're all caught up with your consultation schedules and documents.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`flex items-start justify-between gap-4 py-4 px-3 rounded-2xl transition-colors ${
                  !n.read ? "bg-primary/5 border border-primary/10" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-background border shadow-xs shrink-0 mt-0.5">
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs ${!n.read ? "font-bold text-foreground" : "font-medium text-foreground/90"}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.description}</p>
                    <span className="text-[10px] text-muted-foreground/70 block pt-0.5">{n.timestamp}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNotification(n.id)}
                  className="size-8 text-muted-foreground hover:text-destructive rounded-lg shrink-0"
                  aria-label="Delete notification"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
