import { DOCUMENTS, type LegalDocument } from "./mock-data";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface StoredDocument extends LegalDocument {
  fileUrl?: string | undefined;
  notes?: string | undefined;
  category?: string | undefined;
  fileBlobBase64?: string | undefined;
  encrypted?: boolean | undefined;
}

const STORAGE_KEY = "legalconsultancy.documents";

export const DOCUMENT_CATEGORIES = [
  "Property & Real Estate",
  "FIR / Police Complaint",
  "Court Notice / Summons",
  "Contracts & Agreements",
  "Family & Divorce Petition",
  "Affidavit / Identity Proof",
  "Tax & Financial Statements",
  "Employment / HR Matter",
  "Other Evidence",
];

export function getStoredDocuments(): StoredDocument[] {
  if (typeof window === "undefined") {
    return DOCUMENTS.map((d) => ({ ...d, encrypted: true }));
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DOCUMENTS));
      return DOCUMENTS.map((d) => ({ ...d, encrypted: true }));
    }
    const parsed: StoredDocument[] = JSON.parse(raw);
    return parsed.map((d) => ({ ...d, encrypted: true }));
  } catch (err) {
    console.warn("Failed to load documents from storage:", err);
    return DOCUMENTS;
  }
}

export function saveDocuments(docs: StoredDocument[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error("Failed to save documents to storage:", err);
  }
}

export function addDocument(doc: Omit<StoredDocument, "id" | "uploaded">): StoredDocument {
  const docs = getStoredDocuments();
  const newDocId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
  const newDoc: StoredDocument = {
    ...doc,
    id: newDocId,
    uploaded: new Date().toISOString().split("T")[0]!,
    status: doc.status || "Pending review",
    encrypted: true,
  };

  // Persist to localStorage first (instant, offline-safe)
  const updated = [newDoc, ...docs];
  saveDocuments(updated);

  // Then sync to Supabase in background using the sync service
  if (isSupabaseConfigured) {
    import("./sync").then(({ syncDocumentToSupabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        void syncDocumentToSupabase({
          id: newDocId,
          userId: session?.user?.id ?? "anonymous",
          name: newDoc.name,
          fileUrl: newDoc.fileUrl || "",
          fileSize: newDoc.size,
          category: newDoc.category || newDoc.type,
          notes: newDoc.notes ?? "",
          status: "Uploaded",
        });
      });
    }).catch(() => { /* sync not critical */ });
  }

  return newDoc;
}

export function removeDocument(id: string): void {
  const docs = getStoredDocuments();
  const updated = docs.filter((d) => d.id !== id);
  saveDocuments(updated);
}

export function updateDocumentShare(id: string, sharedWith: string): void {
  const docs = getStoredDocuments();
  const updated = docs.map((d) => (d.id === id ? { ...d, sharedWith } : d));
  saveDocuments(updated);
}

export function updateDocumentReview(id: string, status: "Reviewed" | "Pending review" | "Draft", notes?: string): void {
  const docs = getStoredDocuments();
  const updated = docs.map((d) => (d.id === id ? { ...d, status, notes: notes !== undefined ? notes : d.notes } : d));
  saveDocuments(updated);
}

export function getLawyerDocumentsFromStorage(lawyerName?: string): StoredDocument[] {
  const docs = getStoredDocuments();
  if (!lawyerName) return docs;
  const search = lawyerName.toLowerCase();
  const filtered = docs.filter((d) => d.sharedWith && d.sharedWith.toLowerCase().includes(search));
  return filtered.length > 0 ? filtered : docs;
}
