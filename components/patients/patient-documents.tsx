"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";

type PatientDocument = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  storagePath: string;
  downloadUrl: string;
  uploadedAt?: Date | string | null;
  uploadedBy?: string | null;
};

interface Props {
  patientId: string;
}

export default function PatientDocuments({ patientId }: Props) {
  const [docs, setDocs] = useState<PatientDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!patientId) return;
    const col = collection(db, "patients", patientId, "documents");
    const q = query(col, orderBy("uploadedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items: PatientDocument[] = snap.docs.map((d) => {
        const data = d.data() as any;
        let uploadedAt: Date | string | null = null;
        const raw = data.uploadedAt;
        if (raw && typeof raw?.toDate === "function") uploadedAt = raw.toDate();
        else if (typeof raw === "string") uploadedAt = raw;
        return {
          id: d.id,
          fileName: data.fileName,
          contentType: data.contentType,
          size: data.size || 0,
          storagePath: data.storagePath,
          downloadUrl: data.downloadUrl,
          uploadedAt,
          uploadedBy: data.uploadedBy || null,
        };
      });
      setDocs(items);
    });
    return () => unsub();
  }, [patientId]);

  const onSelectFiles: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const storage = getStorage();
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") {
          toast({ title: "Invalid file", description: `${file.name} is not a PDF`, variant: "destructive" });
          continue;
        }
        const path = `patients/${patientId}/documents/${Date.now()}-${file.name}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, file, { contentType: file.type });
        const url = await getDownloadURL(ref);

        // Save metadata in Firestore
        await addDoc(collection(db, "patients", patientId, "documents"), {
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          storagePath: path,
          downloadUrl: url,
          uploadedAt: serverTimestamp(),
        });
      }
      toast({ title: "Upload complete" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Upload failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setUploading(false);
      e.currentTarget.value = ""; // reset input
    }
  };

  const onDelete = async (docItem: PatientDocument) => {
    const ok = confirm(`Delete ${docItem.fileName}? This cannot be undone.`);
    if (!ok) return;
    try {
      // Delete from Storage
      const storage = getStorage();
      await deleteObject(storageRef(storage, docItem.storagePath));
      // Delete Firestore doc
      await deleteDoc(doc(db, "patients", patientId, "documents", docItem.id));
      toast({ title: "Document deleted" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Delete failed", description: err?.message || "Please try again", variant: "destructive" });
    }
  };

  const formatDate = (v?: Date | string | null) => {
    if (!v) return "-";
    const d = typeof v === "string" ? new Date(v) : v;
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const totalSize = useMemo(() => docs.reduce((a, b) => a + (b.size || 0), 0), [docs]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <div className="flex items-center gap-2">
          <label htmlFor="pdf-upload">
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={onSelectFiles}
            />
            <Button asChild variant="default" disabled={uploading}>
              <span className="inline-flex items-center">
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Upload PDF"}
              </span>
            </Button>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No documents uploaded.</div>
        ) : (
          <div className="relative border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <div className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <a className="hover:underline" href={d.downloadUrl} target="_blank" rel="noreferrer">
                          {d.fileName}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(d.uploadedAt)}</TableCell>
                    <TableCell>{d.size ? `${(d.size / 1024 / 1024).toFixed(2)} MB` : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={d.downloadUrl} target="_blank" rel="noreferrer">View</a>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onDelete(d)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

