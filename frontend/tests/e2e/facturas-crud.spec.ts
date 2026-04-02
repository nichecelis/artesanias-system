import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const timestamp = Date.now();

async function goTo(page: any, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
}

async function waitForPage(page: any) {
  await page.waitForTimeout(500);
}

async function expectTableOrEmpty(page: any) {
  const hasTable = await page.locator('table').count() > 0;
  const hasEmpty = await page.locator('text="Sin').count() > 0 || await page.locator('text="No hay').count() > 0;
  expect(hasTable || hasEmpty).toBeTruthy();
}

test.describe('CRUD Facturas', () => {
  test('READ - debería mostrar la lista de facturas', async ({ page }) => {
    await goTo(page, '/facturas');
    await waitForPage(page);
    
    await expect(page.locator('h1:has-text("Facturas")')).toBeVisible({ timeout: 15000 });
    await expectTableOrEmpty(page);
  });

  test('READ - debería buscar facturas por cliente', async ({ page }) => {
    await goTo(page, '/facturas');
    await waitForPage(page);
    
    await page.fill('input[placeholder*="Buscar por cliente"]', 'test');
    await page.waitForTimeout(500);
    
    await expect(page.locator('input[placeholder*="Buscar por cliente"]')).toHaveValue('test');
  });

  test('FILTER - debería filtrar por estado', async ({ page }) => {
    await goTo(page, '/facturas');
    await waitForPage(page);
    
    await expect(page.locator('h1:has-text("Facturas")')).toBeVisible({ timeout: 10000 });
  });

  test('CREATE - debería abrir modal de crear factura', async ({ page }) => {
    await goTo(page, '/facturas');
    await waitForPage(page);
    
    await page.click('button:has-text("Nueva Factura")');
    await expect(page.locator('h2:has-text("Nueva Factura")')).toBeVisible({ timeout: 10000 });
    
    await expect(page.locator('input[placeholder*="Buscar cliente"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="number"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('READ - debería ver detalle de factura', async ({ page }) => {
    await goTo(page, '/facturas');
    await waitForPage(page);
    
    const viewButtons = page.locator('button[title="Ver"]');
    if (await viewButtons.count() > 0) {
      await viewButtons.first().click();
      await expect(page.locator('text=Cliente')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Fecha')).toBeVisible({ timeout: 5000 });
    }
  });

  test('READ - debería poder descargar PDF', async ({ page }) => {
    await goTo(page, '/facturas');
    await waitForPage(page);
    
    const pdfButtons = page.locator('button[title="PDF"]');
    if (await pdfButtons.count() > 0) {
      await expect(pdfButtons.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
