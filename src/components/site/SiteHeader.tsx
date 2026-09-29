import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Moon, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ROLE_HOME, ROLE_LABEL, useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Services", to: "/#services" },
  { label: "About", to: "/#about" },
  { label: "How It Works", to: "/#how" },
  { label: "Testimonials", to: "/#testimonials" },
  { label: "Contact", to: "/#contact" },
  { label: "FAQ", to: "/#faq" },
];

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const homePath = user ? ROLE_HOME[user.role] : "/get-started";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled ? "glass shadow-soft" : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {user ? (
            // Logged in: Show Dashboard & Sign out instead of Sign in / Get Started
            <div className="hidden sm:flex items-center gap-2">
              <Button asChild className="rounded-full px-4 gap-2 shadow-soft">
                <Link to={homePath}>
                  <Avatar className="size-5">
                    <AvatarFallback className="bg-primary-foreground/20 text-[10px] text-primary-foreground font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span>{ROLE_LABEL[user.role]} Dashboard</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  signOut();
                  void navigate({ to: "/" });
                }}
                className="text-muted-foreground hover:text-destructive gap-1.5"
                title="Sign out"
              >
                <LogOut className="size-4" />
                <span className="text-xs">Sign out</span>
              </Button>
            </div>
          ) : (
            // Not logged in: Show Sign in & Get Started
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/get-started">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full px-5">
                <Link to="/get-started">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Logo />
                </div>
                <div className="flex flex-col gap-3">
                  {NAV.map((item) => (
                    <a
                      key={item.label}
                      href={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="text-base font-medium py-1.5 hover:text-accent"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 px-1 py-1">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <p className="text-xs font-semibold capitalize">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground">{ROLE_LABEL[user.role]}</p>
                      </div>
                    </div>
                    <Button asChild className="w-full rounded-xl gap-2">
                      <Link to={homePath} onClick={() => setMobileOpen(false)}>
                        <LayoutDashboard className="size-4" />
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        signOut();
                        setMobileOpen(false);
                        void navigate({ to: "/" });
                      }}
                      className="w-full rounded-xl text-destructive hover:bg-destructive/10 gap-2"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full rounded-xl">
                      <Link to="/get-started" onClick={() => setMobileOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild className="w-full rounded-xl">
                      <Link to="/get-started" onClick={() => setMobileOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}