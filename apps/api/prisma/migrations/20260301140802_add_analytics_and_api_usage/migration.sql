-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT,
    "event" TEXT NOT NULL,
    "module" TEXT,
    "durationMs" INTEGER,
    "isError" BOOLEAN NOT NULL DEFAULT false,
    "errorMsg" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costUsd" REAL NOT NULL,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_event_createdAt_idx" ON "AnalyticsEvent"("event", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_telegramId_createdAt_idx" ON "AnalyticsEvent"("telegramId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_isError_createdAt_idx" ON "AnalyticsEvent"("isError", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_telegramId_createdAt_idx" ON "ApiUsage"("telegramId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_createdAt_idx" ON "ApiUsage"("createdAt");
