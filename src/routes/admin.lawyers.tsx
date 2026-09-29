import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Edit3, Search, UserRound, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAdminLawyers,
  updateLawyerProfile,
} from "@/lib/database";

type Lawyer = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  specialization?: string;
  specialisations?: string[];
  experience?: string | number;
  experience_years?: number;
  fee?: number;
  consultation_fee?: number;
  barCouncilId?: string;
  bar_id?: string;
  stateBar?: string;
  bio?: string;
  status?: "Pending" | "Approved" | "Rejected";
  verified?: boolean;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  city: string;
  specialization: string;
  experience: string;
  fee: string;
  barCouncilId: string;
  stateBar: string;
  bio: string;
};

export const Route = createFileRoute("/admin/lawyers")({
  head: () => ({ meta: [{ title: "Manage Lawyers — Admin Portal" }] }),
  component: AdminLawyersPage,
});

function AdminLawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Lawyer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    city: "",
    specialization: "",
    experience: "",
    fee: "",
    barCouncilId: "",
    stateBar: "",
    bio: "",
  });

  const load = async () => {
    const data = await getAdminLawyers();
    setLawyers(data as Lawyer[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const startEdit = (lawyer: Lawyer) => {
    setEditing(lawyer);
    setForm({
      name: lawyer.name || "",
      email: lawyer.email || "",
      phone: lawyer.phone || "",
      city: lawyer.city || "",
      specialization:
        lawyer.specialization || lawyer.specialisations?.[0] || "",
      experience: String(lawyer.experience_years ?? lawyer.experience ?? ""),
      fee: String(lawyer.consultation_fee ?? lawyer.fee ?? ""),
      barCouncilId: lawyer.barCouncilId || lawyer.bar_id || "",
      stateBar: lawyer.stateBar || "",
      bio: lawyer.bio || "",
    });
  };

  const save = async () => {
    if (!editing) return;

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    setSaving(true);
    const result = await updateLawyerProfile(editing.id, {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      specialization: form.specialization.trim(),
      experience: Number(form.experience) || 0,
      fee: Number(form.fee) || 0,
      barCouncilId: form.barCouncilId.trim(),
      stateBar: form.stateBar.trim(),
      bio: form.bio.trim(),
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error || "Could not update lawyer.");
      return;
    }

    toast.success("Lawyer profile updated successfully.");
    setEditing(null);
    await load();
  };

  const filtered = lawyers.filter((lawyer) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [
      lawyer.name,
      lawyer.email,
      lawyer.specialization,
      lawyer.city,
      lawyer.barCouncilId,
      lawyer.bar_id,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Lawyers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit lawyer profiles, consultation fees, contact details and
            professional information.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lawyer, email, city or Bar ID..."
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground rounded-2xl">
          No lawyers found.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((lawyer) => (
            <Card
              key={lawyer.id}
              className="rounded-2xl p-5 border border-border/60 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-secondary grid place-items-center">
                    <UserRound className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold">{lawyer.name || "Unnamed Lawyer"}</h2>
                    <p className="text-xs text-muted-foreground">
                      {lawyer.specialization ||
                        lawyer.specialisations?.[0] ||
                        "General Law"}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={
                    lawyer.status === "Approved"
                      ? "default"
                      : lawyer.status === "Rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {lawyer.status || "Active"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="truncate">{lawyer.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p>{lawyer.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">City</p>
                  <p>{lawyer.city || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consultation Fee</p>
                  <p>₹{Number(lawyer.consultation_fee ?? lawyer.fee ?? 0).toLocaleString("en-IN")}</p>
                </div>
              </div>

              <Button
                onClick={() => startEdit(lawyer)}
                className="w-full rounded-xl gap-2"
              >
                <Edit3 className="size-4" />
                Edit Lawyer
              </Button>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background border shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-background z-10">
              <div>
                <h2 className="text-xl font-bold">Edit Lawyer</h2>
                <p className="text-xs text-muted-foreground">
                  Changes are saved to the local admin store and Supabase when configured.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(null)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-5 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["name", "Full Name"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["city", "City"],
                  ["specialization", "Specialization"],
                  ["experience", "Experience (years)"],
                  ["fee", "Consultation Fee (₹)"],
                  ["barCouncilId", "Bar Council ID"],
                  ["stateBar", "State Bar Council"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium">{label}</label>
                  <Input
                    value={form[key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={5}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Professional biography..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t">
              <Button
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={saving}
                onClick={() => void save()}
                className="gap-2"
              >
                <Save className="size-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
