import {test, expect} from './visible-test';
import type {Page} from '@playwright/test';

async function openApp(page: Page) {
  const loaded = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.goto('/signin-with-chatgpt?return_to=/');
  await loaded;
}
async function noPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test('keyboard search, source and upload dialogs trap and restore focus', async ({page}, testInfo) => {
  await openApp(page);
  await page.getByRole('combobox', {name: 'Department', exact: true}).selectOption('People');
  await page.getByLabel('Search policies', {exact: true}).focus();
  await page.keyboard.type('VPN device');
  await page.keyboard.press('Enter');
  const result = page.locator('article.result').filter({hasText: 'VPN'});
  const citation = result.locator('.citation');
  await citation.focus();
  await page.keyboard.press('Enter');
  const source = page.getByRole('dialog', {name: 'Remote Work Policy', exact: true});
  await expect(source).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(source.getByRole('button', {name: 'Download extracted TXT', exact: true})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(source.getByRole('button', {name: 'Close source', exact: true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(source).not.toBeVisible();
  await expect(citation).toBeFocused();
  const uploadButton = page.getByRole('button', {name: 'Upload document', exact: true});
  await uploadButton.focus();
  await page.keyboard.press('Enter');
  const upload = page.getByRole('dialog', {name: 'Add a policy to your library'});
  await expect(upload).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(upload.getByRole('button', {name: 'Close upload', exact: true})).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(upload.getByRole('button', {name: 'Read document', exact: true})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(upload.getByRole('button', {name: 'Close upload', exact: true})).toBeFocused();
  await page.screenshot({path: testInfo.outputPath('keyboard-dialog-focus.png')});
  await page.keyboard.press('Escape');
  await expect(upload).not.toBeVisible();
  await expect(uploadButton).toBeFocused();
});

for (const width of [320,375]) {
  test(`mobile navigation and review controls fit ${width}px viewport`, async ({page}, testInfo) => {
    await page.setViewportSize({width, height: 812});
    await openApp(page);
    await noPageOverflow(page);
    const menu = page.locator('button[aria-label="Toggle menu"]');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', {name:'Close menu',exact:true})).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', {name:'About this project',exact:true})).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', {name:'Close menu',exact:true})).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
    await page.getByRole('button', {name: 'Conflict review', exact: true}).click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
    await expect(page.getByRole('heading', {name: 'Review possible disagreements.', exact: true})).toBeVisible();
    await noPageOverflow(page);
    const selectors = page.locator('.version-selectors select');
    for (const selector of await selectors.all()) {
      const box = await selector.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({path: testInfo.outputPath('mobile-review.png'), fullPage: true});
    await menu.click();
    await page.getByRole('button', {name:'About this project',exact:true}).click();
    await expect(menu).toHaveAttribute('aria-expanded','false');
    await expect(menu).toBeFocused();
    await expect(page.getByRole('heading',{name:'Built to be understood.',exact:true})).toBeVisible();
    await page.getByRole('button', {name: 'Upload document', exact: true}).click();
    const upload = page.getByRole('dialog', {name: 'Add a policy to your library'});
    expect(await upload.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.screenshot({path: testInfo.outputPath('mobile-upload.png')});
    await page.keyboard.press('Escape');
  });
}

test('long TXT preview wraps, late evidence is searchable and source remains usable on mobile', async ({page}, testInfo) => {
  const run = Date.now();
  const id = `QA-LONG-${run}`;
  const title = `Fictional Long Policy QA ${run}`;
  const sections = Array.from({length:80}, (_,i) => `${i+1}. Synthetic section\nFictional training context ${i+1}: ${'example context '.repeat(15)}\nNo real employee data is used.`);
  sections.splice(1,0,`Long synthetic identifier\n${'UNBROKEN'.repeat(500)}`);
  const evidence = 'Violet compass equipment must be returned within nine calendar days.';
  sections.push(`81. Final checkout rule\n${evidence}\nSynthetic QA run ${run}.`);
  const content = sections.join('\n\n');
  await page.setViewportSize({width:375,height:812});
  await openApp(page);
  await page.getByRole('button', {name: 'Upload document', exact: true}).click();
  const modal = page.getByRole('dialog', {name: 'Add a policy to your library'});
  await modal.getByLabel('Choose policy document').setInputFiles({name:'fictional-long-policy.txt',mimeType:'text/plain',buffer:Buffer.from(content)});
  await modal.getByRole('textbox', {name:'Document title',exact:true}).fill(title);
  await modal.getByRole('textbox', {name:'Document ID',exact:true}).fill(id);
  await modal.getByRole('textbox', {name:'Department',exact:true}).fill('Training');
  await modal.getByLabel('Effective from', {exact:true}).fill('2026-01-01');
  await modal.getByRole('checkbox', {name:'This is a fictional / synthetic document.'}).check();
  await modal.getByRole('button', {name:'Read document',exact:true}).click();
  await modal.getByText('Inspect extracted text', {exact:true}).click();
  expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await expect(modal.locator('.extraction-review pre')).toContainText(evidence);
  const preview = modal.getByRole('region',{name:'Extracted text preview',exact:true});
  await preview.focus();
  await page.keyboard.press('End');
  await expect.poll(() => preview.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await modal.getByRole('button', {name:'Save document',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('long-preview.png')});
  const saving = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.request().method()==='POST');
  await modal.getByRole('button', {name:'Save document',exact:true}).click();
  expect((await saving).status()).toBe(201);
  await page.getByRole('button', {name:'Toggle menu',exact:true}).click();
  await page.getByRole('button', {name:'Evidence search',exact:true}).click();
  await page.getByLabel('In effect on', {exact:true}).fill('2026-10-19');
  await page.getByLabel('Search policies', {exact:true}).fill('Violet compass equipment');
  await page.getByRole('button', {name:'Find evidence',exact:true}).click();
  const result = page.locator('article.result').filter({hasText:id}).filter({hasText:evidence});
  await expect(result).toHaveCount(1);
  await result.locator('.citation').click();
  const source = page.getByRole('dialog', {name:title,exact:true});
  await expect(source.locator('.highlighted')).toContainText([evidence]);
  expect(await source.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await source.locator('.highlighted').filter({hasText:evidence}).scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('late-source-evidence.png')});
  await page.getByRole('button', {name:'Close source',exact:true}).click();
  await noPageOverflow(page);
  console.log('Long synthetic fixture retained:', id, 'UTF-8 bytes:',Buffer.byteLength(content));
});
