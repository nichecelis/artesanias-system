import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function goTo(page: any, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
}

async function expectTableOrEmpty(page: any) {
  const hasTable = await page.locator('table').count() > 0;
  const hasEmpty = await page.locator('text="Sin').count() > 0 || await page.locator('text="No hay').count() > 0;
  expect(hasTable || hasEmpty).toBeTruthy();
}

test.describe('Módulo: Despachos', () => {
  test('debería mostrar la lista de despachos', async ({ page }) => {
    await goTo(page, '/despachos');
    await expect(page.locator('h1:has-text("Despachos")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener buscador de despachos', async ({ page }) => {
    await goTo(page, '/despachos');
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener tabla o empty state de despachos', async ({ page }) => {
    await goTo(page, '/despachos');
    await expectTableOrEmpty(page);
  });
});
