-- CreateTable
CREATE TABLE "SessionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shareCode" TEXT,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TrainingScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'Anonymous',
    "totalDrills" INTEGER NOT NULL DEFAULT 0,
    "correctDrills" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationPref" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSent" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionHistory_shareCode_key" ON "SessionHistory"("shareCode");

-- CreateIndex
CREATE INDEX "SessionHistory_telegramId_createdAt_idx" ON "SessionHistory"("telegramId", "createdAt");

-- CreateIndex
CREATE INDEX "SessionHistory_shareCode_idx" ON "SessionHistory"("shareCode");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingScore_telegramId_key" ON "TrainingScore"("telegramId");

-- CreateIndex
CREATE INDEX "TrainingScore_correctDrills_idx" ON "TrainingScore"("correctDrills");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPref_telegramId_key" ON "NotificationPref"("telegramId");
