import { NextRequest } from "next/server";

// Forward image to n8n OCR webhook; expects JSON { image: base64String }
const N8N_OCR_WEBHOOK_URL = process.env.N8N_OCR_WEBHOOK_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const image = body?.image as string | undefined;
    if (!image) {
      return new Response(JSON.stringify({ error: "Missing image base64" }), { status: 400 });
    }
    if (!N8N_OCR_WEBHOOK_URL) {
      return new Response(JSON.stringify({ error: "Missing N8N_OCR_WEBHOOK_URL" }), { status: 500 });
    }

    const res = await fetch(N8N_OCR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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


