import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";
import { referralBodySchema } from "@/lib/validation";
import { generateReferralLetter } from "@/lib/workflows/referral-letter";

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("emr_session")?.value;
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
      await adminAuth.verifySessionCookie(session, true);
    } catch {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`referral:${ip}`, 20, 60_000)) {
      return new Response(JSON.stringify({ error: "Too Many Requests" }), { status: 429 });
    }

    const body = await req.json();
    const parsed = referralBodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
    }

    const { text, model } = parsed.data as { text: string; model?: string };
    const result = await generateReferralLetter({ summary: text, model });

    return new Response(
      JSON.stringify({
        letter: result.letter,
        modelUsed: result.modelUsed,
        usage: result.usage,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[referral-letter] Unexpected error", error);
    const status = error?.code === "MISSING_API_KEY" ? 500 : 500;
    return new Response(JSON.stringify({ error: error?.message || "Unexpected error" }), { status });
  }
}
