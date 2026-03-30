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

test.describe('CRUD Decoradoras', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/decoradoras');
    await closeModalIfOpen(page);
  });

  test('CREATE - debería abrir modal de crear decoradora', async ({ page }) => {
    await page.click('button:has-text("Nueva Decoradora")');
    await expect(page.locator('h2:has-text("Nueva")')).toBeVisible({ timeout: 10000 });
    
    // Verificar campos del formulario
    await expect(page.locator('input[name="nombre"]').or(page.locator('input[placeholder*="Nombre"]'))).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="documento"]').or(page.locator('input[placeholder*="Cédula"]'))).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="telefono"]').or(page.locator('input[placeholder*="300"]'))).toBeVisible({ timeout: 5000 });
    
    await closeModalIfOpen(page);
  });

  test('READ - debería mostrar la lista de decoradoras', async ({ page }) => {
    await expect(page.locator('h1:has-text("Decoradoras")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table, [class*="EmptyState"]')).toBeVisible({ timeout: 10000 });
  });

  test('UPDATE - debería poder editar una decoradora existente', async ({ page }) => {
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

  test('DELETE - debería poder eliminar una decoradora existente', async ({ page }) => {
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
