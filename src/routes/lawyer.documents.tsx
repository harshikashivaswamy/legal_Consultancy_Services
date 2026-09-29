import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  ShieldCheck,
  Tag,
  Upload,
  AlertCircle,
  FileCheck,
  Save,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { getLawyerDocuments, updateDocumentReviewStatus } from "@/lib/database";
import type { StoredDocument } from "@/lib/documents";
import { toast } from "sonner";

export const Route = createFileRoute("/lawyer/documents")({
  head: () => ({ meta: [{ title: "Case Documents Vault — Lawyer Dashboard" }] }),
  component: LawyerDocumentsPage,
});

function LawyerDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"Reviewed" | "Pending review" | "Draft">("Reviewed");

  const lawyerName = user?.name || "Adv. Ananya Iyer";

  useEffect(() => {
    async function load() {
      const docs = await getLawyerDocuments(lawyerName);
      setDocuments(docs);
    }
    load();
  }, [lawyerName]);

  const handleOpenReview = (doc: StoredDocument) => {
    setSelectedDoc(doc);
    setReviewNote(doc.notes || "");
    setReviewStatus(doc.status);
  };

  const handleSaveReview = async () => {
    if (!selectedDoc) return;
    await updateDocumentReviewStatus(selectedDoc.id, reviewStatus, reviewNote);
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === selectedDoc.id ? { ...d, status: reviewStatus, notes: reviewNote } : d
      )
    );
    toast.success("Document review and counsel notes saved successfully.");
    setSelectedDoc(null);
  };

  const filtered = documents.filter((d) => {
    if (selectedCategory !== "ALL" && d.type !== selectedCategory && d.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        (d.sharedWith && d.sharedWith.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Case Documents Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access, examine, and annotate evidence and agreements shared by clients under legal privilege.
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 font-semibold flex items-center gap-1.5 self-start">
          <Lock className="size-3.5 text-emerald-500" /> 256-Bit Encrypted Privilege Vault
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "Agreement", "FIR", "Contract", "Deed"].map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              className="rounded-xl text-xs font-semibold"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "ALL" ? `All Documents (${documents.length})` : cat}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-xl h-9"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl p-12 shadow-soft text-center text-muted-foreground space-y-3 border border-border/60">
          <FileText className="size-12 mx-auto opacity-30 text-muted-foreground" />
          <p className="font-semibold text-base text-foreground">No documents found</p>
          <p className="text-sm max-w-sm mx-auto">
            Documents uploaded by clients during consultation booking or via the matter vault will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card
              key={d.id}
              className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid size-11 place-items-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      d.status === "Reviewed"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}
                  >
                    {d.status === "Reviewed" ? "✓ Reviewed" : "Pending Review"}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-foreground text-sm line-clamp-1" title={d.name}>
                    {d.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{d.size}</span>
                    <span>•</span>
                    <span>Uploaded {d.uploaded}</span>
                  </div>
                </div>

                {d.notes && (
                  <div className="p-2.5 rounded-xl bg-secondary/40 text-xs border border-border/40 space-y-1">
                    <span className="font-bold text-[10px] uppercase text-primary block">Your Legal Notes</span>
                    <p className="text-foreground/80 line-clamp-2 italic">"{d.notes}"</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 border-t pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-xl text-xs font-semibold gap-1"
                  onClick={() => handleOpenReview(d)}
                >
                  <Eye className="size-3.5 text-primary" /> Review & Note
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl text-xs px-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => toast.success(`Downloading decrypted file: ${d.name}`)}
                  title="Download File"
                >
                  <Download className="size-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      {selectedDoc && (
        <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <FileCheck className="size-5 text-primary" /> Legal Review: {selectedDoc.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Annotate this case file with legal findings, review remarks, or clause advice.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Review Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Reviewed", "Pending review", "Draft"] as const).map((st) => (
                    <Button
                      key={st}
                      type="button"
                      size="sm"
                      variant={reviewStatus === st ? "default" : "outline"}
                      className="rounded-xl text-xs font-semibold"
                      onClick={() => setReviewStatus(st)}
                    >
                      {st}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Advocate Review Remarks</Label>
                <Textarea
                  rows={4}
                  placeholder="E.g., Clause 4.2 has indemnity risk. Recommended revision to 30-day notice period before executing."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setSelectedDoc(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
                onClick={handleSaveReview}
              >
                <Save className="size-3.5" /> Save Counsel Remarks
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
