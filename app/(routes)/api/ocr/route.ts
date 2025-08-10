import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";
import { ocrBodySchema } from "@/lib/validation";

// Forward image to n8n OCR webhook; expects JSON { image: base64String }
const N8N_OCR_WEBHOOK_URL = process.env.N8N_OCR_WEBHOOK_URL;

export async function POST(req: NextRequest) {
  try {
    // Basic auth: require a valid session cookie
    const session = req.cookies.get('emr_session')?.value;
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    try { await adminAuth.verifySessionCookie(session, true); } catch { return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }); }

    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(`ocr:${ip}`, 12, 60_000)) {
      return new Response(JSON.stringify({ error: "Too Many Requests" }), { status: 429 });
    }
    const parsed = ocrBodySchema.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
    const { image } = parsed.data;
    if (!N8N_OCR_WEBHOOK_URL) {
      return new Response(JSON.stringify({ error: "Missing N8N_OCR_WEBHOOK_URL" }), { status: 500 });
    }

    // Optional static bearer check for n8n auth
    const bearer = process.env.N8N_SHARED_SECRET;
    const res = await fetch(N8N_OCR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify({ image }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "n8n error", data }), { status: 502 });
    }

    // Expect n8n to return fields; fallbacks attempt simple regex extraction
    const text: string | undefined = data?.text;
    let fullName = data?.fullName || null;
    let nric = data?.nric || null;

    if ((!fullName || !nric) && text) {
      const nricMatch = text.match(/\b\d{6}-\d{2}-\d{4}\b/);
      if (nricMatch) nric = nricMatch[0];
      // naive name heuristic: longest uppercase line
      const lines = text.split(/\r?\n/).map(l => l.trim());
      const candidate = lines
        .filter(l => /^[A-Z'\-\s]{5,}$/.test(l))
        .sort((a, b) => b.length - a.length)[0];
      if (candidate) fullName = candidate;
    }

    return new Response(
      JSON.stringify({ fullName, nric, raw: data }),
      { status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}


