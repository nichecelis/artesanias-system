import { Page, Locator, expect } from '@playwright/test';

export async function waitForModalOrTable(page: Page): Promise<Locator> {
  await page.waitForLoadState('networkidle');
  const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50');
  const table = page.locator('table');
  const emptyState = page.locator('text="No hay datos"').or(page.locator('[class*="EmptyState"]')).or(page.locator('text="Sin'));
  
  const modalVisible = await modal.first().isVisible().catch(() => false);
  const tableVisible = await table.first().isVisible().catch(() => false);
  
  return modalVisible ? modal : table;
}

export async function waitForModalClose(page: Page, timeout = 10000): Promise<void> {
  const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50');
  await expect(modal).not.toBeVisible({ timeout });
}

export async function createAndCloseForm(page: Page, testId: string, formData: Record<string, string>): Promise<void> {
  for (const [label, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${label}"], input[placeholder*="${label}" i], input[id="${label}"]`).first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill(value);
    }
  }
  
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
  
  await page.waitForTimeout(500);
  
  const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50');
  const isModalVisible = await modal.first().isVisible().catch(() => false);
  
  if (isModalVisible) {
    const closeBtn = page.locator('[role="dialog"] button[type="button"], .fixed button:has-text("Cerrar"), .fixed button:has-text("Cancelar")').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  }
}

export async function hasTableOrEmptyState(page: Page): Promise<boolean> {
  const table = page.locator('table');
  const emptyState = page.locator('[class*="EmptyState"], text="Sin", text="No hay").first();
  
  const tableVisible = await table.isVisible({ timeout: 2000 }).catch(() => false);
  const emptyVisible = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  
  return tableVisible || emptyVisible;
}

export async function clickRowAction(page: Page, rowText: string, action: 'edit' | 'delete' | 'view'): Promise<void> {
  const row = page.locator('tr').filter({ hasText: rowText }).first();
  await row.scrollIntoViewIfNeeded();
  
  const btn = row.locator(`button[title*="${action}"], button[aria-label*="${action}"]`).first();
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
  } else {
    await row.click();
    await page.waitForTimeout(300);
  }
}
