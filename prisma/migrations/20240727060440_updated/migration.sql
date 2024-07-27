-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'NONE';

-- AlterTable
ALTER TABLE "EventRegistration" ALTER COLUMN "paymentStatus" SET DEFAULT 'NONE',
ALTER COLUMN "QR" DROP NOT NULL;
