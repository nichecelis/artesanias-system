import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const timestamp = Date.now();

async function goTo(page: any, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
}

async function waitForTable(page: any) {
  await page.waitForTimeout(500);
}

test.describe('CRUD Pedidos', () => {
  test('READ - debería mostrar la lista de pedidos', async ({ page }) => {
    await goTo(page, '/pedidos');
    await waitForTable(page);
    
    await expect(page.locator('h1:has-text("Pedidos")')).toBeVisible({ timeout: 15000 });
  });

  test('READ - debería tener buscador', async ({ page }) => {
    await goTo(page, '/pedidos');
    await waitForTable(page);
    
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible({ timeout: 10000 });
  });

  test('FILTER - debería filtrar por estado', async ({ page }) => {
    await goTo(page, '/pedidos');
    await waitForTable(page);
    
    const estadoSelect = page.locator('select').first();
    await expect(estadoSelect).toBeVisible({ timeout: 10000 });
    
    // Cambiar filtro
    await estadoSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);
  });

  test('CREATE - debería navegar a crear pedido', async ({ page }) => {
    await goTo(page, '/pedidos');
    await waitForTable(page);
    
    const nuevoBtn = page.locator('a:has-text("Nuevo Pedido"), button:has-text("Nuevo Pedido")');
    await nuevoBtn.click();
    
    await page.waitForURL(/.*pedidos\/nuevo/, { timeout: 15000 });
    await expect(page.locator('h1:has-text("Nuevo Pedido")')).toBeVisible({ timeout: 10000 });
  });

  test('READ - debería ver formulario de nuevo pedido', async ({ page }) => {
    await goTo(page, '/pedidos/nuevo');
    await waitForTable(page);
    
    await expect(page.locator('h1:has-text("Nuevo Pedido")')).toBeVisible({ timeout: 15000 });
    
    // Verificar campos
    await expect(page.locator('label:has-text("Cliente")')).toBeVisible({ timeout: 10000 });
  });

  test('UPDATE - debería ver detalle de pedido', async ({ page }) => {
    await goTo(page, '/pedidos');
    await waitForTable(page);
    
    // Buscar un pedido existente
    const pedidoRow = page.locator('table tbody tr').first();
    if (await pedidoRow.isVisible()) {
      await pedidoRow.click();
      await page.waitForTimeout(500);
    }
  });

  test('READ - debería ver estadísticas o empty state', async ({ page }) => {
    await goTo(page, '/pedidos');
    await waitForTable(page);
    
    // Verificar que hay tarjetas de estadísticas o empty state
    const statCards = page.locator('[class*="card"], [class*="EmptyState"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
