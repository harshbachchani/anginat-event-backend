-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Client', 'Employee');

-- CreateEnum
CREATE TYPE "RegistrationMode" AS ENUM ('ONLINE', 'ONSITE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'Client',
    "companyName" TEXT,
    "googleId" TEXT,
    "phoneNo" TEXT,
    "refreshToken" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "eventName" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL,
    "image" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "userJourney" TEXT[],
    "eventTemplate" JSONB NOT NULL,
    "attendieType" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" INTEGER NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userName" TEXT NOT NULL,
    "formValues" JSONB NOT NULL,
    "profile" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'ACTIVE',
    "modeOfRegistration" "RegistrationMode" NOT NULL DEFAULT 'ONLINE',
    "location" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "QR" TEXT NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserJourney" (
    "id" SERIAL NOT NULL,
    "value" BOOLEAN NOT NULL,
    "action" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER,

    CONSTRAINT "UserJourney_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_googleId_key" ON "Admin"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_phoneNo_key" ON "Admin"("phoneNo");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJourney" ADD CONSTRAINT "UserJourney_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJourney" ADD CONSTRAINT "UserJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "EventRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
