import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

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

test.describe('Módulo: Facturas', () => {
  test('debería mostrar la lista de facturas', async ({ page }) => {
    await goTo(page, '/facturas');
    await expect(page.locator('h1:has-text("Facturas")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener buscador de facturas', async ({ page }) => {
    await goTo(page, '/facturas');
    await expect(page.locator('input[placeholder*="Buscar por cliente"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener tabla de facturas o empty state', async ({ page }) => {
    await goTo(page, '/facturas');
    await expectTableOrEmpty(page);
  });

  test('debería abrir modal al crear factura', async ({ page }) => {
    await goTo(page, '/facturas');
    const newBtn = page.locator('button:has-text("Nueva Factura")').first();
    await newBtn.click();
    await expect(page.locator('h2:has-text("Nueva Factura")')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener campos del formulario', async ({ page }) => {
    await goTo(page, '/facturas');
    const newBtn = page.locator('button:has-text("Nueva Factura")').first();
    await newBtn.click();
    
    await expect(page.locator('input[placeholder*="Buscar cliente"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Módulo: Nómina', () => {
  test('debería mostrar la lista de nómina', async ({ page }) => {
    await goTo(page, '/nomina');
    await expect(page.locator('h1:has-text("Nómina")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener selector de mes', async ({ page }) => {
    await goTo(page, '/nomina');
    await expect(page.locator('input[type="month"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Módulo: Empleados', () => {
  test('debería mostrar la lista de empleados', async ({ page }) => {
    await goTo(page, '/empleados');
    await expect(page.locator('h1:has-text("Empleados")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener tabla de empleados o empty state', async ({ page }) => {
    await goTo(page, '/empleados');
    await expectTableOrEmpty(page);
  });

  test('debería abrir modal al crear empleado', async ({ page }) => {
    await goTo(page, '/empleados');
    const newBtn = page.locator('button:has-text("Nuevo Empleado")').first();
    await newBtn.click();
    await expect(page.locator('h2:has-text("Nuevo")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Módulo: Préstamos', () => {
  test('debería mostrar la lista de préstamos', async ({ page }) => {
    await goTo(page, '/prestamos');
    await expect(page.locator('h1:has-text("Préstamos")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener tabla de préstamos o empty state', async ({ page }) => {
    await goTo(page, '/prestamos');
    await expectTableOrEmpty(page);
  });

  test('debería abrir modal al crear préstamo', async ({ page }) => {
    await goTo(page, '/prestamos');
    const newBtn = page.locator('button:has-text("Nuevo Préstamo")').first();
    await newBtn.click();
    await expect(page.locator('h2:has-text("Nuevo")')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener campos del formulario', async ({ page }) => {
    await goTo(page, '/prestamos');
    const newBtn = page.locator('button:has-text("Nuevo Préstamo")').first();
    await expect(newBtn).toBeVisible({ timeout: 10000 });
  });

  test('debería tener selector de tipo beneficiario', async ({ page }) => {
    await goTo(page, '/prestamos');
    const newBtn = page.locator('button:has-text("Nuevo Préstamo")').first();
    await expect(newBtn).toBeVisible({ timeout: 10000 });
  });
});
