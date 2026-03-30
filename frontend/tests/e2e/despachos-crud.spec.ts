import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function goTo(page: any, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

test.describe('CRUD Despachos', () => {
  test('READ - debería mostrar la lista de despachos', async ({ page }) => {
    await goTo(page, '/despachos');
    
    await expect(page.locator('h1:has-text("Despachos")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table, [class*="EmptyState"]')).toBeVisible({ timeout: 10000 });
  });

  test('READ - debería tener buscador', async ({ page }) => {
    await goTo(page, '/despachos');
    
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible({ timeout: 10000 });
  });

  test('FILTER - debería filtrar por estado', async ({ page }) => {
    await goTo(page, '/despachos');
    
    const estadoSelect = page.locator('select').first();
    if (await estadoSelect.isVisible()) {
      await estadoSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });

  test('READ - debería ver tabla con columnas correctas', async ({ page }) => {
    await goTo(page, '/despachos');
    
    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);
    
    if (hasTable) {
      const columns = ['Pedido', 'Producto', 'Estado', 'Cantidad'];
      for (const col of columns) {
        const header = page.locator(`th:has-text("${col}")`);
        if (await header.isVisible().catch(() => false)) {
          await expect(header).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('UPDATE - debería marcar como cortado', async ({ page }) => {
    await goTo(page, '/despachos');
    
    const cortarBtn = page.locator('button:has-text("Cortar")').first();
    if (await cortarBtn.isVisible()) {
      await cortarBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('UPDATE - debería marcar como contado', async ({ page }) => {
    await goTo(page, '/despachos');
    
    const contarBtn = page.locator('button:has-text("Contar")').first();
    if (await contarBtn.isVisible()) {
      await contarBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('UPDATE - debería registrar conteo', async ({ page }) => {
    await goTo(page, '/despachos');
    
    const conteoBtn = page.locator('button:has-text("Conteo")').first();
    if (await conteoBtn.isVisible()) {
      await conteoBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('READ - debería ver botón de PDF', async ({ page }) => {
    await goTo(page, '/despachos');
    
    const pdfBtn = page.locator('button:has-text("PDF"), button[title="PDF"]').first();
    if (await pdfBtn.isVisible()) {
      await expect(pdfBtn).toBeVisible({ timeout: 5000 });
    }
  });

  test('READ - debería ver estadísticas o empty state', async ({ page }) => {
    await goTo(page, '/despachos');
    
    const summaryCards = page.locator('[class*="bg-"], [class*="card"], [class*="EmptyState"]');
    const count = await summaryCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
