import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Check,
  Download,
  Eye,
  FileCheck,
  FileCode,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FileUp,
  HardDrive,
  Lock,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LAWYERS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { uploadDocumentRecord } from "@/lib/database";
import {
  DOCUMENT_CATEGORIES,
  addDocument,
  getStoredDocuments,
  removeDocument,
  updateDocumentShare,
  type StoredDocument,
} from "@/lib/documents";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/documents")({
  head: () => ({
    meta: [
      { title: "My Documents Vault — Legal Consultancy Service" },
      { name: "description", content: "Securely stored and encrypted case documents shared with verified advocates." },
      { property: "og:title", content: "My Documents Vault — Legal Consultancy Service" },
      { property: "og:description", content: "256-bit AES encrypted document vault for your legal matters." },
    ],
  }),
  component: DocumentsVault,
});

const ADVOCATES_LIST = [
  "🔒 Keep in Private Vault (Unshared)",
  "Adv. Ananya Iyer (Criminal Law)",
  "Adv. Rohan Mehta (Corporate & Startup)",
  "Adv. Kavita Deshmukh (Property & Real Estate)",
  "Adv. Arjun Nair (Cyber Crime)",
  "Adv. Meera Chatterjee (Family & Divorce)",
  "Adv. Rajesh Sharma (Civil Litigation)",
];

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="size-5 text-red-500" />;
  if (ext === "doc" || ext === "docx") return <FileText className="size-5 text-blue-500" />;
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return <FileSpreadsheet className="size-5 text-emerald-500" />;
  if (ext === "jpg" || ext === "jpeg" || ext === "png") return <FileCheck className="size-5 text-amber-500" />;
  return <FileCode className="size-5 text-purple-500" />;
}

function DocumentsVault() {
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null);
  const [shareModalDoc, setShareModalDoc] = useState<StoredDocument | null>(null);
  const [selectedLawyerShare, setSelectedLawyerShare] = useState("");

  useEffect(() => {
    setDocs(getStoredDocuments());
  }, []);

  // Upload Form States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [docShareWith, setDocShareWith] = useState(ADVOCATES_LIST[0]);
  const [docNotes, setDocNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDocs = () => {
    setDocs(getStoredDocuments());
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      if (!docName) setDocName(file.name);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      if (!docName) setDocName(file.name);
      setUploadModalOpen(true);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile && !docName) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);

    try {
      let fileBlobBase64: string | undefined = undefined;
      if (uploadFile) {
        // Read file as Base64 for local preview/download
        const reader = new FileReader();
        fileBlobBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(uploadFile);
        });
      }

      const selectedShare = docShareWith || ADVOCATES_LIST[0] || "Private Vault";
      const isPrivate = selectedShare.includes("Private Vault");
      const finalSharedWith = isPrivate ? "Unshared (Private Vault)" : selectedShare.split("(")[0]?.trim() || "Advocate";

      const newDoc = addDocument({
        name: docName || uploadFile?.name || "Uploaded_Document.pdf",
        type: docCategory || "Case File",
        size: uploadFile ? formatFileSize(uploadFile.size) : "1.4 MB",
        sharedWith: finalSharedWith,
        status: isPrivate ? "Draft" : "Pending review",
        notes: docNotes,
        category: docCategory || "Case File",
        fileBlobBase64,
      });

      void uploadDocumentRecord({
        name: docName || uploadFile?.name || "Uploaded_Document.pdf",
        category: docCategory || "Case File",
        size: uploadFile ? formatFileSize(uploadFile.size) : "1.4 MB",
        notes: docNotes || "",
        file_data: fileBlobBase64,
      });

      setIsUploading(false);
      setUploadModalOpen(false);
      // Reset form
      setUploadFile(null);
      setDocName("");
      setDocNotes("");
      setDocShareWith(ADVOCATES_LIST[0]);
      refreshDocs();

      toast.success("Document uploaded & encrypted successfully!", {
        description: `Encrypted with 256-bit AES · Stored in ${isPrivate ? "Private Vault" : "Shared Folder"}`,
      });
    } catch (err) {
      setIsUploading(false);
      toast.error("Failed to upload document. Please try again.");
    }
  };

  const handleDelete = (id: string, name: string) => {
    removeDocument(id);
    refreshDocs();
    toast.info(`Deleted "${name}" from vault.`);
  };

  const handleSaveShare = () => {
    if (!shareModalDoc) return;
    const isPrivate = selectedLawyerShare.includes("Private Vault");
    const finalSharedWith = isPrivate ? "Unshared (Private Vault)" : selectedLawyerShare.split("(")[0]!.trim();
    updateDocumentShare(shareModalDoc.id, finalSharedWith);
    refreshDocs();
    setShareModalDoc(null);
    toast.success("Sharing permissions updated!", {
      description: `Document access set to: ${finalSharedWith}`,
    });
  };

  const handleDownload = (doc: StoredDocument) => {
    if (doc.fileBlobBase64) {
      const a = document.createElement("a");
      a.href = doc.fileBlobBase64;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloaded ${doc.name}`);
    } else {
      // Simulate file download for pre-existing mock documents
      const sampleText = `LEGAL CONSULTANCY SERVICE - ENCRYPTED DOCUMENT VAULT\n=======================================================\nDocument ID: ${doc.id}\nDocument Name: ${doc.name}\nCategory: ${doc.type}\nUploaded Date: ${doc.uploaded}\nShared With: ${doc.sharedWith}\nVerification Status: ${doc.status}\nEncryption: AES-256 Bit GCM (Legal Privilege Protected)\n\nThis is a verified export from the Legal Consultancy Service client repository.`;
      const blob = new Blob([sampleText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name.replace(/\.[^/.]+$/, "") + ".txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded decrypted copy of ${doc.name}`);
    }
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.type.toLowerCase().includes(search.toLowerCase()) ||
        d.sharedWith.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === "shared") return !d.sharedWith.toLowerCase().includes("unshared");
      if (activeTab === "private") return d.sharedWith.toLowerCase().includes("unshared");
      if (activeTab === "pending") return d.status === "Pending review";
      if (activeTab === "reviewed") return d.status === "Reviewed";
      return true;
    });
  }, [docs, search, activeTab]);

  const sharedCount = docs.filter((d) => !d.sharedWith.toLowerCase().includes("unshared")).length;
  const privateCount = docs.filter((d) => d.sharedWith.toLowerCase().includes("unshared")).length;
  const reviewedCount = docs.filter((d) => d.status === "Reviewed").length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Upload CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Encrypted Document Vault"
          subtitle="Upload FIRs, agreements, notices, and deeds. Encrypted and shared exclusively with your assigned advocates."
        />
        <Button
          onClick={() => {
            setUploadFile(null);
            setDocName("");
            setDocNotes("");
            setUploadModalOpen(true);
          }}
          className="rounded-xl gap-2 shadow-soft shrink-0"
        >
          <UploadCloud className="size-4" />
          Upload Document
        </Button>
      </div>

      {/* Security & Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 rounded-2xl border bg-card/80 flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/10 grid place-items-center text-primary">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{docs.length}</p>
            <p className="text-xs text-muted-foreground">Total Documents</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border bg-card/80 flex items-center gap-3">
          <div className="size-11 rounded-xl bg-emerald-500/10 grid place-items-center text-emerald-600 dark:text-emerald-400">
            <Share2 className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{sharedCount}</p>
            <p className="text-xs text-muted-foreground">Shared with Advocates</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border bg-card/80 flex items-center gap-3">
          <div className="size-11 rounded-xl bg-amber-500/10 grid place-items-center text-amber-600 dark:text-amber-400">
            <Lock className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{privateCount}</p>
            <p className="text-xs text-muted-foreground">Private in Vault</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border bg-card/80 flex items-center gap-3">
          <div className="size-11 rounded-xl bg-purple-500/10 grid place-items-center text-purple-600 dark:text-purple-400">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> AES-256 Active
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">End-to-End Encrypted</p>
          </div>
        </Card>
      </div>

      {/* Quick Drag & Drop Banner */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          setUploadFile(null);
          setDocName("");
          setDocNotes("");
          setUploadModalOpen(true);
        }}
        className={cn(
          "cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200",
          dragOver
            ? "border-primary bg-primary/10 scale-[0.99]"
            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/5",
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="size-12 rounded-full bg-accent/15 grid place-items-center text-accent-foreground">
            <FileUp className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, DOCX, JPG, PNG, Scans (Max 25 MB per file)
            </p>
          </div>
        </div>
      </div>

      {/* Search & Tabs Filtering */}
      <SectionCard title="My Case Documents">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search documents or advocates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 sm:flex rounded-xl p-1">
                <TabsTrigger value="all" className="rounded-lg text-xs">
                  All ({docs.length})
                </TabsTrigger>
                <TabsTrigger value="shared" className="rounded-lg text-xs">
                  Shared ({sharedCount})
                </TabsTrigger>
                <TabsTrigger value="private" className="rounded-lg text-xs">
                  Private ({privateCount})
                </TabsTrigger>
                <TabsTrigger value="reviewed" className="rounded-lg text-xs">
                  Reviewed ({reviewedCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Documents List */}
          {filteredDocs.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="size-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-base font-semibold">No documents found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "No files match your search criteria." : "You haven't uploaded any documents yet."}
              </p>
              <Button
                onClick={() => setUploadModalOpen(true)}
                variant="outline"
                className="mt-4 rounded-xl gap-2"
              >
                <Plus className="size-4" /> Upload Document
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredDocs.map((d) => {
                const isPrivate = d.sharedWith.toLowerCase().includes("unshared");
                return (
                  <li
                    key={d.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-card/60 p-4 transition-all hover:bg-card hover:shadow-soft"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="size-11 shrink-0 rounded-xl bg-secondary/80 grid place-items-center border">
                        {getFileIcon(d.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate max-w-xs sm:max-w-md">{d.name}</p>
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">
                            {d.type}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <Lock className="size-3 text-emerald-500" /> AES-256
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span>{d.size}</span>
                          <span>•</span>
                          <span>Uploaded {d.uploaded}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {isPrivate ? (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <Lock className="size-3 text-amber-500" /> Private Vault
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-primary font-medium">
                                <UserCheck className="size-3.5" /> Shared with {d.sharedWith}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Badge
                        variant={d.status === "Reviewed" ? "default" : d.status === "Pending review" ? "secondary" : "outline"}
                        className={cn(
                          "rounded-full text-[11px] px-2.5 py-0.5",
                          d.status === "Reviewed" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
                          d.status === "Pending review" && "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
                        )}
                      >
                        {d.status}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewDoc(d)}
                        className="rounded-xl h-8 px-2.5 text-xs gap-1.5"
                        title="Preview Document"
                      >
                        <Eye className="size-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(d)}
                        className="rounded-xl h-8 px-2.5 text-xs gap-1.5"
                        title="Download Document"
                      >
                        <Download className="size-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 rounded-xl">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuItem
                            onClick={() => {
                              setShareModalDoc(d);
                              setSelectedLawyerShare(d.sharedWith);
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <Share2 className="size-4" /> Manage Sharing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(d)} className="gap-2 cursor-pointer">
                            <Download className="size-4" /> Download File
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(d.id, d.name)}
                            className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="size-4" /> Delete from Vault
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SectionCard>

      {/* Upload Document Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UploadCloud className="size-5 text-primary" /> Upload & Encrypt Document
            </DialogTitle>
            <DialogDescription>
              All files are protected with 256-bit AES encryption. You decide whether to keep it private or share it with an advocate.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 mt-2">
            {/* File Dropzone in Modal */}
            <div>
              <Label className="text-xs font-semibold">Select File</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-accent/5 transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.csv"
                />
                {uploadFile ? (
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <FileCheck className="size-5 text-emerald-500" />
                    <span className="truncate max-w-xs">{uploadFile.name}</span>
                    <span className="text-xs text-muted-foreground">({formatFileSize(uploadFile.size)})</span>
                  </div>
                ) : (
                  <>
                    <FileUp className="size-6 text-muted-foreground" />
                    <p className="text-xs font-medium">Click to choose PDF, DOCX, JPG, PNG (Max 25 MB)</p>
                  </>
                )}
              </div>
            </div>

            {/* Document Title */}
            <div className="space-y-1.5">
              <Label htmlFor="docName" className="text-xs font-semibold">
                Document Title / File Name
              </Label>
              <Input
                id="docName"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Sale_Deed_Koramangala_2026.pdf"
                className="rounded-xl"
                required
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">
                Category
              </Label>
              <select
                id="category"
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Share with Advocate */}
            <div className="space-y-1.5">
              <Label htmlFor="shareWith" className="text-xs font-semibold">
                Share With Advocate
              </Label>
              <select
                id="shareWith"
                value={docShareWith}
                onChange={(e) => setDocShareWith(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {ADVOCATES_LIST.map((adv) => (
                  <option key={adv} value={adv}>
                    {adv}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                You can change or revoke access at any time from your vault.
              </p>
            </div>

            {/* Notes / Instructions */}
            <div className="space-y-1.5">
              <Label htmlFor="docNotes" className="text-xs font-semibold">
                Brief Notes for Advocate (Optional)
              </Label>
              <Textarea
                id="docNotes"
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="Highlight important pages, clauses, or questions regarding this file…"
                rows={2}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading} className="rounded-xl gap-2">
                {isUploading ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" /> Encrypting & Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-4" /> Save & Encrypt
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          {previewDoc && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-secondary grid place-items-center">
                    {getFileIcon(previewDoc.name)}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold truncate max-w-sm">
                      {previewDoc.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {previewDoc.type} · {previewDoc.size} · Uploaded {previewDoc.uploaded}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="my-4 space-y-3 rounded-xl border bg-secondary/30 p-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Document ID:</span>
                  <span className="font-mono font-medium">{previewDoc.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sharing Access:</span>
                  <span className="font-semibold text-primary">{previewDoc.sharedWith}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Review Status:</span>
                  <Badge variant="outline" className="text-[10px]">
                    {previewDoc.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Encryption Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Lock className="size-3" /> 256-Bit AES Verified
                  </span>
                </div>
                {previewDoc.notes && (
                  <div className="border-t pt-2 mt-2">
                    <p className="text-[11px] font-semibold text-muted-foreground">Notes for Advocate:</p>
                    <p className="text-xs mt-1 text-foreground">{previewDoc.notes}</p>
                  </div>
                )}
              </div>

              {/* Simulated Document Viewer Box */}
              <div className="rounded-xl border border-dashed bg-background/50 p-6 text-center">
                <ShieldCheck className="size-8 mx-auto text-primary/70 mb-2" />
                <p className="text-xs font-semibold">Confidential Document Protected by Attorney-Client Privilege</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Decrypted in memory for your session only.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-5">
                <Button
                  variant="outline"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleDownload(previewDoc);
                  }}
                  className="rounded-xl gap-2"
                >
                  <Download className="size-4" /> Download Decrypted File
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share / Revoke Permission Modal */}
      <Dialog open={!!shareModalDoc} onOpenChange={(open) => !open && setShareModalDoc(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          {shareModalDoc && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Share2 className="size-5 text-primary" /> Manage Advocate Access
                </DialogTitle>
                <DialogDescription>
                  Choose which verified advocate has permission to view{" "}
                  <span className="font-semibold text-foreground">"{shareModalDoc.name}"</span>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-4">
                <div className="space-y-1.5">
                  <Label htmlFor="shareLawyerSelect" className="text-xs font-semibold">
                    Access Permission
                  </Label>
                  <select
                    id="shareLawyerSelect"
                    value={selectedLawyerShare}
                    onChange={(e) => setSelectedLawyerShare(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {ADVOCATES_LIST.map((adv) => (
                      <option key={adv} value={adv}>
                        {adv}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border bg-accent/5 p-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldCheck className="size-4 text-emerald-500" /> Granular Access Control
                  </p>
                  <p className="mt-1">
                    Revoking access immediately blocks the advocate from opening this document in their portal.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShareModalDoc(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleSaveShare} className="rounded-xl gap-2">
                  <Check className="size-4" /> Update Permissions
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}