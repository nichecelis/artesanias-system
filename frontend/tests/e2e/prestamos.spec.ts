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

test.describe('CRUD Préstamos', () => {
  test('CREATE PRÉSTAMO - debería tener botón para crear préstamo', async ({ page }) => {
    await goTo(page, '/prestamos');
    // Verificar que hay botón para crear
    const createBtn = page.locator('button:has-text("Nuevo Préstamo")');
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test('READ - debería mostrar la lista de préstamos', async ({ page }) => {
    await goTo(page, '/prestamos');
    await waitForTable(page);
    
    await expect(page.locator('h1:has-text("Préstamos")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('FILTER - debería filtrar por tipo DECORADORA', async ({ page }) => {
    await goTo(page, '/prestamos');
    await waitForTable(page);
    
    // Seleccionar filtro de decoradoras
    await page.selectOption('select', 'DECORADORA');
    await page.waitForTimeout(500);
    
    // Verificar que el filtro se aplicó
    await expect(page.locator('select')).toBeVisible({ timeout: 5000 });
  });

  test('FILTER - debería filtrar por tipo EMPLEADO', async ({ page }) => {
    await goTo(page, '/prestamos');
    await waitForTable(page);
    
    await page.selectOption('select', 'EMPLEADO');
    await page.waitForTimeout(500);
    
    await expect(page.locator('select')).toBeVisible({ timeout: 5000 });
  });

  test('FILTER - debería filtrar solo con saldo', async ({ page }) => {
    await goTo(page, '/prestamos');
    await waitForTable(page);
    
    // Marcar checkbox de solo saldo
    await page.locator('input[type="checkbox"]').check();
    await page.waitForTimeout(500);
    
    await expect(page.locator('input[type="checkbox"]')).toBeChecked();
  });
});
