import { NextRequest } from "next/server";

// Expected environment variable that points to your n8n webhook URL
// Example: https://your-n8n-host/webhook/soap-rewrite
const N8N_SOAP_WEBHOOK_URL = process.env.N8N_SOAP_WEBHOOK_URL;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'text' in body" }), { status: 400 });
    }
    if (!N8N_SOAP_WEBHOOK_URL) {
      return new Response(JSON.stringify({ error: "Missing N8N_SOAP_WEBHOOK_URL env" }), { status: 500 });
    }

    const n8nResponse = await fetch(N8N_SOAP_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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


