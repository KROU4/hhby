# Database Migration Guide

## Issue

If you're seeing an error like:
```
The column `subscriptionTier` does not exist in the current database.
```

This means the database schema needs to be updated with the latest migrations.

## Solution

### On Windows (Quick Fix)

Simply run the setup script in the `backend` directory:

```bash
cd backend
setup-database.bat
```

### Manual Steps (Any Platform)

If the script doesn't work, run these commands manually:

```bash
cd backend

# Apply all pending migrations
npx prisma migrate deploy

# Regenerate Prisma Client
npx prisma generate
```

### Development Migration (Alternative)

If you're in development and want to create a new migration:

```bash
cd backend
npx prisma migrate dev
```

This will:
1. Apply all pending migrations
2. Generate the Prisma Client
3. Sync your database schema with the Prisma schema

## What Changed?

The latest updates added:
- **Subscription system** (tiers, limits, features)
- **Session management** (multi-device login tracking)
- **Audit logging** (security event tracking)
- **User subscription fields** (tier, limits, daily counters)

## Verify It Worked

After running the migration, you should be able to:
1. ✅ Login without database errors
2. ✅ Access the `/subscription` page
3. ✅ View your active sessions at `/sessions`
4. ✅ See your daily response limit

## Troubleshooting

### "Migration already applied" error

If you see this error, it means the migration is already in your database. Try:

```bash
npx prisma generate
```

### Database locked error

Make sure the backend server is not running when applying migrations:

```bash
# Stop the backend server first
# Then run migrations
npx prisma migrate deploy
```

### Still having issues?

Delete the database and start fresh (WARNING: This will delete all data):

```bash
# In backend directory
rm -f prisma/dev.db
npx prisma migrate deploy
```

On Windows:
```bash
del prisma\dev.db
npx prisma migrate deploy
```
