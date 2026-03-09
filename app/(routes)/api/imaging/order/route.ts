/**
 * API endpoint to order imaging studies
 * 
 * POST /api/imaging/order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createImagingOrder, type ImagingOrderRequest } from '@/lib/fhir/imaging-service';
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = 'nodejs';

const IDEMPOTENCY_DIR = path.join(process.cwd(), ".codex");
const IDEMPOTENCY_FILE = path.join(IDEMPOTENCY_DIR, "imaging-order-idempotency.json");

type IdempotencyEntry = {
  createdAt: string;
  response: {
    success: boolean;
    serviceRequestId: string;
    message: string;
  };
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

export async function POST(request: NextRequest) {
  try {
    const body: ImagingOrderRequest = await request.json();
    const idempotencyKey = request.headers.get("x-idempotency-key") || "";

    if (idempotencyKey) {
      const store = await readIdempotencyStore();
      const existing = store[idempotencyKey];
      if (existing) {
        return NextResponse.json(existing.response);
      }
    }

    // Validate required fields
    if (!body.patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      );
    }

    if (!body.procedures || !Array.isArray(body.procedures) || body.procedures.length === 0) {
      return NextResponse.json(
        { error: 'procedures array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!body.clinicalIndication?.trim()) {
      return NextResponse.json(
        { error: 'clinicalIndication is required for imaging orders' },
        { status: 400 }
      );
    }

    // Create the imaging order
    const serviceRequestId = await createImagingOrder(body);

    const responsePayload = {
      success: true,
      serviceRequestId,
      message: `Imaging order created for ${body.procedures.length} procedures`,
    };

    if (idempotencyKey) {
      const store = await readIdempotencyStore();
      store[idempotencyKey] = {
        createdAt: new Date().toISOString(),
        response: responsePayload,
      };
      const entries = Object.entries(store)
        .sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime())
        .slice(0, 500);
      await writeIdempotencyStore(Object.fromEntries(entries));
    }

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error('Error creating imaging order:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create imaging order',
        details: error.message 
      },
      { status: 500 }
    );
  }
}







