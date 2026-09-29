import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Briefcase, Check, LayoutDashboard, ShieldCheck, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROLE_HOME, ROLE_LABEL, useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/get-started")({
  head: () => ({
    meta: [
      { title: "Choose your portal — Legal Consultancy Service" },
      {
        name: "description",
        content:
          "Continue as a client, an advocate or an administrator to access the right Legal Consultancy Service workspace.",
      },
      { property: "og:title", content: "Choose your portal — Legal Consultancy Service" },
      {
        property: "og:description",
        content: "Client, Lawyer or Admin — pick the portal that fits how you use Legal Consultancy Service.",
      },
    ],
  }),
  component: GetStarted,
});

const ROLES: {
  role: Role;
  title: string;
  icon: typeof UserRound;
  blurb: string;
  perks: string[];
}[] = [
  {
    role: "client",
    title: "Client Portal",
    icon: UserRound,
    blurb: "For individuals and businesses seeking legal help.",
    perks: ["Find lawyers", "Book appointments", "Manage documents", "AI Assistant"],
  },
  {
    role: "lawyer",
    title: "Lawyer Portal",
    icon: Briefcase,
    blurb: "For advocates growing a modern practice.",
    perks: ["Manage profile", "Availability calendar", "Appointment management", "Earnings"],
  },
  {
    role: "admin",
    title: "Admin Portal",
    icon: ShieldCheck,
    blurb: "For the Legal Consultancy Service operations team.",
    perks: ["User management", "Lawyer verification", "Reports", "Analytics"],
  },
];

function GetStarted() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-hero py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo inverted />
          </Link>
          {user && (
            <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 gap-2">
              <Link to={ROLE_HOME[user.role]}>
                <LayoutDashboard className="size-4" />
                Go to {ROLE_LABEL[user.role]} Dashboard
              </Link>
            </Button>
          )}
        </div>

        {user && (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-white/15 bg-white/10 p-4 text-center text-white backdrop-blur-md">
            <p className="text-sm">
              You are currently signed in as <span className="font-semibold capitalize">{user.name}</span> ({ROLE_LABEL[user.role]}).
            </p>
          </div>
        )}

        <div className="mx-auto mt-10 max-w-2xl text-center">
          <h1 className="text-3xl text-[oklch(0.98_0.004_250)] sm:text-4xl">
            How would you like to continue?
          </h1>
          <p className="mt-3 text-[oklch(0.85_0.02_250)]">
            Each portal is tailored to what you need to do. You can always switch later.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
            >
              <Card className="glass h-full gap-0 rounded-3xl p-7 text-left shadow-lift transition-transform hover:-translate-y-1.5">
                <span className="grid size-12 place-items-center rounded-2xl bg-gold">
                  <r.icon className="size-6 text-[oklch(0.22_0.045_260)]" />
                </span>
                <h2 className="mt-5 text-xl font-semibold">{r.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{r.blurb}</p>
                <ul className="mt-5 space-y-2.5">
                  {r.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-sm">
                      <span className="grid size-5 place-items-center rounded-full bg-accent/20">
                        <Check className="size-3 text-accent-foreground" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-7 w-full rounded-xl">
                  <Link to="/auth/$role/login" params={{ role: r.role }}>
                    Continue <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}