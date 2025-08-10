import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export type FhirResource = {
  resourceType: string;
  id?: string;
  meta?: { lastUpdated?: string } & Record<string, unknown>;
} & Record<string, unknown>;

function collectionName(resourceType: string): string {
  // Keep a dedicated collection per resource type
  // E.g., Patient -> fhir_Patient, Encounter -> fhir_Encounter
  return `fhir_${resourceType}`;
}

export async function saveFhirResource<T extends FhirResource>(resource: T, preferredId?: string): Promise<string> {
  const col = collection(db, collectionName(resource.resourceType));
  if (preferredId) {
    const ref = doc(col, preferredId);
    const nowIso = new Date().toISOString();
    await setDoc(ref, { ...resource, id: preferredId, meta: { ...(resource.meta || {}), lastUpdated: nowIso } });
    return preferredId;
  }
  // Generate an ID first to also store it inside the resource
  const ref = doc(col);
  const newId = ref.id;
  const nowIso = new Date().toISOString();
  await setDoc(ref, { ...resource, id: newId, meta: { ...(resource.meta || {}), lastUpdated: nowIso } });
  return newId;
}


