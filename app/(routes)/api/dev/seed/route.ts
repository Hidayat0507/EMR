import { NextRequest } from "next/server";
import { db } from "@/lib/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";

function randomPhone() {
  return "01" + Math.floor(100000000 + Math.random() * 899999999)
    .toString()
    .slice(0, 8);
}

function randomDate(yearsBack = 60) {
  const start = new Date();
  start.setFullYear(start.getFullYear() - yearsBack);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed(count: number) {
  const names = [
      "Ali Bin Ahmad",
      "Aisha Binti Musa",
      "John Tan",
      "Siti Nurhaliza",
      "Michael Lee",
      "Nurul Izzah",
      "Hafiz Rahman",
      "Chong Wei",
      "Gurpreet Singh",
      "Aminah Ismail",
      "David Lim",
      "Farah Nadia",
      "Ismail Zain",
      "Rahimah Kassim",
      "Kelvin Ong",
    ];

    const created: string[] = [];
    let errors = 0;
    let lastError: string | undefined;

    for (let i = 0; i < Math.max(1, Math.min(30, count)); i++) {
      const fullName = names[i % names.length];
      const nric = `${(80 + (i % 20)).toString().padStart(2, "0")}${(1 + (i % 12))
        .toString()
        .padStart(2, "0")}${(10 + (i % 20)).toString().padStart(2, "0")}-${(50 + (i % 50))
        .toString()
        .padStart(2, "0")}-${(1000 + i).toString()}`;

      const patient = {
        fullName,
        nric,
        dateOfBirth: randomDate(70),
        gender: i % 2 === 0 ? "male" : "female",
        email: "",
        phone: randomPhone(),
        address: "123 Demo Street",
        postalCode: "43000",
        emergencyContact: { name: "EC " + fullName.split(" ")[0], relationship: "Spouse", phone: randomPhone() },
        medicalHistory: { allergies: [], conditions: [], medications: [] },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        queueStatus: null,
      } as any;

      try {
        const patientRef = await addDoc(collection(db, "patients"), patient);
        const consultation = {
          patientId: patientRef.id,
          date: randomDate(1),
          chiefComplaint: "Fever and cough for 3 days",
          diagnosis: i % 2 === 0 ? "Upper respiratory tract infection" : "Gastritis",
          procedures: [{ name: "Consultation Fee", price: 30 }],
          notes: "No red flags. Advise rest and hydration.",
          prescriptions: [
            { medication: { id: "temp-paracetamol", name: "Paracetamol" }, frequency: "tds", duration: "3d", price: 12 },
          ],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        } as any;
        const consultRef = await addDoc(collection(db, "consultations"), consultation);
        created.push(`${patientRef.id}:${consultRef.id}`);
      } catch (e) {
        errors += 1;
        lastError = e instanceof Error ? e.message : 'write failed';
      }
      // small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 50));
    }
    return { createdCount: created.length, errors, lastError };
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return new Response(JSON.stringify({ error: "Disabled outside development" }), { status: 403 });
    }

    const { count = 12 } = (await req.json().catch(() => ({}))) as { count?: number };
    const result = await seed(count);
    return new Response(JSON.stringify({ ok: true, ...result }), { status: 200 });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return new Response(JSON.stringify({ error: "Disabled outside development" }), { status: 403 });
    }
    const url = new URL(req.url);
    const count = Number(url.searchParams.get('count') || '12');
    const result = await seed(count);
    return new Response(JSON.stringify({ ok: true, ...result }), { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}


