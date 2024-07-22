/*
  Warnings:

  - You are about to drop the column `status` on the `EventRegistration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "EventRegistration" DROP COLUMN "status";
