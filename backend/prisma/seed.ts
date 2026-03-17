import { PrismaClient, Rol, EstadoProducto, TipoGrupo, TipoCuenta } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Crear o actualizar el Grupo (Necesario para la relación con Decoradora)
  const grupoElite = await prisma.grupo.upsert({
    where: { id: 'seed-grupo-elite' },
    update: {},
    create: {
      id: 'seed-grupo-elite',
      nombre: 'Grupo Élite Principal',
      tipo: TipoGrupo.ELITE,
    }
  });
  console.log('✅ Grupo Élite preparado');

  // 2. Usuario administrador por defecto
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
  console.log(`✅ Usuario admin verificado: ${admin.correo}`);

  // 3. Usuarios de prueba adicionales
  const users = [
    { nombre: 'María Producción', correo: 'produccion@artesanias.com', rol: Rol.PRODUCCION },
    { nombre: 'Carlos Ventas',    correo: 'ventas@artesanias.com',     rol: Rol.VENTAS },
  ];
  for (const u of users) {
    await prisma.usuario.upsert({
      where: { correo: u.correo },
      update: {},
      create: { ...u, passwordHash: await bcrypt.hash('Password123!', 12) },
    });
  }

  // 4. Productos de muestra
	const listaProductos = [
		{ nombre: 'Taza cerámica 300ml', descripcion: 'Taza artesanal', precioVenta: 25000, precioDecoracion: 3000 },
		{ nombre: 'Plato decorativo 20cm', descripcion: 'Plato pintado', precioVenta: 35000, precioDecoracion: 5000 },
		{ nombre: 'Jarrón pequeño', descripcion: 'Jarrón artesanal 15cm', precioVenta: 45000, precioDecoracion: 7000 },
	  ];

	  for (const p of listaProductos) {
		// Usamos findFirst porque 'nombre' no es un campo @unique en tu esquema
		const existe = await prisma.producto.findFirst({ 
		  where: { nombre: p.nombre } 
		});

		if (!existe) {
		  await prisma.producto.create({
			data: {
			  ...p,
			  estado: EstadoProducto.ACTIVO
			}
		  });
		}
	  }
	  console.log('✅ Productos procesados sin duplicados');

  // 5. Clientes de muestra
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

  // 6. Decoradora de muestra (Corrección de relación)
  await prisma.decoradora.upsert({
    where: { documento: '52100200' },
    update: {},
    create: {
      nombre: 'Rosa Martínez',
      documento: '52100200',
      telefono: '3109876543',
      tipoCuenta: TipoCuenta.AHORROS,
      // Se usa connect para vincular correctamente con el objeto de grupo
      grupo: {
        connect: { id: grupoElite.id }
      },
    },
  });
  console.log('✅ Decoradora vinculada correctamente');

  console.log('\n🎉 Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
