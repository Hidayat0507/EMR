"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SoapRewriteButtonProps {
  sourceText: string;
  onInsert: (soapText: string) => void;
}

export default function SoapRewriteButton({ sourceText, onInsert }: SoapRewriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleRewrite = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/soap-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to rewrite");
      }
      setResult(data.note);
    } catch (e: any) {
      setError(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={handleRewrite} disabled={loading || !sourceText.trim()}>
        {loading ? "Rewriting…" : "Rewrite the note"}
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
          </div>
        </div>
      )}
    </div>
  );
}


