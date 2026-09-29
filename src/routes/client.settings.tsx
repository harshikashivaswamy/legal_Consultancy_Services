import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  Globe,
  Bell,
  Save,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, SectionCard } from "@/components/dashboard/primitives";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/client/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — Legal Consultancy Service" },
      { name: "description", content: "Manage your client profile, contact details, security and notification preferences." },
    ],
  }),
  component: ClientSettingsPage,
});

function ClientSettingsPage() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "Siddharth Desai");
  const [email, setEmail] = useState(user?.email || "client@legalconsultancy.in");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [city, setCity] = useState("Mumbai");
  const [state, setState] = useState("Maharashtra");

  // Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [language, setLanguage] = useState("English");

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Profile preferences updated successfully!");
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Account & Security Settings"
          subtitle="Manage your personal profile, communication channels, and account security."
        />
        <Badge variant="outline" className="text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 self-start">
          <ShieldCheck className="size-4 text-emerald-500" /> AES-256 Encrypted Session
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Profile & Contact */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Personal Information">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Full Legal Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">Mobile Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isSaving} className="rounded-xl text-xs font-bold gap-2 shadow-soft">
                  <Save className="size-3.5" />
                  {isSaving ? "Saving changes..." : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Consultation & Regional Preferences">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div>
                  <p className="text-xs font-bold text-foreground">Preferred Communication Language</p>
                  <p className="text-[11px] text-muted-foreground">Used for matching advocate language filters.</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-xl border bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिन्दी (Hindi)</option>
                  <option value="Marathi">मराठी (Marathi)</option>
                  <option value="Bengali">বাংলা (Bengali)</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                  <option value="Telugu">తెలుగు (Telugu)</option>
                  <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div>
                  <p className="text-xs font-bold text-foreground">Email Hearing Notifications</p>
                  <p className="text-[11px] text-muted-foreground">Receive reminders 24 hours & 15 minutes before consultations.</p>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-bold text-foreground">SMS & WhatsApp Alerts</p>
                  <p className="text-[11px] text-muted-foreground">Instant OTP codes and consultation chamber joining links.</p>
                </div>
                <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Col: Security & Privacy */}
        <div className="space-y-6">
          <SectionCard title="Security & Authentication">
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border bg-secondary/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <KeyRound className="size-4 text-primary" /> Two-Factor Authentication
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Requires 6-digit OTP verification on your mobile when logging in from new devices.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {twoFactor ? "Enabled" : "Disabled"}
                  </span>
                  <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-secondary/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Lock className="size-4 text-emerald-500" /> Advocate-Client Privilege
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  All messages, consultation recordings, and uploaded evidence documents are protected under Section 126 of the Indian Evidence Act.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => toast.info("Password reset instructions sent to your email.")}
                className="w-full rounded-xl text-xs font-semibold"
              >
                Change Account Password
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
