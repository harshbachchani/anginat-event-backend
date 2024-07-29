/*
  Warnings:

  - The values [Employee] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('Admin', 'Client');
ALTER TABLE "Admin" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Admin" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "Admin" ALTER COLUMN "role" SET DEFAULT 'Client';
COMMIT;

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeOrganization" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "role" TEXT,

    CONSTRAINT "EmployeeOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_phoneNo_key" ON "Employee"("phoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeOrganization_employeeId_adminId_key" ON "EmployeeOrganization"("employeeId", "adminId");

-- AddForeignKey
ALTER TABLE "EmployeeOrganization" ADD CONSTRAINT "EmployeeOrganization_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeOrganization" ADD CONSTRAINT "EmployeeOrganization_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
