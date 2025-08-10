"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        await fetch('/api/auth/session', { method: 'DELETE' });
      } catch {}
      try {
        await signOut();
      } catch {}
      router.replace('/login');
    })();
  }, [router, signOut]);

  return <div className="p-6 text-sm text-muted-foreground">Signing you out…</div>;
}


