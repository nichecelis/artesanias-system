/*
  Warnings:

  - You are about to drop the column `cantidad_despacho` on the `pedido_productos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_faltante` on the `pedido_productos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_recibida` on the `pedido_productos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_tareas` on the `pedido_productos` table. All the data in the column will be lost.
  - You are about to drop the column `cortes` on the `pedido_productos` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `pedido_productos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_asignacion` on the `pedido_productos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_conteo` on the `pedido_productos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_despacho` on the `pedido_productos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_inicio_corte` on the `pedido_productos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pedido_productos" DROP COLUMN "cantidad_despacho",
DROP COLUMN "cantidad_faltante",
DROP COLUMN "cantidad_recibida",
DROP COLUMN "cantidad_tareas",
DROP COLUMN "cortes",
DROP COLUMN "estado",
DROP COLUMN "fecha_asignacion",
DROP COLUMN "fecha_conteo",
DROP COLUMN "fecha_despacho",
DROP COLUMN "fecha_inicio_corte";

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "cantidad_despacho" INTEGER,
ADD COLUMN     "cantidad_faltante" INTEGER,
ADD COLUMN     "cantidad_recibida" INTEGER,
ADD COLUMN     "cantidad_tareas" INTEGER,
ADD COLUMN     "cortes" INTEGER,
ADD COLUMN     "fecha_asignacion" DATE,
ADD COLUMN     "fecha_conteo" DATE,
ADD COLUMN     "fecha_despacho" DATE,
ADD COLUMN     "fecha_inicio_corte" DATE;

-- CreateIndex
CREATE INDEX "pedido_productos_pedido_id_idx" ON "pedido_productos"("pedido_id");

-- CreateIndex
CREATE INDEX "pedido_productos_producto_id_idx" ON "pedido_productos"("producto_id");

-- CreateIndex
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE INDEX "pedidos_codigo_idx" ON "pedidos"("codigo");

-- CreateIndex
CREATE INDEX "pedidos_fecha_despacho_idx" ON "pedidos"("fecha_despacho");
