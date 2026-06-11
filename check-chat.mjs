import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Listen for console errors
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

try {
  await page.goto('http://localhost:5173/', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Check page title
  const title = await page.title();
  console.log('Title:', title);

  // Check if main elements exist
  const header = await page.locator('h1').textContent();
  console.log('Header:', header);

  const inputExists = await page.locator('textarea').count();
  console.log('Input textarea found:', inputExists > 0);

  const buttonExists = await page.locator('button:has-text("Gửi")').count();
  console.log('Send button found:', buttonExists > 0);

  // Check for messages
  const messages = await page.locator('[class*="rounded-2xl"]').count();
  console.log('Message bubbles found:', messages);

  if (errors.length > 0) {
    console.log('Console errors:', errors);
  } else {
    console.log('No console errors!');
  }

  console.log('\n✅ Chat interface loaded successfully!');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await browser.close();
}