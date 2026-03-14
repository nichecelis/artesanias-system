# Artesanías SaaS

Sistema de gestión de producción, ventas y nómina para empresas artesanales.

## Stack
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis
- **Frontend:** React (próxima iteración)
- **Infra:** Docker + GitHub Actions

## Levantar en desarrollo

```bash
# 1. Clonar y entrar al proyecto
cd artesanias-system

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar JWT_SECRET y JWT_REFRESH_SECRET con valores seguros (mín. 32 chars)

# 3. Levantar servicios
docker compose up -d

# 4. Instalar dependencias y migrar BD
cd backend
npm install
npm run db:migrate
npm run db:seed

# 5. Iniciar servidor
npm run dev
```

**Usuario admin por defecto:** `admin@artesanias.com` / `Admin123!`

## Estructura

```
artesanias-system/
├── backend/
│   ├── prisma/          # Schema + seed
│   ├── src/
│   │   ├── config/      # DB, Redis, env, Swagger
│   │   ├── controllers/ # Manejo de requests HTTP
│   │   ├── middlewares/ # Auth, RBAC, errores, auditoría
│   │   ├── routes/      # Endpoints REST
│   │   ├── services/    # Lógica de negocio
│   │   ├── types/       # Tipos TypeScript globales
│   │   └── utils/       # Logger, helpers de respuesta
│   └── tests/
├── frontend/            # React (próxima iteración)
└── docs/
```

## API Docs
Swagger disponible en: `http://localhost:3000/api/docs`

## Módulos implementados
| Módulo | Endpoints |
|---|---|
| Auth | POST /auth/login, /refresh, /logout, GET /me |
| Usuarios | CRUD completo + cambiar contraseña |
| Productos | CRUD completo |
| Clientes | CRUD completo |
| Pedidos | CRUD + cambio de estado + estadísticas |
| Decoradoras | CRUD + resumen de pagos |
| Decoraciones | Egreso, ingreso, marcar pagado |
| Préstamos | Crear + abonar |
| Empleados | CRUD completo |
| Nómina | Registrar + listar + total mes |
| Reportes | Ventas, pedidos activos, pagos decoradoras, nómina |
