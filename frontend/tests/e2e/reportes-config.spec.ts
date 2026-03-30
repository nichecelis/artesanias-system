import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function goTo(page: any, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
}

test.describe('Módulo: Reportes', () => {
  test('debería mostrar la página de reportes', async ({ page }) => {
    await goTo(page, '/reportes');
    await expect(page.locator('h1:has-text("Reportes")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener tabs de reportes', async ({ page }) => {
    await goTo(page, '/reportes');
    await expect(page.locator('button:has-text("Ventas por cliente")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Pedidos activos")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Pagos decoradoras")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Nómina del mes")')).toBeVisible({ timeout: 5000 });
  });

  test('debería cambiar a tab de pedidos activos', async ({ page }) => {
    await goTo(page, '/reportes');
    await page.click('button:has-text("Pedidos activos")');
    await expect(page.locator('text=Pedidos recientes sin despachar')).toBeVisible({ timeout: 10000 });
  });

  test('debería cambiar a tab de nómina', async ({ page }) => {
    await goTo(page, '/reportes');
    await page.click('button:has-text("Nómina del mes")');
    await expect(page.locator('text=Detalle por empleado')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener selector de mes para nómina', async ({ page }) => {
    await goTo(page, '/reportes');
    await page.click('button:has-text("Nómina del mes")');
    await expect(page.locator('input[type="month"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Módulo: Parametrización', () => {
  test('debería mostrar la página de configuración', async ({ page }) => {
    await goTo(page, '/parametrizacion');
    await expect(page.locator('h1:has-text("Configuración")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener campo de nombre de empresa', async ({ page }) => {
    await goTo(page, '/parametrizacion');
    await expect(page.locator('text=Nombre de la Empresa')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener botón para guardar', async ({ page }) => {
    await goTo(page, '/parametrizacion');
    await expect(page.locator('button:has-text("Guardar")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Módulo: Usuarios', () => {
  test('debería mostrar la lista de usuarios', async ({ page }) => {
    await goTo(page, '/usuarios');
    await expect(page.locator('h1:has-text("Usuarios")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener buscador de usuarios', async ({ page }) => {
    await goTo(page, '/usuarios');
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener tabla de usuarios', async ({ page }) => {
    await goTo(page, '/usuarios');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Módulo: Dashboard', () => {
  test('debería mostrar el dashboard', async ({ page }) => {
    await goTo(page, '/dashboard');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
  });

  test('debería mostrar estadísticas', async ({ page }) => {
    await goTo(page, '/dashboard');
    await expect(page.locator('text=Pedidos')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Clientes')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Productos')).toBeVisible({ timeout: 5000 });
  });
});
