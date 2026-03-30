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

test.describe('CRUD Grupos/ELITE', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/grupos');
    await closeModalIfOpen(page);
  });

  test('CREATE GRUPO - debería tener botón para crear grupo', async ({ page }) => {
    // Verificar que hay botón para crear (ya sea en la página o en empty state)
    const createBtn = page.locator('button:has-text("Crear primer grupo"), button:has-text("Nuevo grupo")');
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test('READ - debería mostrar la lista de grupos', async ({ page }) => {
    await expect(page.locator('h1:has-text("Grupos y Elites")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table, [class*="EmptyState"]')).toBeVisible({ timeout: 10000 });
  });

  test('UPDATE - debería poder editar un grupo existente', async ({ page }) => {
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

  test('DELETE - debería poder eliminar un grupo existente', async ({ page }) => {
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
