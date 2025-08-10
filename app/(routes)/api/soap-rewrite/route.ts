import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";
import { soapRewriteBodySchema } from "@/lib/validation";

// Expected environment variable that points to your n8n webhook URL
// Example: https://your-n8n-host/webhook/soap-rewrite
const N8N_SOAP_WEBHOOK_URL = process.env.N8N_SOAP_WEBHOOK_URL;

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get('emr_session')?.value;
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    try { await adminAuth.verifySessionCookie(session, true); } catch { return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }); }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(`soap:${ip}`, 30, 60_000)) {
      return new Response(JSON.stringify({ error: "Too Many Requests" }), { status: 429 });
    }
    const parsed = soapRewriteBodySchema.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
    const { text } = parsed.data;
    if (!N8N_SOAP_WEBHOOK_URL) {
      return new Response(JSON.stringify({ error: "Missing N8N_SOAP_WEBHOOK_URL env" }), { status: 500 });
    }

    const bearer = process.env.N8N_SHARED_SECRET;
    const n8nResponse = await fetch(N8N_SOAP_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify({ text }),
      // Consider adding auth headers if your n8n instance requires them
    });

    const data = await n8nResponse.json().catch(() => ({}));
    if (!n8nResponse.ok) {
      return new Response(
        JSON.stringify({ error: "n8n error", status: n8nResponse.status, data }),
        { status: 502 }
      );
    }

    // Accept either a single 'note' or a structured SOAP object
    let note: string | null = null;
    if (data && typeof data === "object") {
      if (typeof data.note === "string") {
        note = data.note;
      } else if (data.subjective || data.objective || data.assessment || data.plan) {
        const parts: string[] = [];
        if (data.subjective) parts.push(`S: ${data.subjective}`);
        if (data.objective) parts.push(`O: ${data.objective}`);
        if (data.assessment) parts.push(`A: ${data.assessment}`);
        if (data.plan) parts.push(`P: ${data.plan}`);
        note = parts.join("\n\n");
      }
    }

    if (!note) {
      // Fallback: echo original text prefixed with S: if workflow didn't return expected shape
      note = `S: ${text}`;
    }

    return new Response(JSON.stringify({ note }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}


