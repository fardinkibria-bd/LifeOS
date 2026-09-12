const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Open the notification panel
  // More robust: click the button containing the Bell svg
  await page.locator('header button:has(svg.lucide-bell)').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/notif-open.png' });

  await browser.close();
})();
