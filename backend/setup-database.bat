@echo off
REM Database setup script for HH Auto-Responder
REM This script applies all pending Prisma migrations

echo.
echo 🔧 Setting up database...
echo.

REM Check if .env file exists
if not exist .env (
    echo ❌ Error: .env file not found!
    echo Please create a .env file with DATABASE_URL
    exit /b 1
)

REM Apply migrations
echo 📦 Applying Prisma migrations...
call npx prisma migrate deploy

REM Generate Prisma client
echo 🔨 Generating Prisma Client...
call npx prisma generate

echo.
echo ✅ Database setup complete!
echo.
echo You can now start the backend server with: npm run dev
echo.
pause
