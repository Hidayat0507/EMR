"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PDFViewer, pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ReferralLetterButtonProps {
  sourceText: string;
  onInsert: (letterText: string) => void;
}

export default function ReferralLetterButton({ sourceText, onInsert }: ReferralLetterButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/referral-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate referral letter");
      }
      setResult(data.letter);
    } catch (e: any) {
      setError(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={handleGenerate} disabled={loading || !sourceText.trim()}>
        {loading ? "Generating…" : "Generate referral letter"}
      </Button>
      {error && <div className="text-xs text-destructive">{error}</div>}
      {result && (
        <div className="space-y-2">
          <Textarea value={result} readOnly className="min-h-[120px]" />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => setResult(null)}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={() => onInsert(result)}>
              Insert into Notes
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={async () => {
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
                const a = document.createElement('a');
                a.href = url;
                a.download = 'referral-letter.pdf';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


