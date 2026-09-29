import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { NyayaAIWidget } from "@/components/ai/NyayaAI";
import { GlobalSearchBar } from "@/components/dashboard/GlobalSearchBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROLE_LABEL, useAuth, type Role } from "@/lib/auth";
import { getNotifications } from "@/lib/database";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; to: string; icon: LucideIcon };

function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active = pathname === item.to || (item.to !== items[0]!.to && pathname.startsWith(`${item.to}/`));
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  role,
  items,
  children,
}: {
  role: Role;
  items: NavItem[];
  children: ReactNode;
}) {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Only a signed-in user whose account role matches this portal may see it.
  const authorized = Boolean(user && user.role === role);

  useEffect(() => {
    if (ready && !authorized) void navigate({ to: "/auth/$role/login", params: { role } });
  }, [ready, authorized, role, navigate]);

  // Custom role-based notification states
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; time: string; read: boolean }>>([]);

  useEffect(() => {
    let cancelled = false;
    void getNotifications(role, user?.id)
      .then((rows) => {
        if (cancelled) return;
        setNotifications(
          rows.slice(0, 10).map((n) => {
            const created = new Date(n.created_at);
            return {
              id: n.id,
              title: n.title,
              time: Number.isNaN(created.getTime()) ? "" : formatDistanceToNow(created, { addSuffix: true }),
              read: n.read,
            };
          }),
        );
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, [role, user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const initials = (user?.name ?? "NC")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!ready || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar lg:flex">
        <div className="px-5 py-5">
          <Link to="/">
            <Logo inverted />
          </Link>
          <p className="mt-3 inline-flex rounded-full bg-sidebar-accent px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-primary">
            {ROLE_LABEL[role]} Portal
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-6">
          <SidebarNav items={items} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => {
              signOut();
              void navigate({ to: "/" });
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 glass">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0">
                <div className="px-5 py-5">
                  <Logo inverted />
                </div>
                <SidebarNav items={items} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {role !== "lawyer" && (
              <div className="flex-1 max-w-md">
                <GlobalSearchBar role={role} />
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-2 size-2 rounded-full bg-accent animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-2xl p-4 shadow-lift space-y-3" align="end">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-xs">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-primary font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-2 rounded-xl text-xs space-y-1 transition-colors",
                            n.read ? "bg-background" : "bg-primary/5 border border-primary/10"
                          )}
                        >
                          <p className={cn("leading-tight", !n.read && "font-semibold")}>{n.title}</p>
                          <span className="text-[9px] text-muted-foreground block">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2.5 rounded-full border bg-card py-1 pl-1 pr-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden leading-tight sm:block">
                  <p className="text-xs font-semibold capitalize">{user?.name ?? "Guest"}</p>
                  <p className="text-[11px] text-muted-foreground">{ROLE_LABEL[role]}</p>
                </div>
              </div>
            </div>
          </div>
        </header>


        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      <NyayaAIWidget />
    </div>
  );
}