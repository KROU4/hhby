#!/bin/bash

# Database setup script for HH Auto-Responder
# This script applies all pending Prisma migrations

echo "🔧 Setting up database..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with DATABASE_URL"
    exit 1
fi

# Apply migrations
echo "📦 Applying Prisma migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔨 Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Database setup complete!"
echo ""
echo "You can now start the backend server with: npm run dev"
