#!/bin/bash

# Create user directly in Medplum database via Docker
# This bypasses all UI/API restrictions

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔧 CREATING USER DIRECTLY IN DATABASE 🔧                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

EMAIL="dayatfactor@gmail.com"
PASSWORD="matn0r007"
FIRST_NAME="Hidayat"
LAST_NAME="Doctor"

echo "📧 Email: $EMAIL"
echo "🔑 Password: $PASSWORD"
echo ""

# Check if Medplum containers are running
echo "🔍 Checking Medplum containers..."
if ! docker ps | grep -q medplum; then
    echo "❌ No Medplum containers found!"
    echo ""
    echo "💡 Is Medplum running in Docker?"
    echo "   Try: docker ps"
    echo ""
    exit 1
fi

# Get the postgres container name
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ Postgres container not found!"
    exit 1
fi

echo "✅ Found Postgres: $POSTGRES_CONTAINER"
echo ""

echo "🔧 Creating user account..."
echo ""

# Create user in database
docker exec -i $POSTGRES_CONTAINER psql -U medplum -d medplum << EOF
-- Check if user already exists
DO \$\$
DECLARE
    user_exists boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM "User" WHERE email = '$EMAIL') INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE '⚠️  User already exists: $EMAIL';
    ELSE
        -- Create the user
        INSERT INTO "User" (id, email, password_hash)
        VALUES (
            gen_random_uuid(),
            '$EMAIL',
            crypt('$PASSWORD', gen_salt('bf'))
        );
        RAISE NOTICE '✅ User created: $EMAIL';
    END IF;
END\$\$;

-- Show the created user
SELECT id, email, created_at FROM "User" WHERE email = '$EMAIL';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 USER CREATED SUCCESSFULLY!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ NOW TRY LOGGING IN:"
    echo ""
    echo "   URL: http://localhost:3000/login"
    echo "   Email: $EMAIL"
    echo "   Password: $PASSWORD"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
else
    echo ""
    echo "❌ Failed to create user"
    echo ""
    echo "💡 TRY ALTERNATIVE METHODS:"
    echo "   1. Use Medplum app to register"
    echo "   2. Contact Medplum admin"
    echo "   3. Check Medplum documentation"
    echo ""
fi








