import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";
import { referralBodySchema } from "@/lib/validation";

// n8n webhook to generate referral letter
// Example: https://your-n8n-host/webhook/referral-letter
const N8N_REFERRAL_WEBHOOK_URL = process.env.N8N_REFERRAL_WEBHOOK_URL;

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get('emr_session')?.value;
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    try { await adminAuth.verifySessionCookie(session, true); } catch { return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }); }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(`referral:${ip}`, 30, 60_000)) {
      return new Response(JSON.stringify({ error: "Too Many Requests" }), { status: 429 });
    }
    const parsed = referralBodySchema.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
    const { text } = parsed.data;

    if (!N8N_REFERRAL_WEBHOOK_URL) {
      return new Response(JSON.stringify({ error: "Missing N8N_REFERRAL_WEBHOOK_URL env" }), { status: 500 });
    }

    const bearer = process.env.N8N_SHARED_SECRET;
    const n8nResponse = await fetch(N8N_REFERRAL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify({ text }),
    });

    const data = await n8nResponse.json().catch(() => ({}));
    if (!n8nResponse.ok) {
      return new Response(
        JSON.stringify({ error: "n8n error", status: n8nResponse.status, data }),
        { status: 502 }
      );
    }

    // Accept a simple { letter: string } or construct text from fields
    let letter: string | null = null;
    if (data && typeof data === "object") {
      if (typeof data.letter === "string") {
        letter = data.letter;
      } else if (data.header || data.body || data.footer) {
        const parts: string[] = [];
        if (data.header) parts.push(String(data.header));
        if (data.body) parts.push(String(data.body));
        if (data.footer) parts.push(String(data.footer));
        letter = parts.join("\n\n");
      }
    }

    if (!letter) {
      // Fallback simple template
      letter = "Referral Letter\n\n" + text;
    }

    return new Response(JSON.stringify({ letter }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}


