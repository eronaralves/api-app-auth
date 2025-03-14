/*
  Warnings:

  - You are about to drop the column `notificationId` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `auth` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endpoint` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `p256dh` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notifications" (
    "userId" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_notifications" ("userId") SELECT "userId" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
CREATE UNIQUE INDEX "notifications_userId_key" ON "notifications"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
