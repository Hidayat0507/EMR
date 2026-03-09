import { NextRequest, NextResponse } from "next/server";
import {
  completePOCTTest,
  createPOCTTest,
  getPOCTTestsByStatus,
  getTodaysPOCTTests,
  updatePOCTTest,
} from "@/modules/poct/poct-models";
import type { POCTTest } from "@/modules/poct/types";
import { getCurrentProfile, requireAuth } from "@/lib/server/medplum-auth";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const IDEMPOTENCY_DIR = path.join(process.cwd(), ".codex");
const IDEMPOTENCY_FILE = path.join(IDEMPOTENCY_DIR, "poct-order-idempotency.json");

type CreateResponsePayload = {
  success: boolean;
  id: string;
  syncedAt: string;
};

type IdempotencyEntry = {
  createdAt: string;
  response: CreateResponsePayload;
};

async function readIdempotencyStore(): Promise<Record<string, IdempotencyEntry>> {
  try {
    const raw = await readFile(IDEMPOTENCY_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeIdempotencyStore(store: Record<string, IdempotencyEntry>): Promise<void> {
  await mkdir(IDEMPOTENCY_DIR, { recursive: true });
  await writeFile(IDEMPOTENCY_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? "today";
    const statusFilter = searchParams.get("status");

    let tests: POCTTest[];

    if (scope === "all") {
      const [pending, completed, cancelled] = await Promise.all([
        getPOCTTestsByStatus("pending"),
        getPOCTTestsByStatus("completed"),
        getPOCTTestsByStatus("cancelled"),
      ]);
      const deduped = new Map<string, POCTTest>();
      [...pending, ...completed, ...cancelled].forEach((test) => {
        deduped.set(test.id, test);
      });
      tests = Array.from(deduped.values());
    } else {
      tests = await getTodaysPOCTTests();
    }

    if (statusFilter) {
      tests = tests.filter((test) => test.status === statusFilter);
    }

    tests.sort((a, b) => {
      const aTs = new Date(a.orderedAt).getTime();
      const bTs = new Date(b.orderedAt).getTime();
      return bTs - aTs;
    });

    return NextResponse.json({ success: true, tests });
  } catch (error: any) {
    console.error("[poct/tests] Failed to list tests:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list POCT tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const idempotencyKey = request.headers.get("x-idempotency-key") || "";
    const {
      patientId,
      patientName,
      testType,
      testName,
      urgency = "routine",
      notes,
      consultationId,
      orderedBy = "System User",
    } = body ?? {};

    if (idempotencyKey) {
      const store = await readIdempotencyStore();
      const existing = store[idempotencyKey];
      if (existing) {
        return NextResponse.json(existing.response);
      }
    }

    if (!patientId || !testType || !testName) {
      return NextResponse.json(
        { success: false, error: "patientId, testType, and testName are required" },
        { status: 400 }
      );
    }

    let requesterName = orderedBy;
    try {
      const profile = await getCurrentProfile(request);
      if (profile.resourceType === "Practitioner") {
        requesterName = (profile as any).name?.[0]?.text || orderedBy;
      }
    } catch {
      // Keep fallback orderedBy when caller is unauthenticated.
    }

    const nowIso = new Date().toISOString();
    const id = await createPOCTTest({
      patientId,
      patientName,
      consultationId,
      testType,
      testName,
      status: "pending",
      orderedBy: requesterName,
      orderedAt: nowIso,
      notes,
      urgency,
      createdAt: nowIso,
    });
    const responsePayload: CreateResponsePayload = { success: true, id, syncedAt: nowIso };

    if (idempotencyKey) {
      const store = await readIdempotencyStore();
      store[idempotencyKey] = {
        createdAt: nowIso,
        response: responsePayload,
      };
      const entries = Object.entries(store)
        .sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime())
        .slice(0, 500);
      await writeIdempotencyStore(Object.fromEntries(entries));
    }

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("[poct/tests] Failed to create test:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create POCT test" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { id, status, notes, urgency, result } = body ?? {};

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const allowedStatuses: POCTTest["status"][] = ["pending", "in_progress", "completed", "cancelled"];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "status must be one of pending, in_progress, completed, cancelled" },
        { status: 400 }
      );
    }

    if (status === "completed") {
      const hasResultPayload =
        result &&
        typeof result === "object" &&
        (
          typeof result.resultType === "string" ||
          typeof result.findings === "string" ||
          typeof result.interpretation === "string" ||
          typeof result.numericValue === "number"
        );
      if (!hasResultPayload) {
        return NextResponse.json(
          { success: false, error: "Result payload is required when completing a POCT test" },
          { status: 400 }
        );
      }

      let performer = "POCT Staff";
      try {
        const profile = await getCurrentProfile(request);
        if (profile.resourceType === "Practitioner") {
          performer = (profile as any).name?.[0]?.text || performer;
        }
      } catch {
        // Non-blocking fallback to default performer label.
      }

      // Record completion in Medplum with a DiagnosticReport and completed ServiceRequest status.
      await completePOCTTest(
        id,
        {
          resultType: result.resultType || "normal",
          findings: result.findings || notes || "",
          interpretation: result.interpretation || notes || "",
          numericValue: typeof result.numericValue === "number" ? result.numericValue : undefined,
          unit: result.unit,
          referenceRange: result.referenceRange,
        },
        performer
      );
    } else {
      await updatePOCTTest(id, {
        status,
        notes,
        urgency,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, id, status });
  } catch (error: any) {
    console.error("[poct/tests] Failed to update test:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update POCT test" },
      { status: 500 }
    );
  }
}
