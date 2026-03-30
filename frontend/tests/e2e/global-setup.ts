import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

export default async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      'x-test-mode': 'true',
    },
  });
  const page = await context.newPage();
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', 'admin@artesanias.com');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    console.log('Login successful - navigated to dashboard');
  } catch (e) {
    const errorText = await page.locator('.bg-red-50 p').textContent().catch(() => 'No error message found');
    const currentUrl = page.url();
    console.error(`Login failed or timeout. URL: ${currentUrl}, Error: ${errorText}`);
    throw e;
  }
  
  await context.storageState({ path: 'tests/e2e/.auth/user.json' });
  
  await browser.close();
};
