import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export interface OrganizationDetails {
  logoUrl?: string | null;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
}

export async function fetchOrganizationDetails(): Promise<OrganizationDetails | null> {
  try {
    const snapshot = await getDoc(doc(db, "settings", "org"));
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data() as Record<string, unknown>;
    return {
      logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
      name: typeof data.name === "string" ? data.name : undefined,
      address: typeof data.address === "string" ? data.address : undefined,
      phone: typeof data.phone === "string" ? data.phone : undefined,
    };
  } catch (error) {
    console.error("Failed to fetch organization details:", error);
    return null;
  }
}
