"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SoapRewriteButtonProps {
  sourceText: string;
  onInsert: (note: string) => void;
}

type WorkflowResponse = {
  note: string;
  modelUsed: string;
};

export default function SoapRewriteButton({ sourceText, onInsert }: SoapRewriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // No local preview; we write directly to the clinical notes field

  const canRun = Boolean(sourceText.trim());

  const handleRun = async () => {
    if (!canRun) return;

    setLoading(true);
    setError(null);
    

    try {
      const res = await fetch("/api/soap-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      const data: WorkflowResponse = await res.json();
      if (!res.ok) {
        throw new Error((data as any)?.error || "Failed to enhance SOAP note");
      }

      if (!data.note || !data.note.trim()) {
        setError("No structured content generated. Try adding more detail.");
        return;
      }

      // Auto-render into the target field
      onInsert(data.note);
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="outline" size="sm" disabled={!canRun || loading} onClick={handleRun}>
        {loading ? "Generating…" : "Generate SOAP"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
