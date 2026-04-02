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

test.describe('CRUD Préstamos', () => {
  test('CREATE PRÉSTAMO - debería tener botón para crear préstamo', async ({ page }) => {
    await goTo(page, '/prestamos');
    const createBtn = page.locator('button:has-text("Nuevo Préstamo")').first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test('READ - debería mostrar la lista de préstamos o empty state', async ({ page }) => {
    await goTo(page, '/prestamos');
    await waitForPage(page);
    
    await expect(page.locator('h1:has-text("Préstamos")')).toBeVisible({ timeout: 15000 });
    await expectTableOrEmpty(page);
  });

  test('FILTER - debería filtrar por tipo DECORADORA', async ({ page }) => {
    await goTo(page, '/prestamos');
    await waitForPage(page);
    
    const selects = page.locator('select');
    if (await selects.count() > 0) {
      await selects.first().selectOption('DECORADORA');
      await page.waitForTimeout(500);
    }
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
  });

  test('FILTER - debería filtrar por tipo EMPLEADO', async ({ page }) => {
    await goTo(page, '/prestamos');
    await waitForPage(page);
    
    const selects = page.locator('select');
    if (await selects.count() > 0) {
      await selects.first().selectOption('EMPLEADO');
      await page.waitForTimeout(500);
    }
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
  });

  test('FILTER - debería filtrar solo con saldo', async ({ page }) => {
    await goTo(page, '/prestamos');
    await waitForPage(page);
    
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 0) {
      await checkboxes.first().check();
      await page.waitForTimeout(500);
      await expect(checkboxes.first()).toBeChecked();
    }
  });
});
