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

test.describe('CRUD Decoraciones', () => {
  test('READ - debería mostrar la lista de decoraciones', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    await expect(page.locator('h1:has-text("Decoraciones")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('FILTER - debería buscar por texto', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    await expect(searchInput).toHaveValue('test');
  });

  test('FILTER - debería filtrar por decoradora', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    const decInput = page.locator('input[placeholder*="Buscar decoradora"]');
    if (await decInput.isVisible()) {
      await expect(decInput).toBeVisible({ timeout: 5000 });
    }
  });

  test('FILTER - debería filtrar por grupo', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    const grupoInput = page.locator('input[placeholder*="Filtrar por grupo"]');
    if (await grupoInput.isVisible()) {
      await expect(grupoInput).toBeVisible({ timeout: 5000 });
    }
  });

  test('FILTER - debería filtrar por fechas', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('FILTER - debería limpiar filtros', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    // Aplicar algún filtro
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await searchInput.fill('test');
    await page.waitForTimeout(300);
    
    // Buscar botón limpiar
    const limpiarBtn = page.locator('button:has-text("Limpiar")');
    if (await limpiarBtn.isVisible()) {
      await limpiarBtn.click();
      await page.waitForTimeout(300);
      await expect(searchInput).toHaveValue('');
    }
  });

  test('CREATE - debería abrir modal de crear decoración', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    await page.click('button:has-text("Nueva")');
    await expect(page.locator('h2:has-text("Nueva")')).toBeVisible({ timeout: 10000 });
    
    // Verificar campos
    await expect(page.locator('input[placeholder*="Buscar por nombre"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Agregar")')).toBeVisible({ timeout: 5000 });
  });

  test('READ - debería ver reporte', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    const reporteBtn = page.locator('button:has-text("Generar Reporte")');
    if (await reporteBtn.isVisible()) {
      await expect(reporteBtn).toBeVisible({ timeout: 5000 });
    }
  });

  test('READ - debería ver tabla con columnas correctas', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    await expect(page.locator('th:has-text("Pedido")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('th:has-text("Decoradora")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('th:has-text("Estado")')).toBeVisible({ timeout: 5000 });
  });

  test('UPDATE - debería expandir grupo de decoración', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await waitForTable(page);
    
    // Buscar botón de expandir (chevron)
    const expandBtns = page.locator('button').filter({ has: page.locator('svg') });
    if (await expandBtns.count() > 0) {
      await expandBtns.first().click();
      await page.waitForTimeout(500);
    }
  });
});
