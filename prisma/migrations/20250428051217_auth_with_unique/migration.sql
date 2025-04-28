/*
  Warnings:

  - A unique constraint covering the columns `[auth]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "notifications_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "notifications_auth_key" ON "notifications"("auth");
