-- CreateTable
CREATE TABLE "VacancyView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VacancyView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VacancyView_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VacancyFavorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VacancyFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VacancyFavorite_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VacancyView_userId_viewedAt_idx" ON "VacancyView"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VacancyView_userId_jobId_key" ON "VacancyView"("userId", "jobId");

-- CreateIndex
CREATE INDEX "VacancyFavorite_userId_addedAt_idx" ON "VacancyFavorite"("userId", "addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VacancyFavorite_userId_jobId_key" ON "VacancyFavorite"("userId", "jobId");
