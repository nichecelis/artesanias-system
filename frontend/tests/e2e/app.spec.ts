import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('debería mostrar la página de login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Iniciar sesión')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener campo de correo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener campo de contraseña', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Navegación', () => {
  test('debería tener botón de entrar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('button:has-text("Entrar")')).toBeVisible({ timeout: 15000 });
  });
});