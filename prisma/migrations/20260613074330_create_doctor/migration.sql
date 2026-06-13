-- CreateEnum
CREATE TYPE "DoctorTitle" AS ENUM ('PROFESSOR', 'CONSULTANT', 'SPECIALIST');

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "title" "DoctorTitle" NOT NULL,
    "location" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Doctor_specialtyId_rating_idx" ON "Doctor"("specialtyId", "rating");

-- CreateIndex
CREATE INDEX "Doctor_location_price_idx" ON "Doctor"("location", "price");
