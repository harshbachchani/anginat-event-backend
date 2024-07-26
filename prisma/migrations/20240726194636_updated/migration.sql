/*
  Warnings:

  - You are about to drop the column `profile` on the `EventRegistration` table. All the data in the column will be lost.
  - The `phoneNo` column on the `EventRegistration` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "EventRegistration" DROP COLUMN "profile",
ALTER COLUMN "userName" DROP NOT NULL,
ALTER COLUMN "location" DROP NOT NULL,
DROP COLUMN "phoneNo",
ADD COLUMN     "phoneNo" INTEGER,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "email" SET DATA TYPE TEXT;
