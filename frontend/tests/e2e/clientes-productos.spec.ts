import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function goTo(page: any, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
}

test.describe('Módulo: Clientes', () => {
  test('debería mostrar la lista de clientes', async ({ page }) => {
    await goTo(page, '/clientes');
    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener buscador de clientes', async ({ page }) => {
    await goTo(page, '/clientes');
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener tabla o empty state', async ({ page }) => {
    await goTo(page, '/clientes');
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=Sin clientes').isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('debería abrir modal al crear cliente', async ({ page }) => {
    await goTo(page, '/clientes');
    await page.click('button:has-text("Nuevo Cliente")');
    await expect(page.locator('h2:has-text("Nuevo Cliente")')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener todos los campos del formulario', async ({ page }) => {
    await goTo(page, '/clientes');
    await page.click('button:has-text("Nuevo Cliente")');
    
    await expect(page.locator('input[placeholder*="Nombre"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[placeholder*="cédula"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[placeholder*="300"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Módulo: Productos', () => {
  test('debería mostrar la lista de productos', async ({ page }) => {
    await goTo(page, '/productos');
    await expect(page.locator('h1:has-text("Productos")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener buscador de productos', async ({ page }) => {
    await goTo(page, '/productos');
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería abrir modal al crear producto', async ({ page }) => {
    await goTo(page, '/productos');
    await page.click('button:has-text("Nuevo Producto")');
    await expect(page.locator('h2:has-text("Nuevo Producto")')).toBeVisible({ timeout: 10000 });
  });
});
