import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Settings,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/lawyer/settings")({
  head: () => ({ meta: [{ title: "Settings — Lawyer Dashboard" }] }),
  component: LawyerSettings,
});

// ─── State Bar Council registry ──────────────────────────────────────────────
const STATE_BAR_COUNCILS: { label: string; code: string }[] = [
  { label: "Bar Council of Maharashtra & Goa",    code: "MAH" },
  { label: "Bar Council of Delhi",                code: "DL"  },
  { label: "Karnataka State Bar Council",          code: "KA"  },
  { label: "Bar Council of West Bengal",           code: "WB"  },
  { label: "Bar Council of Tamil Nadu & Puducherry", code: "TN" },
  { label: "Bar Council of Uttar Pradesh",         code: "UP"  },
  { label: "Bar Council of Gujarat",               code: "GJ"  },
  { label: "Bar Council of Rajasthan",             code: "RJ"  },
  { label: "Bar Council of Punjab & Haryana",      code: "PH"  },
  { label: "Bar Council of Andhra Pradesh",        code: "AP"  },
  { label: "Bar Council of Telangana",             code: "TS"  },
  { label: "Bar Council of Kerala",                code: "KL"  },
  { label: "Bar Council of Madhya Pradesh",        code: "MP"  },
  { label: "Bar Council of Odisha",                code: "OD"  },
  { label: "Bar Council of Bihar",                 code: "BR"  },
  { label: "Bar Council of Chhattisgarh",          code: "CG"  },
  { label: "Bar Council of Jharkhand",             code: "JH"  },
  { label: "Bar Council of Uttarakhand",           code: "UK"  },
  { label: "Bar Council of Himachal Pradesh",      code: "HP"  },
  { label: "Bar Council of Haryana",               code: "HR"  },
  { label: "Bar Council of Assam",                 code: "AS"  },
  { label: "Bar Council of India (BCI)",           code: "BCI" },
];

const SPECIALIZATIONS = [
  "Criminal Law",
  "Family Law",
  "Corporate & Startup",
  "Property & Real Estate",
  "Intellectual Property",
  "Taxation Law",
  "Civil Litigation",
  "Cyber Crime",
  "Constitutional Law",
];

// ─── Strict 3-part bar validation: STATECODE/NUMBER/YEAR ─────────────────────
function validateBarNumber(
  num: string,
  expectedCode: string
): { valid: boolean; reason?: string } {
  const clean = num.trim().toUpperCase();
  if (!clean) return { valid: false, reason: "Please enter your enrolment number." };

  const parts = clean.split("/");
  if (parts.length !== 3) {
    return {
      valid: false,
      reason: `Format must be exactly ${expectedCode}/NUMBER/YEAR — e.g. ${expectedCode}/1234/2018`,
    };
  }

  const [statePart, numPart, yearPart] = parts as [string, string, string];

  if (statePart !== expectedCode) {
    return {
      valid: false,
      reason: `State code must match your selected Bar Council — expected "${expectedCode}", got "${statePart}"`,
    };
  }

  if (!/^\d{1,6}$/.test(numPart)) {
    return { valid: false, reason: "Enrolment number must be 1–6 digits (e.g. 4819)" };
  }

  const year = parseInt(yearPart, 10);
  const currentYear = new Date().getFullYear();
  if (isNaN(year) || String(year).length !== 4 || year < 1950 || year > currentYear) {
    return {
      valid: false,
      reason: `Year must be a 4-digit number between 1950 and ${currentYear}`,
    };
  }

  return { valid: true };
}

function LawyerSettings() {
  const { user } = useAuth();

  // Profile fields
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("Criminal Law");
  const [fee, setFee] = useState("1500");
  const [experience, setExperience] = useState("8");
  const [bio, setBio] = useState(
    "Dedicated advocate specializing in representation and legal consulting services."
  );

  // Bar Council fields
  const [stateBarLabel, setStateBarLabel] = useState(STATE_BAR_COUNCILS[0]!.label);
  const [barNumber, setBarNumber] = useState("");
  const [barVerified, setBarVerified] = useState(false);
  const [barVerifyLoading, setBarVerifyLoading] = useState(false);
  const [barVerifyError, setBarVerifyError] = useState<string | null>(null);

  // Schedule fields
  const [monday, setMonday] = useState(true);
  const [tuesday, setTuesday] = useState(true);
  const [wednesday, setWednesday] = useState(true);
  const [thursday, setThursday] = useState(true);
  const [friday, setFriday] = useState(true);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("17:00");

  // Derived expected code from selected council
  const expectedCode =
    STATE_BAR_COUNCILS.find((b) => b.label === stateBarLabel)?.code ?? "";

  // ─── Load saved settings ────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.name) setName(user.name);
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem(`lawyer.settings.${user?.id || "default"}`)
        : null;
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.name) setName(p.name);
        if (p.specialization) setSpecialization(p.specialization);
        if (p.fee) setFee(p.fee);
        if (p.experience) setExperience(p.experience);
        if (p.barNumber) setBarNumber(p.barNumber.toUpperCase());
        if (p.stateBarLabel) setStateBarLabel(p.stateBarLabel);
        if (p.bio) setBio(p.bio);
        if (p.monday !== undefined) setMonday(p.monday);
        if (p.tuesday !== undefined) setTuesday(p.tuesday);
        if (p.wednesday !== undefined) setWednesday(p.wednesday);
        if (p.thursday !== undefined) setThursday(p.thursday);
        if (p.friday !== undefined) setFriday(p.friday);
        if (p.startTime) setStartTime(p.startTime);
        if (p.endTime) setEndTime(p.endTime);
        // If previously saved bar was verified mark it so
        if (p.barVerified && p.barNumber) setBarVerified(true);
      } catch (e) {
        console.warn("Failed to load lawyer settings", e);
      }
    }
  }, [user]);

  // ─── Bar input handlers ─────────────────────────────────────────────────────
  const handleBarChange = (val: string) => {
    setBarNumber(val.toUpperCase());
    setBarVerified(false);
    setBarVerifyError(null);
  };

  const handleCouncilChange = (val: string) => {
    setStateBarLabel(val);
    setBarNumber("");
    setBarVerified(false);
    setBarVerifyError(null);
  };

  const handleVerifyBar = async () => {
    const result = validateBarNumber(barNumber, expectedCode);
    if (!result.valid) {
      setBarVerifyError(result.reason ?? "Invalid enrolment number");
      setBarVerified(false);
      return;
    }
    setBarVerifyLoading(true);
    setBarVerifyError(null);
    try {
      // Simulated BCI round-trip — replace with real API when available
      await new Promise((res) => setTimeout(res, 1400));
      setBarVerified(true);
      toast.success("Bar Council enrolment number verified successfully!");
    } catch {
      setBarVerifyError("Verification service unavailable. Please try again.");
    } finally {
      setBarVerifyLoading(false);
    }
  };

  const handleResetBar = () => {
    setBarVerified(false);
    setBarNumber("");
    setBarVerifyError(null);
  };

  // ─── Save handler ───────────────────────────────────────────────────────────
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!barVerified) {
      toast.error("Please verify your Bar Council Enrolment Number before saving.");
      return;
    }

    const data = {
      name,
      specialization,
      fee,
      experience,
      barNumber,
      stateBarLabel,
      barVerified: true,
      bio,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      startTime,
      endTime,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `lawyer.settings.${user?.id || "default"}`,
        JSON.stringify(data)
      );
    }
    toast.success("Profile settings updated successfully!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="size-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your professional identity, consulting fees, and weekly schedule.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
        {/* ── Professional Profile Card ─────────────────────────────────── */}
        <Card className="rounded-2xl p-6 shadow-soft space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <User className="size-4.5 text-primary" /> Professional Profile
          </h2>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl h-11"
            />
          </div>

          {/* State Bar Council selector */}
          <div className="space-y-1.5">
            <Label htmlFor="stateBar">State Bar Council</Label>
            <select
              id="stateBar"
              value={stateBarLabel}
              onChange={(e) => handleCouncilChange(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STATE_BAR_COUNCILS.map((b) => (
                <option key={b.code} value={b.label}>
                  {b.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Your enrolment number must start with{" "}
              <span className="font-bold font-mono text-primary">{expectedCode}</span>
            </p>
          </div>

          {/* Bar Council Enrolment Number + Verify */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="barNumber">Bar Council Enrolment Number</Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Format: {expectedCode}/NUMBER/YEAR
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                id="barNumber"
                value={barNumber}
                onChange={(e) => handleBarChange(e.target.value)}
                placeholder={`${expectedCode}/4819/2018`}
                className={`rounded-xl font-mono uppercase h-11 flex-1 ${
                  barVerified
                    ? "border-emerald-500 ring-1 ring-emerald-500/40"
                    : barVerifyError
                    ? "border-destructive ring-1 ring-destructive/40"
                    : ""
                }`}
                disabled={barVerified}
                required
              />

              {barVerified ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl px-3 shrink-0 border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-sm font-semibold"
                  onClick={handleResetBar}
                  title="Re-enter number"
                >
                  <RefreshCw className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-11 rounded-xl px-4 shrink-0 font-semibold text-sm"
                  onClick={handleVerifyBar}
                  disabled={barVerifyLoading || barNumber.length < 5}
                >
                  {barVerifyLoading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Verifying…
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="size-4" /> Verify
                    </span>
                  )}
                </Button>
              )}
            </div>

            {/* Status banners */}
            {barVerified && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Bar Council enrolment verified — you may save.
              </div>
            )}
            {!barVerified && barVerifyError && (
              <div className="flex items-start gap-1.5 text-xs font-medium text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>{barVerifyError}</span>
              </div>
            )}
            {!barVerified && !barVerifyError && barNumber.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                ⓘ Click <strong>Verify</strong> to validate before saving.
              </p>
            )}
          </div>

          {/* Experience & Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="experience">Experience (Years)</Label>
              <Input
                id="experience"
                type="number"
                min="1"
                max="50"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee">Fee per Hour (₹)</Label>
              <Input
                id="fee"
                type="number"
                min="100"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
        </Card>

        {/* ── Availability & Practice Card ──────────────────────────────── */}
        <Card className="rounded-2xl p-6 shadow-soft space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Calendar className="size-4.5 text-primary" /> Availability & Practice
          </h2>

          {/* Specialization */}
          <div className="space-y-1.5">
            <Label htmlFor="specialization">Primary Practice Area / Specialization</Label>
            <select
              id="specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Working Days */}
          <div className="space-y-3">
            <Label>Working Days</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: "Mon", val: monday, set: setMonday },
                { label: "Tue", val: tuesday, set: setTuesday },
                { label: "Wed", val: wednesday, set: setWednesday },
                { label: "Thu", val: thursday, set: setThursday },
                { label: "Fri", val: friday, set: setFriday },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => d.set(!d.val)}
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    d.val
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
          </div>

          {/* Save Row */}
          <div className="pt-3 flex items-center justify-between border-t border-border/60">
            <div className="flex items-center gap-2">
              {barVerified ? (
                <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] font-semibold">
                  <CheckCircle2 className="size-3" /> Bar Verified
                </Badge>
              ) : (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="size-3.5 text-amber-500" />
                  Verify bar number to save
                </span>
              )}
            </div>
            <Button
              type="submit"
              disabled={!barVerified}
              className="rounded-xl px-5 font-bold shadow-soft"
            >
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
