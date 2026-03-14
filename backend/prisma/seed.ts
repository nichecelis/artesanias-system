import { PrismaClient, Rol, EstadoProducto, GrupoDecoradoras, TipoCuenta } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ─── Usuario administrador por defecto ───────────────────
  const adminPass = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@artesanias.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      correo: 'admin@artesanias.com',
      passwordHash: adminPass,
      rol: Rol.ADMINISTRADOR,
    },
  });
  console.log(`✅ Usuario admin: ${admin.correo}`);

  // ─── Usuarios de prueba ───────────────────────────────────
  const users = [
    { nombre: 'María Producción', correo: 'produccion@artesanias.com', rol: Rol.PRODUCCION },
    { nombre: 'Carlos Ventas',    correo: 'ventas@artesanias.com',     rol: Rol.VENTAS },
    { nombre: 'Ana Contabilidad', correo: 'contabilidad@artesanias.com', rol: Rol.CONTABILIDAD },
  ];
  for (const u of users) {
    await prisma.usuario.upsert({
      where: { correo: u.correo },
      update: {},
      create: { ...u, passwordHash: await bcrypt.hash('Password123!', 12) },
    });
  }
  console.log('✅ Usuarios de prueba creados');

  // ─── Productos de muestra ─────────────────────────────────
  const productos = [
    { nombre: 'Taza cerámica 300ml', descripcion: 'Taza artesanal de cerámica', precioVenta: 25000, precioDecoracion: 3000 },
    { nombre: 'Plato decorativo 20cm', descripcion: 'Plato de cerámica pintado', precioVenta: 35000, precioDecoracion: 5000 },
    { nombre: 'Jarrón pequeño', descripcion: 'Jarrón artesanal 15cm', precioVenta: 45000, precioDecoracion: 7000 },
  ];
  for (const p of productos) {
    await prisma.producto.upsert({
      where: { id: p.nombre }, // Simplificado para seed
      update: {},
      create: p as any,
    });
  }
  console.log('✅ Productos creados');

  // ─── Clientes de muestra ──────────────────────────────────
  await prisma.cliente.upsert({
    where: { documento: '900123456' },
    update: {},
    create: {
      nombre: 'Almacén La Artesana S.A.S',
      documento: '900123456',
      direccion: 'Cra 5 # 12-34, Bogotá',
      telefono: '3001234567',
      transportadora: 'Servientrega',
    },
  });
  console.log('✅ Cliente de muestra creado');

  // ─── Decoradora de muestra ────────────────────────────────
  await prisma.decoradora.upsert({
    where: { documento: '52100200' },
    update: {},
    create: {
      nombre: 'Rosa Martínez',
      documento: '52100200',
      telefono: '3109876543',
      tipoCuenta: TipoCuenta.AHORROS,
      grupo: GrupoDecoradoras.ELITE,
    },
  });
  console.log('✅ Decoradora de muestra creada');

  console.log('\n🎉 Seed completado exitosamente');
  console.log('─────────────────────────────────────');
  console.log('Admin: admin@artesanias.com / Admin123!');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
