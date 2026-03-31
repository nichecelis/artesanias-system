# Testing Guide

This project uses multiple testing approaches:

## 1. Playwright (E2E Tests)

### Setup
```bash
cd frontend
npm install
npx playwright install --with-deps
```

### Running E2E Tests
```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/pedidos.spec.ts

# Run with UI
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed
```

### Test Files
- `tests/e2e/app.spec.ts` - Login and authentication
- `tests/e2e/pedidos.spec.ts` - Pedidos module
- `tests/e2e/clientes-productos.spec.ts` - Clientes and Productos modules
- `tests/e2e/decoradoras.spec.ts` - Decoradoras, Decoraciones, Grupos modules
- `tests/e2e/nomina-empleados-prestamos.spec.ts` - Nomina, Empleados, Prestamos modules
- `tests/e2e/reportes-config.spec.ts` - Reportes, Parametrizacion, Usuarios, Dashboard
- `tests/e2e/despachos.spec.ts` - Despachos module

### Test Configuration
See `playwright.config.ts` for configuration.

---

## 2. Backend Tests (Jest)

### Setup
```bash
cd backend
npm install
```

### Running Tests
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:int

# Run with coverage
npm run test:cov

# Watch mode
npm test -- --watch
```

### Test Files
- `tests/unit/` - Unit tests for services
- `tests/integration/` - API integration tests

---

## 3. API Tests (Node.js Script)

### Setup
```bash
cd backend
npm install
```

### Running API Tests
```bash
# Run all API tests
npm run test:api

# With custom API URL
API_URL=http://localhost:3001/api/v1 npm run test:api
```

### Test Coverage
The script tests all API endpoints:
- Auth (login, logout, me)
- Usuarios (CRUD)
- Clientes (CRUD)
- Productos (CRUD)
- Pedidos (CRUD, stats)
- Decoradoras (CRUD)
- Decoraciones (CRUD)
- Grupos (CRUD)
- Empleados (CRUD)
- Nomina (CRUD, total-mes)
- Prestamos (CRUD)
- Facturas (CRUD)
- Despachos (list)
- Reportes (ventas, pedidos, decoradoras, nomina)
- Parametrizacion (get, update)
- Error handling (invalid login, unauthorized access)

### Source File
- `scripts/api-tests.js` - Main API test script

---

## 4. Postman (API Tests - Optional)

Postman collection is available for manual API testing.

### Setup
1. Install [Postman](https://www.postman.com/downloads/)
2. Import the collection and environment files from `postman/`

### Import Files
- `postman/Artesanias_API.postman_collection.json`
- `postman/Artesanias_Local.postman_environment.json`

---

## 5. GitHub Actions (CI/CD)

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

### Workflow Steps
1. **Lint & Type Check** - ESLint + TypeScript
2. **Backend Tests** - Jest unit + integration tests
3. **Frontend Build** - Production build
4. **Playwright E2E** - Full E2E test suite
5. **API Tests** - Node.js API test script
6. **Deploy** - Only on main push (requires manual trigger)

### Running CI Locally
```bash
# Backend
cd backend
npm run lint
npm run test
npm run test:api

# Frontend
cd frontend
npm run lint
npm run test:e2e
```

---

## Quick Start

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Setup database
cd ../backend
cp .env.example .env  # Configure your database
npm run db:migrate
npm run db:seed

# 3. Start servers
npm run dev  # Backend on http://localhost:3000

# In another terminal
cd ../frontend
npm run dev  # Frontend on http://localhost:5173

# 4. Run tests
cd ../backend && npm run test        # Jest tests
cd ../frontend && npm run test:e2e  # Playwright tests
```
