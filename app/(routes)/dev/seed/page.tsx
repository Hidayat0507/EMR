"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createPatient, createConsultation, Patient } from "@/lib/models";
import { createProcedure, getProcedures } from "@/lib/procedures";
import { procedures as mockProcedures } from "@/lib/mock-data";

function randomPhone() { return '01' + Math.floor(100000000 + Math.random()*899999999).toString().slice(0,8); }
function randomDate(yearsBack = 60) {
  const start = new Date(); start.setFullYear(start.getFullYear() - yearsBack);
  const end = new Date();
  return new Date(start.getTime() + Math.random()*(end.getTime()-start.getTime()));
}

const names = [
  'Ali Bin Ahmad','Aisha Binti Musa','John Tan','Siti Nurhaliza','Michael Lee',
  'Nurul Izzah','Hafiz Rahman','Chong Wei','Gurpreet Singh','Aminah Ismail',
  'David Lim','Farah Nadia','Ismail Zain','Rahimah Kassim','Kelvin Ong'
];

export default function DevSeedPage() {
  const [count, setCount] = useState<number>(10);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const [procCount, setProcCount] = useState<number>(0);
  const [procSeeding, setProcSeeding] = useState<boolean>(false);

  // Load current procedures count
  useEffect(() => {
    (async () => {
      try {
        const list = await getProcedures();
        setProcCount(list.length);
      } catch {}
    })();
  }, []);

  const seedProceduresOnly = async () => {
    if (procSeeding) return;
    setProcSeeding(true);
    try {
      let created = 0;
      for (const p of mockProcedures) {
        try {
          await createProcedure({
            name: p.name,
            codingSystem: p.codingSystem,
            codingCode: p.codingCode,
            codingDisplay: p.codingDisplay,
            category: p.category,
            defaultPrice: p.defaultPrice,
            notes: p.notes,
          });
          created++;
        } catch {}
      }
      const list = await getProcedures();
      setProcCount(list.length);
      toast({ title: 'Procedures seeded', description: `Inserted ${created} procedures (total: ${list.length})` });
    } catch (e: any) {
      toast({ title: 'Seeding failed', description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setProcSeeding(false);
    }
  };

  const run = async () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    try {
      const total = Math.max(1, Math.min(30, count));
      // Seed procedures first (idempotent-ish; duplicates possible if run repeatedly)
      for (const p of mockProcedures) {
        try {
          await createProcedure({
            name: p.name,
            codingSystem: p.codingSystem,
            codingCode: p.codingCode,
            codingDisplay: p.codingDisplay,
            category: p.category,
            defaultPrice: p.defaultPrice,
            notes: p.notes,
          });
        } catch {}
      }
      const procs = await getProcedures();
      setProcCount(procs.length);
       for (let i = 0; i < total; i++) {
        const fullName = names[i % names.length];
        const nric = `${(80 + (i%20)).toString().padStart(2,'0')}${(1 + (i%12)).toString().padStart(2,'0')}${(10 + (i%20)).toString().padStart(2,'0')}-${(50 + (i%50)).toString().padStart(2,'0')}-${(2000 + i).toString()}`;
        const patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> = {
          fullName,
          nric,
          dateOfBirth: randomDate(70),
          gender: i % 2 === 0 ? 'male' : 'female',
          email: '',
          phone: randomPhone(),
          address: '123 Demo Street',
          postalCode: '43000',
          emergencyContact: { name: 'EC ' + fullName.split(' ')[0], relationship: 'Spouse', phone: randomPhone() },
          medicalHistory: { allergies: [], conditions: [], medications: [] },
        } as any;
        const patientId = await createPatient(patientData);
        await createConsultation({
          patientId,
          date: randomDate(1),
          chiefComplaint: 'Fever and cough for 3 days',
          diagnosis: i % 2 === 0 ? 'Upper respiratory tract infection' : 'Gastritis',
          procedures: [{ name: 'Consultation Fee', price: 30 }],
          notes: 'No red flags. Advise rest and hydration.',
          prescriptions: [ { medication: { id: 'temp-paracetamol', name: 'Paracetamol' }, frequency: 'tds', duration: '3d', price: 12 } ],
        });
         setProgress(i + 1);
        await new Promise(r => setTimeout(r, 50));
      }
       toast({ title: 'Seeded', description: `Created ${count} dummy patients & consultations; procedures inserted` });
    } catch (e: any) {
      toast({ title: 'Seeding failed', description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="container max-w-xl py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Procedures Seeder</CardTitle>
          <CardDescription>Insert mock procedures (FHIR-coded). Current total: {procCount}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={seedProceduresOnly} disabled={procSeeding}>
            {procSeeding ? 'Seeding…' : 'Seed Procedures'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Development Seeder</CardTitle>
          <CardDescription>Create dummy patients and consultations (client-side)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input type="number" value={count} min={1} max={30} onChange={(e) => setCount(Number(e.target.value))} className="w-28" />
            <span className="text-sm text-muted-foreground">records</span>
            <Button onClick={run} disabled={running}>Seed</Button>
          </div>
          {running && <div className="text-sm">Progress: {progress}/{count}</div>}
        </CardContent>
      </Card>
    </div>
  );
}



