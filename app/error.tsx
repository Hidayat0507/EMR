"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="p-8">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-gray-600">Please try again. If the issue persists, refresh the page.</p>
          <div className="flex gap-2">
            <Button onClick={() => reset()}>Try again</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </div>
      </body>
    </html>
  );
}


