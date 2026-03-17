/*
  Warnings:

  - You are about to drop the column `grupo` on the `decoradoras` table. All the data in the column will be lost.
  - You are about to drop the column `prestamos` on the `nomina` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_despacho` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_faltante` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_pedido` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_plancha` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_recibida` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_tareas` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `cortes` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_asignacion` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_conteo` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_despacho` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_inicio_corte` on the `pedidos` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoGrupo" AS ENUM ('GRUPO', 'ELITE');

-- DropForeignKey
ALTER TABLE "prestamos" DROP CONSTRAINT "prestamos_decoradora_id_fkey";

-- DropIndex
DROP INDEX "decoradoras_grupo_idx";

-- DropIndex
DROP INDEX "pedidos_cliente_id_idx";

-- DropIndex
DROP INDEX "pedidos_codigo_idx";

-- DropIndex
DROP INDEX "pedidos_estado_idx";

-- DropIndex
DROP INDEX "pedidos_fecha_despacho_idx";

-- AlterTable
ALTER TABLE "decoraciones" ADD COLUMN     "abonos_prestamo" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "prestamo_id" TEXT;

-- AlterTable
ALTER TABLE "decoradoras" DROP COLUMN "grupo",
ADD COLUMN     "banco" TEXT,
ADD COLUMN     "grupo_id" TEXT;

-- AlterTable
ALTER TABLE "nomina" DROP COLUMN "prestamos",
ADD COLUMN     "prestamo_id" TEXT,
ADD COLUMN     "salario_dia" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal_dias" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal_horas" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valor_hora_extra" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "cantidad_despacho",
DROP COLUMN "cantidad_faltante",
DROP COLUMN "cantidad_pedido",
DROP COLUMN "cantidad_plancha",
DROP COLUMN "cantidad_recibida",
DROP COLUMN "cantidad_tareas",
DROP COLUMN "cortes",
DROP COLUMN "fecha_asignacion",
DROP COLUMN "fecha_conteo",
DROP COLUMN "fecha_despacho",
DROP COLUMN "fecha_inicio_corte";

-- AlterTable
ALTER TABLE "prestamos" ADD COLUMN     "cuotas" INTEGER,
ADD COLUMN     "empleado_id" TEXT,
ALTER COLUMN "decoradora_id" DROP NOT NULL;

-- DropEnum
DROP TYPE "GrupoDecoradoras";

-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoGrupo" NOT NULL DEFAULT 'GRUPO',
    "direccion" TEXT,
    "telefono" TEXT,
    "responsable" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_clientes" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "precio_venta" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_productos" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad_pedido" INTEGER NOT NULL,
    "cantidad_plancha" INTEGER,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_inicio_corte" DATE,
    "fecha_conteo" DATE,
    "cantidad_tareas" INTEGER,
    "fecha_asignacion" DATE,
    "cantidad_recibida" INTEGER,
    "fecha_despacho" DATE,
    "cortes" INTEGER,
    "cantidad_despacho" INTEGER,
    "cantidad_faltante" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_productos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grupos_tipo_idx" ON "grupos"("tipo");

-- CreateIndex
CREATE INDEX "producto_clientes_producto_id_idx" ON "producto_clientes"("producto_id");

-- CreateIndex
CREATE INDEX "producto_clientes_cliente_id_idx" ON "producto_clientes"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "producto_clientes_producto_id_cliente_id_key" ON "producto_clientes"("producto_id", "cliente_id");

-- CreateIndex
CREATE INDEX "nomina_prestamo_id_idx" ON "nomina"("prestamo_id");

-- CreateIndex
CREATE INDEX "prestamos_empleado_id_idx" ON "prestamos"("empleado_id");

-- AddForeignKey
ALTER TABLE "producto_clientes" ADD CONSTRAINT "producto_clientes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_clientes" ADD CONSTRAINT "producto_clientes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decoradoras" ADD CONSTRAINT "decoradoras_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_productos" ADD CONSTRAINT "pedido_productos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_productos" ADD CONSTRAINT "pedido_productos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decoraciones" ADD CONSTRAINT "decoraciones_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_decoradora_id_fkey" FOREIGN KEY ("decoradora_id") REFERENCES "decoradoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina" ADD CONSTRAINT "nomina_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
