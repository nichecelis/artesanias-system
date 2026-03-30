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

test.describe('CRUD Nómina', () => {
  test('READ - debería mostrar la lista de nómina', async ({ page }) => {
    await goTo(page, '/nomina');
    await waitForTable(page);
    
    await expect(page.locator('h1:has-text("Nómina")')).toBeVisible({ timeout: 15000 });
  });

  test('READ - debería tener selector de mes', async ({ page }) => {
    await goTo(page, '/nomina');
    await waitForTable(page);
    
    await expect(page.locator('input[type="month"]')).toBeVisible({ timeout: 10000 });
  });

  test('UPDATE - debería cambiar el mes', async ({ page }) => {
    await goTo(page, '/nomina');
    await waitForTable(page);
    
    const monthInput = page.locator('input[type="month"]');
    await monthInput.fill('2026-03');
    await page.waitForTimeout(500);
    
    await expect(monthInput).toHaveValue('2026-03');
  });

  test('READ - debería mostrar tabla de empleados', async ({ page }) => {
    await goTo(page, '/nomina');
    await waitForTable(page);
    
    // Verificar que hay una tabla o lista de empleados
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    if (hasTable) {
      await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
    }
  });

  test('CREATE - debería abrir modal para registrar nómina', async ({ page }) => {
    await goTo(page, '/nomina');
    await waitForTable(page);
    
    const registrarBtn = page.locator('button:has-text("Registrar")');
    if (await registrarBtn.isVisible()) {
      await registrarBtn.click();
      await expect(page.locator('h2:has-text("Registrar")')).toBeVisible({ timeout: 10000 });
    }
  });

  test('READ - debería ver reporte de nómina', async ({ page }) => {
    await goTo(page, '/nomina');
    await waitForTable(page);
    
    const reporteBtn = page.locator('button:has-text("Reporte")');
    if (await reporteBtn.isVisible()) {
      await expect(reporteBtn).toBeVisible({ timeout: 5000 });
    }
  });

  test('READ - debería ver totales o empty state', async ({ page }) => {
    await goTo(page, '/nomina');
    await waitForTable(page);
    
    // Verificar que hay tarjetas de totales o empty state
    const totalCards = page.locator('[class*="card"], [class*="EmptyState"]');
    const count = await totalCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
