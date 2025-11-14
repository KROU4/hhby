-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "text" TEXT,
    "area" TEXT,
    "salary" INTEGER,
    "experience" TEXT,
    "schedule" TEXT,
    "name" TEXT,
    "resultCount" INTEGER,
    "useCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "vacancyTitle" TEXT NOT NULL,
    "vacancyCompany" TEXT NOT NULL,
    "vacancyUrl" TEXT NOT NULL,
    "resumeId" TEXT,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApplicationDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SearchHistory_userId_lastUsedAt_idx" ON "SearchHistory"("userId", "lastUsedAt");

-- CreateIndex
CREATE INDEX "ApplicationDraft_userId_updatedAt_idx" ON "ApplicationDraft"("userId", "updatedAt");
