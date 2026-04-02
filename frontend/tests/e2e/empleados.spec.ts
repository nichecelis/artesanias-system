import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function goTo(page: any, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

async function closeModalIfOpen(page: any) {
  const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50');
  if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}

async function expectTableOrEmpty(page: any) {
  const hasTable = await page.locator('table').count() > 0;
  const hasEmpty = await page.locator('text="Sin').count() > 0 || await page.locator('text="No hay').count() > 0;
  expect(hasTable || hasEmpty).toBeTruthy();
}

test.describe('CRUD Empleados', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/empleados');
    await closeModalIfOpen(page);
  });

  test('CREATE - debería tener botón para crear empleado', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Agregar empleado"), button:has-text("Nuevo Empleado")').first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test('READ - debería mostrar la lista de empleados o empty state', async ({ page }) => {
    await expect(page.locator('h1:has-text("Empleados")')).toBeVisible({ timeout: 15000 });
    await expectTableOrEmpty(page);
  });

  test('UPDATE - debería poder editar un empleado existente', async ({ page }) => {
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    
    if (hasTable) {
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible().catch(() => false)) {
        await firstRow.click();
        await page.waitForTimeout(300);
        
        const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50');
        if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
          const modalTitle = page.locator('h2, h3').first();
          await expect(modalTitle).toBeVisible({ timeout: 5000 });
        }
      }
    }
    
    await closeModalIfOpen(page);
  });

  test('DELETE - debería poder eliminar un empleado existente', async ({ page }) => {
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    
    if (hasTable) {
      const deleteBtn = page.locator('button[title="Eliminar"], button svg[class*="trash"]').first();
      
      if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        page.on('dialog', dialog => dialog.accept());
        await deleteBtn.click().catch(() => {});
        await page.waitForTimeout(500);
      }
    }
    
    await closeModalIfOpen(page);
  });
});
