const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Open the notification panel
  const bell = page.locator('header button').nth(2); // search, quickadd(mobile hidden lg?), theme...
  // More robust: click the button containing the Bell svg
  await page.locator('header button:has(svg.lucide-bell)').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/notif-open.png' });

  // Also open theme dropdown for comparison
  await page.keyboard.press('Escape');
  await page.locator('header button:has(svg.lucide-sun), header button:has(svg.lucide-moon), header button:has(svg.lucide-monitor)').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/theme-open.png' });

  await browser.close();
})();
