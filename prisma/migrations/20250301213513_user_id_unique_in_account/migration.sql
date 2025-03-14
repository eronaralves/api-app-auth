/*
  Warnings:

  - A unique constraint covering the columns `[provider,userId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Account_provider_key";

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_userId_key" ON "Account"("provider", "userId");
