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
    <div className="space-y-3 rounded-md border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">SOAP Enhancement</h3>
          <p className="text-xs text-muted-foreground">Generate structured SOAP from your clinical notes.</p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={!canRun || loading} onClick={handleRun}>
          {loading ? "Generating…" : "Generate SOAP"}
        </Button>
      </div>

      {error && <div className="text-xs text-destructive">{error}</div>}

      {/* No preview area; content is inserted directly on success */}
    </div>
  );
}
