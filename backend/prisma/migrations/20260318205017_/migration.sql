/*
  Warnings:

  - You are about to drop the column `cortes` on the `pedido_productos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pedido_productos" DROP COLUMN "cortes",
ADD COLUMN     "corte1" INTEGER,
ADD COLUMN     "corte2" INTEGER,
ADD COLUMN     "corte3" INTEGER;
