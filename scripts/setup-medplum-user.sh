#!/bin/bash
# Setup Medplum user for UCC EMR backend

EMAIL="ucc-backend@localhost"
PASSWORD="UCCBackend123!"

echo "Creating Medplum user account..."
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo ""

# Register user via Medplum UI (you'll need to do this manually)
echo "==================================================================="
echo "MANUAL STEP REQUIRED:"
echo "==================================================================="
echo ""
echo "1. Open: http://localhost:3001"
echo "2. Click 'Register'"
echo "3. Enter:"
echo "   - Email: $EMAIL"
echo "   - Password: $PASSWORD"
echo "   - First Name: UCC"
echo "   - Last Name: Backend"
echo "   - Project Name: UCC-FHIR"
echo "4. Click Register"
echo ""
echo "Once registered, add to your .env.local:"
echo ""
echo "MEDPLUM_BASE_URL=http://localhost:8103"
echo "MEDPLUM_EMAIL=$EMAIL"
echo "MEDPLUM_PASSWORD=$PASSWORD"
echo ""
echo "==================================================================="









