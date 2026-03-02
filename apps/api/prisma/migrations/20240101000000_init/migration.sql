-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "skillLevel" TEXT NOT NULL,
    "formatPreference" TEXT NOT NULL,
    "typicalStakes" TEXT NOT NULL,
    "mainGoal" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "callCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClaudeCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_telegramId_key" ON "UserProfile"("telegramId");

-- CreateIndex
CREATE INDEX "RateLimit_userId_date_idx" ON "RateLimit"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_userId_date_key" ON "RateLimit"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ClaudeCache_cacheKey_key" ON "ClaudeCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ClaudeCache_cacheKey_idx" ON "ClaudeCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ClaudeCache_expiresAt_idx" ON "ClaudeCache"("expiresAt");
