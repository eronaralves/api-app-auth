-- CreateTable
CREATE TABLE "notifications" (
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_notificationId_userId_key" ON "notifications"("notificationId", "userId");
