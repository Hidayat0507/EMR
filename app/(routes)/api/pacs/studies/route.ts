import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllImagingStudies } from "@/modules/pacs/pacs-models";
import type { ImagingStudy } from "@/modules/pacs/types";

export const runtime = "nodejs";

const CACHE_DIR = path.join(process.cwd(), ".codex");
const CACHE_FILE = path.join(CACHE_DIR, "pacs-studies-cache.json");

async function readCachedStudies(): Promise<ImagingStudy[]> {
  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeCachedStudies(studies: ImagingStudy[]): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(studies.slice(0, 500), null, 2), "utf8");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function mergeStudies(primary: ImagingStudy[], secondary: ImagingStudy[]): ImagingStudy[] {
  return Array.from(
    new Map([...primary, ...secondary].map((study) => [study.id, study])).values()
  );
}

export async function GET() {
  const cachedStudies = await readCachedStudies();

  try {
    const medplumStudies = await withTimeout(getAllImagingStudies(), 2000);
    const merged = mergeStudies(medplumStudies, cachedStudies);
    if (merged.length !== cachedStudies.length || merged.length !== medplumStudies.length) {
      await writeCachedStudies(merged);
    }
    return NextResponse.json({
      success: true,
      studies: merged,
      source: cachedStudies.length > 0 ? "mixed" : "live",
    });
  } catch {
    return NextResponse.json({
      success: true,
      studies: cachedStudies,
      source: "cache",
      warning: "Live imaging source unavailable. Showing cached studies.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { study?: ImagingStudy };
    if (!body.study?.id) {
      return NextResponse.json({ success: false, error: "study.id is required" }, { status: 400 });
    }

    const cached = await readCachedStudies();
    const merged = mergeStudies([body.study], cached);
    await writeCachedStudies(merged);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to cache study" },
      { status: 500 }
    );
  }
}
