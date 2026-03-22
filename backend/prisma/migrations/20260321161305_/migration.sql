/*
  Warnings:

  - You are about to drop the column `abonos` on the `facturas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "facturas" DROP COLUMN "abonos",
ADD COLUMN     "monto_pagado" DECIMAL(12,2) NOT NULL DEFAULT 0;
