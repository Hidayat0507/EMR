"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pdf, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface ReferralLetterButtonProps {
  sourceText: string;
  onInsert: (letterText: string) => void;
}

export default function ReferralLetterButton({ sourceText, onInsert }: ReferralLetterButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const styles = StyleSheet.create({
    page: { padding: 32, fontSize: 12, color: '#111827' },
    header: { marginBottom: 16, alignItems: 'center' },
    logoBox: { width: 140, height: 50, marginBottom: 8 },
    title: { fontSize: 18, fontWeight: 'bold' },
    body: { marginTop: 16, lineHeight: 1.4 },
  });

  // Load logo once
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'org'));
        const url = (snap.exists() && (snap.data() as any).logoUrl) || null;
        setLogoUrl(url);
      } catch {}
    })();
  }, []);

  const handleGenerate = async () => {
    setError(null);
    setResult(sourceText);
    setOpen(true);
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={!sourceText.trim()}
      >
        Generate referral letter
      </Button>
      {error && <div className="text-xs text-destructive">{error}</div>}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setResult(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Referral Letter Draft</DialogTitle>
            <DialogDescription>
              Review the generated letter. You can insert it into the consultation notes or download a PDF copy.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={result ?? ""}
            onChange={(event) => setResult(event.target.value)}
            className="min-h-[300px]"
          />
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setResult(null);
                setOpen(false);
              }}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!result) return;
                onInsert(result);
                setOpen(false);
              }}
              disabled={!result}
            >
              Insert into Notes
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!result}
              onClick={async () => {
                if (!result) return;
                const blob = await pdf(
                  <Document>
                    <Page size="A4" style={styles.page}>
                      <View style={styles.header}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        {logoUrl && <Image src={logoUrl} style={styles.logoBox} />}
                        <Text style={styles.title}>Referral Letter</Text>
                      </View>
                      <View style={styles.body}>
                        <Text>{result}</Text>
                      </View>
                    </Page>
                  </Document>
                ).toBlob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "referral-letter.pdf";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
