-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'ANSWERED', 'CLOSED');

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "symptomsDescription" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiries_specialtyId_idx" ON "inquiries"("specialtyId");

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");
