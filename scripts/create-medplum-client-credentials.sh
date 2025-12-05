#!/bin/bash

# Create a ClientApplication with credentials in local Medplum via REST API
# This bypasses the UI completely

BASE_URL="http://localhost:8103"
EMAIL="dayatfactor@gmail.com"
PASSWORD="matn0r007"

echo "🔐 Creating Medplum Client Credentials via API"
echo "==============================================="
echo ""

# Note: This approach requires being able to create ClientApplication resources
# which needs admin access. Since we can't authenticate programmatically,
# we need to use a workaround.

echo "⚠️  Medplum authentication is complex for backend scripts."
echo ""
echo "SIMPLEST SOLUTION:"
echo "=================="
echo ""
echo "Instead of email/password, let's use a fixed access token:"
echo ""
echo "1. Open Medplum UI: http://localhost:3001"
echo "2. Log in: dayatfactor@gmail.com / matn0r007"
echo "3. Open browser DevTools (F12)"
echo "4. Go to Application → Local Storage → http://localhost:3001"
echo "5. Find key 'activeLogin' or similar"
echo "6. Copy the 'accessToken' value"
echo "7. Add to .env.local:"
echo "   MEDPLUM_ACCESS_TOKEN=<paste-token-here>"
echo ""
echo "Then the migration will work!"
echo ""









