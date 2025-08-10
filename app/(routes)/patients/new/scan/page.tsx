"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ScanICPage() {
  return (
    <Suspense fallback={<div className="container max-w-3xl py-6">Loading…</div>}>
      <ScanICPageInner />
    </Suspense>
  );
}

function ScanICPageInner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [nric, setNric] = useState("");
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Prefill from query params when coming from registration
  useEffect(() => {
    const qFullName = searchParams.get("fullName") || "";
    const qNric = searchParams.get("nric") || "";
    if (qFullName) setFullName(qFullName);
    if (qNric) setNric(qNric);
  }, [searchParams]);

  // Camera stream lifecycle
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) return;
        setStream(media);
        streamRef.current = media;
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          await videoRef.current.play();
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Camera error", description: "Could not access camera.", variant: "destructive" });
      }
    })();
    return () => {
      cancelled = true;
      const s = streamRef.current;
      if (s) s.getTracks().forEach(t => t.stop());
      setStream(null);
    };
  }, [toast]);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCaptured(dataUrl);
  };

  const runOCR = async () => {
    if (!captured) return;
    try {
      const base64 = captured.split(',')[1];
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'OCR failed');
      setFullName(data.fullName || "");
      setNric(data.nric || "");
      toast({ title: 'IC scanned', description: 'Review and continue to registration.' });
    } catch (e: any) {
      toast({ title: 'OCR error', description: e.message || 'Failed to read IC', variant: 'destructive' });
    }
  };

  return (
    <div className="container max-w-3xl py-6 space-y-4">
      <div className="mb-2">
        <Link href="/patients/new" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Registration
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan IC</CardTitle>
          <CardDescription>Use your phone camera to scan the ID card. We’ll extract name and NRIC for quick registration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black/20">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={capture} className="flex items-center gap-2">
              <Camera className="h-4 w-4" /> Capture
            </Button>
            <Button type="button" variant="secondary" onClick={runOCR} disabled={!captured}>
              Read IC
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Full name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Extracted full name" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">NRIC</label>
              <Input value={nric} onChange={(e) => setNric(e.target.value)} placeholder="YYMMDD-SS-NNNN" />
            </div>
          </div>

          <div className="flex justify-end">
            <Link href={{ pathname: '/patients/new', query: { fullName, nric } }}>
              <Button>Continue to registration</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


