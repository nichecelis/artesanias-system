import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function goTo(page: any, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
}

test.describe('Módulo: Pedidos', () => {
  test('debería mostrar la lista de pedidos', async ({ page }) => {
    await goTo(page, '/pedidos');
    await expect(page.locator('h1:has-text("Pedidos")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener buscador de pedidos', async ({ page }) => {
    await goTo(page, '/pedidos');
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener tabla de pedidos', async ({ page }) => {
    await goTo(page, '/pedidos');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener filtros de estado', async ({ page }) => {
    await goTo(page, '/pedidos');
    await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 });
  });

  test('debería navegar a crear pedido', async ({ page }) => {
    await goTo(page, '/pedidos');
    await page.click('a:has-text("Nuevo Pedido"), button:has-text("Nuevo Pedido")');
    await expect(page.locator('h1:has-text("Nuevo Pedido")')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Módulo: Nuevo Pedido', () => {
  test('debería mostrar formulario de nuevo pedido', async ({ page }) => {
    await goTo(page, '/pedidos/nuevo');
    await expect(page.locator('h1:has-text("Nuevo Pedido")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener selector de cliente', async ({ page }) => {
    await goTo(page, '/pedidos/nuevo');
    await expect(page.locator('text=Cliente').first()).toBeVisible({ timeout: 10000 });
  });
});
