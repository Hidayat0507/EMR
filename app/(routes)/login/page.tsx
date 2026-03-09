"use client";

import { useState } from "react";
import { useMedplumAuth } from "@/lib/auth-medplum";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function resolveSafeNext(next: string | null): string {
  if (!next) return "/dashboard";
  if (next.startsWith("/")) return next;

  try {
    const candidate = new URL(next);
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
    if (!baseDomain) return "/dashboard";
    const hostname = candidate.hostname;
    if (hostname === baseDomain || hostname.endsWith(`.${baseDomain}`)) {
      return candidate.toString();
    }
    return "/dashboard";
  } catch {
    return "/dashboard";
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useMedplumAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      // Replace to avoid back navigation to login
      const safeNext = resolveSafeNext(searchParams.get('next'));
      router.replace(safeNext);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center w-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your EMR account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" disabled>
              Forgot password? (not available)
            </Button>
          </form>
          {/* Signup disabled */}
        </CardContent>
      </Card>
    </div>
  );
}
