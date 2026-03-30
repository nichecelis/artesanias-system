import { test, expect } from '@playwright/test';
import { hasTableOrEmptyState } from './helpers';

const BASE_URL = 'http://localhost:5173';

async function goTo(page: any, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
}

test.describe('Módulo: Decoradoras', () => {
  test('debería mostrar la lista de decoradoras', async ({ page }) => {
    await goTo(page, '/decoradoras');
    await expect(page.locator('h1:has-text("Decoradoras")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener buscador de decoradoras', async ({ page }) => {
    await goTo(page, '/decoradoras');
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener tabla o empty state de decoradoras', async ({ page }) => {
    await goTo(page, '/decoradoras');
    await expect(page.locator('table, [class*="EmptyState"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería abrir modal al crear decoradora', async ({ page }) => {
    await goTo(page, '/decoradoras');
    await page.click('button:has-text("Nueva Decoradora")');
    await expect(page.locator('h2:has-text("Nueva")')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener todos los campos del formulario', async ({ page }) => {
    await goTo(page, '/decoradoras');
    await page.click('button:has-text("Nueva Decoradora")');
    
    await expect(page.locator('input[name="nombre"]').or(page.locator('input[placeholder*="Nombre"]'))).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="cedula"]').or(page.locator('input[placeholder*="Cédula"]'))).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="telefono"]').or(page.locator('input[placeholder*="300"]'))).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Módulo: Decoraciones', () => {
  test('debería mostrar la lista de decoraciones', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await expect(page.locator('h1:has-text("Decoraciones")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener buscador de decoraciones', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await expect(page.locator('input[placeholder*="Buscar"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('debería tener tabla o empty state de decoraciones', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await expect(page.locator('table, [class*="EmptyState"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería abrir modal al crear decoración', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await page.click('button:has-text("Nueva")');
    await expect(page.locator('h2:has-text("Nueva")')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener filtros de decoraciones', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('debería tener botón de reporte', async ({ page }) => {
    await goTo(page, '/decoraciones');
    await expect(page.locator('button:has-text("Generar Reporte")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Módulo: Grupos', () => {
  test('debería mostrar la lista de grupos', async ({ page }) => {
    await goTo(page, '/grupos');
    await expect(page.locator('h1:has-text("Grupos y Elites")')).toBeVisible({ timeout: 15000 });
  });

  test('debería tener tabla o empty state de grupos', async ({ page }) => {
    await goTo(page, '/grupos');
    await expect(page.locator('table, [class*="EmptyState"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería abrir modal al crear grupo', async ({ page }) => {
    await goTo(page, '/grupos');
    await page.click('button:has-text("Nuevo grupo")');
    await expect(page.locator('h2:has-text("Nuevo")')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener selector de tipo GRUPO/ELITE', async ({ page }) => {
    await goTo(page, '/grupos');
    await page.click('button:has-text("Nuevo grupo")');
    
    await expect(page.locator('select[name="tipo"], select#tipo')).toBeVisible({ timeout: 10000 });
    await page.locator('select[name="tipo"]').selectOption('GRUPO');
    const selectedOption = await page.locator('select[name="tipo"]').inputValue();
    expect(selectedOption).toBe('GRUPO');
  });
});
