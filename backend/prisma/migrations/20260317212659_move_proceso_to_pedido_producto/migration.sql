/*
  Warnings:

  - You are about to drop the column `cantidad_despacho` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_faltante` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_recibida` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_tareas` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cortes` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_asignacion` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_conteo` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_despacho` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_inicio_corte` on the `pedidos` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "pedidos_cliente_id_idx";

-- DropIndex
DROP INDEX "pedidos_codigo_idx";

-- DropIndex
DROP INDEX "pedidos_estado_idx";

-- DropIndex
DROP INDEX "pedidos_fecha_despacho_idx";

-- AlterTable
ALTER TABLE "pedido_productos" ADD COLUMN     "cantidadDespacho" INTEGER,
ADD COLUMN     "cantidadFaltante" INTEGER,
ADD COLUMN     "cantidadRecibida" INTEGER,
ADD COLUMN     "cantidadTareas" INTEGER,
ADD COLUMN     "cortes" INTEGER,
ADD COLUMN     "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fecha_asignacion" DATE,
ADD COLUMN     "fecha_conteo" DATE,
ADD COLUMN     "fecha_despacho" DATE,
ADD COLUMN     "fecha_inicio_corte" DATE;

-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "cantidad_despacho",
DROP COLUMN "cantidad_faltante",
DROP COLUMN "cantidad_recibida",
DROP COLUMN "cantidad_tareas",
DROP COLUMN "cortes",
DROP COLUMN "fecha_asignacion",
DROP COLUMN "fecha_conteo",
DROP COLUMN "fecha_despacho",
DROP COLUMN "fecha_inicio_corte";

-- CreateIndex
CREATE INDEX "pedido_productos_estado_idx" ON "pedido_productos"("estado");
