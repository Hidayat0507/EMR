// Seed procedures into Firestore from mock data
// Run: bun tsx scripts/seed-procedures.ts

import { createProcedure } from '@/lib/procedures';
import { procedures as mockProcedures } from '@/lib/mock-data';

async function seedProcedures() {
  console.log('Seeding procedures...');
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
    } catch (e) {
      console.error('Failed to create procedure', p.name, e);
    }
  }
  console.log(`Done. Created ${created} procedures.`);
}

seedProcedures().catch((e) => { console.error(e); process.exit(1); });


