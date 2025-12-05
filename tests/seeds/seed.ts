// Seed 10-15 dummy patients and consultations into Firestore
// Run: bun tsx scripts/seed.ts

import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

function randomPhone() { return '01' + Math.floor(100000000 + Math.random()*899999999).toString().slice(0,8); }
function randomDate(yearsBack = 60) {
  const start = new Date(); start.setFullYear(start.getFullYear() - yearsBack);
  const end = new Date();
  return new Date(start.getTime() + Math.random()*(end.getTime()-start.getTime()));
}

async function seed() {
  const names = [
    'Ali Bin Ahmad','Aisha Binti Musa','John Tan','Siti Nurhaliza','Michael Lee',
    'Nurul Izzah','Hafiz Rahman','Chong Wei','Gurpreet Singh','Aminah Ismail',
    'David Lim','Farah Nadia','Ismail Zain','Rahimah Kassim','Kelvin Ong'
  ];

  console.log('Seeding patients and consultations...');
  for (let i = 0; i < 12; i++) {
    const fullName = names[i % names.length];
    const nric = `${(80 + (i%20)).toString().padStart(2,'0')}${(1 + (i%12)).toString().padStart(2,'0')}${(10 + (i%20)).toString().padStart(2,'0')}-${(50 + (i%50)).toString().padStart(2,'0')}-${(1000 + i).toString()}`;
    const patient = {
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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      queueStatus: null,
    } as any;

    const patientRef = await addDoc(collection(db, 'patients'), patient);

    const consultation = {
      patientId: patientRef.id,
      date: randomDate(1),
      chiefComplaint: 'Fever and cough for 3 days',
      diagnosis: i % 2 === 0 ? 'Upper respiratory tract infection' : 'Gastritis',
      procedures: [ { name: 'Consultation Fee', price: 30 } ],
      notes: 'No red flags. Advise rest and hydration.',
      prescriptions: [ { medication: { id: 'temp-paracetamol', name: 'Paracetamol' }, frequency: 'tds', duration: '3d', price: 12 } ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as any;

    await addDoc(collection(db, 'consultations'), consultation);
    console.log(`Seeded patient ${fullName} with a consultation`);
  }
  console.log('Done.');
}

seed().catch((e) => { console.error(e); process.exit(1); });



