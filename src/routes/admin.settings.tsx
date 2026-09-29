import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, ShieldCheck, Mail, ShieldAlert, Sparkles } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin Portal" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  // Local state for admin configurations
  const [platformFee, setPlatformFee] = useState("5");
  const [escrowHoldDays, setEscrowHoldDays] = useState("7");
  const [supportEmail, setSupportEmail] = useState("support@legalconsultancy.in");
  const [allowGuest, setAllowGuest] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [taxRate, setTaxRate] = useState("18");

  useEffect(() => {
    const saved = localStorage.getItem("admin.global.settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.platformFee) setPlatformFee(parsed.platformFee);
        if (parsed.escrowHoldDays) setEscrowHoldDays(parsed.escrowHoldDays);
        if (parsed.supportEmail) setSupportEmail(parsed.supportEmail);
        if (parsed.allowGuest !== undefined) setAllowGuest(parsed.allowGuest);
        if (parsed.maintenanceMode !== undefined) setMaintenanceMode(parsed.maintenanceMode);
        if (parsed.taxRate) setTaxRate(parsed.taxRate);
      } catch (e) {
        console.warn("Failed to load admin settings", e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      platformFee,
      escrowHoldDays,
      supportEmail,
      allowGuest,
      maintenanceMode,
      taxRate,
    };
    localStorage.setItem("admin.global.settings", JSON.stringify(data));
    toast.success("Admin configuration options updated successfully!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="size-6 text-primary" /> Admin Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage platform convenience fees, escrow hold periods, and global configurations.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
        {/* Fee & Escrow Configuration */}
        <Card className="rounded-2xl p-6 shadow-soft space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="size-4.5 text-primary" /> Fee & Escrow Rules
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="platformFee">Platform Fee (%)</Label>
              <Input
                id="platformFee"
                type="number"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                min="0"
                max="100"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">GST/Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="escrowHoldDays">Escrow Hold Period (Days)</Label>
            <Input
              id="escrowHoldDays"
              type="number"
              value={escrowHoldDays}
              onChange={(e) => setEscrowHoldDays(e.target.value)}
              min="1"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Number of days funds are locked after session completion before release.
            </p>
          </div>
        </Card>

        {/* Global Configurations */}
        <Card className="rounded-2xl p-6 shadow-soft space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="size-4.5 text-primary" /> Global Platform Settings
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="supportEmail">Official Support Email</Label>
            <div className="relative">
              <Input
                id="supportEmail"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="pl-9"
                required
              />
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Allow Guest Bookings</Label>
                <p className="text-[11px] text-muted-foreground">
                  Allow clients to search advocates without a registered account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllowGuest(!allowGuest)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-all ${
                  allowGuest ? "bg-primary justify-end" : "bg-secondary justify-start"
                }`}
              >
                <span className="bg-background size-4 rounded-full shadow-sm" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold text-destructive">Maintenance Mode</Label>
                <p className="text-[11px] text-muted-foreground">
                  Put the platform offline for updates and database migration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-all ${
                  maintenanceMode ? "bg-destructive justify-end" : "bg-secondary justify-start"
                }`}
              >
                <span className="bg-background size-4 rounded-full shadow-sm" />
              </button>
            </div>
          </div>

          <div className="pt-2.5 flex items-center justify-between border-t">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="size-3.5 text-amber-500" /> Apply caution before updating rules
            </span>
            <Button type="submit" className="rounded-xl px-5 font-bold shadow-soft">
              Apply Config
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
