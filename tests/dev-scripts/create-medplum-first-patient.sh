#!/bin/bash

echo "🧪 Creating Test Patient (Medplum-First)"
echo "=========================================="
echo ""

# We need to trigger this through the EMR app because it requires Firebase + Medplum auth
# Direct API won't work without proper session

echo "To create a test patient:"
echo ""
echo "1. Open: http://localhost:3000"
echo "2. Log in (if not already)"
echo "3. Go to: Patients → New Patient"
echo "4. Fill in:"
echo "   - Full Name: TestUser MedplumFirst"
echo "   - NRIC: 950505-05-5555"
echo "   - Gender: male"
echo "   - Phone: +60123456789"
echo "   - DOB: 1995-05-05"
echo "   - Address: (anything)"
echo "   - Postal Code: 43000"
echo ""
echo "5. Click 'Register Patient'"
echo ""
echo "Expected console output:"
echo "  ✅ Patient saved to Medplum (source of truth): <id>"
echo "  ✅ Patient cached in Firestore: <id>"
echo ""
echo "Then verify:"
echo "  - EMR UI: http://localhost:3000/patients/<id>"
echo "  - Medplum UI: http://localhost:3001/Patient/<id>"
echo ""


