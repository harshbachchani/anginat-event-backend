/*
  Warnings:

  - The `phoneNo` column on the `EventRegistration` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `email` column on the `EventRegistration` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "EventRegistration" DROP COLUMN "phoneNo",
ADD COLUMN     "phoneNo" INTEGER[],
DROP COLUMN "email",
ADD COLUMN     "email" TEXT[];
