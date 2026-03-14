-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'PRODUCCION', 'VENTAS', 'CONTABILIDAD');

-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'EN_CORTE', 'EN_DECORACION', 'LISTO', 'DESPACHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('AHORROS', 'CORRIENTE');

-- CreateEnum
CREATE TYPE "GrupoDecoradoras" AS ENUM ('GRUPO', 'ELITE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'VENTAS',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio_venta" DECIMAL(12,2) NOT NULL,
    "precio_decoracion" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoProducto" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "transportadora" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "cantidad_pedido" INTEGER NOT NULL,
    "cantidad_plancha" INTEGER,
    "laser" BOOLEAN NOT NULL DEFAULT false,
    "fecha_inicio_corte" DATE,
    "fecha_conteo" DATE,
    "cantidad_tareas" INTEGER,
    "fecha_asignacion" DATE,
    "cantidad_recibida" INTEGER,
    "fecha_despacho" DATE,
    "cortes" INTEGER,
    "cantidad_despacho" INTEGER,
    "cantidad_faltante" INTEGER,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decoradoras" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "telefono" TEXT,
    "num_cuenta" TEXT,
    "tipo_cuenta" "TipoCuenta",
    "grupo" "GrupoDecoradoras" NOT NULL DEFAULT 'GRUPO',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decoradoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decoraciones" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "decoradora_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "fecha_egreso" DATE NOT NULL,
    "cantidad_egreso" INTEGER NOT NULL,
    "fecha_ingreso" DATE,
    "cantidad_ingreso" INTEGER,
    "arreglos" INTEGER NOT NULL DEFAULT 0,
    "perdidas" INTEGER NOT NULL DEFAULT 0,
    "precio_decoracion" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "compras" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_pagar" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decoraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "id" TEXT NOT NULL,
    "decoradora_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "saldo" DECIMAL(12,2) NOT NULL,
    "observacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos" (
    "id" TEXT NOT NULL,
    "prestamo_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "salario" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nomina" (
    "id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "dias_trabajados" INTEGER NOT NULL,
    "horas_extras" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "prestamos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "abonos_prestamo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_pagar" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "usuarios_correo_idx" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "productos_estado_idx" ON "productos"("estado");

-- CreateIndex
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE INDEX "clientes_documento_idx" ON "clientes"("documento");

-- CreateIndex
CREATE INDEX "clientes_nombre_idx" ON "clientes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_codigo_key" ON "pedidos"("codigo");

-- CreateIndex
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE INDEX "pedidos_codigo_idx" ON "pedidos"("codigo");

-- CreateIndex
CREATE INDEX "pedidos_fecha_despacho_idx" ON "pedidos"("fecha_despacho");

-- CreateIndex
CREATE UNIQUE INDEX "decoradoras_documento_key" ON "decoradoras"("documento");

-- CreateIndex
CREATE INDEX "decoradoras_documento_idx" ON "decoradoras"("documento");

-- CreateIndex
CREATE INDEX "decoradoras_grupo_idx" ON "decoradoras"("grupo");

-- CreateIndex
CREATE INDEX "decoraciones_pedido_id_idx" ON "decoraciones"("pedido_id");

-- CreateIndex
CREATE INDEX "decoraciones_decoradora_id_idx" ON "decoraciones"("decoradora_id");

-- CreateIndex
CREATE INDEX "decoraciones_producto_id_idx" ON "decoraciones"("producto_id");

-- CreateIndex
CREATE INDEX "decoraciones_fecha_egreso_idx" ON "decoraciones"("fecha_egreso");

-- CreateIndex
CREATE INDEX "decoraciones_pagado_idx" ON "decoraciones"("pagado");

-- CreateIndex
CREATE INDEX "prestamos_decoradora_id_idx" ON "prestamos"("decoradora_id");

-- CreateIndex
CREATE INDEX "prestamos_fecha_idx" ON "prestamos"("fecha");

-- CreateIndex
CREATE INDEX "abonos_prestamo_id_idx" ON "abonos"("prestamo_id");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_documento_key" ON "empleados"("documento");

-- CreateIndex
CREATE INDEX "empleados_documento_idx" ON "empleados"("documento");

-- CreateIndex
CREATE INDEX "nomina_empleado_id_idx" ON "nomina"("empleado_id");

-- CreateIndex
CREATE INDEX "nomina_fecha_idx" ON "nomina"("fecha");

-- CreateIndex
CREATE INDEX "audit_logs_usuario_id_idx" ON "audit_logs"("usuario_id");

-- CreateIndex
CREATE INDEX "audit_logs_entidad_idx" ON "audit_logs"("entidad");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decoraciones" ADD CONSTRAINT "decoraciones_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decoraciones" ADD CONSTRAINT "decoraciones_decoradora_id_fkey" FOREIGN KEY ("decoradora_id") REFERENCES "decoradoras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decoraciones" ADD CONSTRAINT "decoraciones_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_decoradora_id_fkey" FOREIGN KEY ("decoradora_id") REFERENCES "decoradoras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina" ADD CONSTRAINT "nomina_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
