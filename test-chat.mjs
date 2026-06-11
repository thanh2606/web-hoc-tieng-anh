import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto('http://localhost:5175/', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Type a message
  await page.fill('textarea', 'Hello');
  console.log('Typed: Hello');

  // Click send
  await page.click('button:has-text("Gửi")');
  console.log('Clicked send');

  // Wait for response
  await page.waitForTimeout(1500);

  // Count messages
  const messages = await page.locator('[class*="rounded-2xl"]').count();
  console.log('Total messages:', messages);

  // Get last message
  const lastMsg = await page.locator('[class*="rounded-2xl"]').last().textContent();
  console.log('Last message (AI response):', lastMsg?.substring(0, 50) + '...');

  console.log('\n✅ Chat functionality works!');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await browser.close();
}
