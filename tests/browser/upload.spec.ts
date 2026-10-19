import {test, expect} from './visible-test';
import {readFile} from 'node:fs/promises';

test('TXT upload, extraction, refresh, search citation and duplicate rejection', async ({page}, testInfo) => {
  const run = Date.now().toString();
  const documentId = `QA-TXT-${run}`;
  const title = `Fictional Equipment Checkout QA ${run}`;
  const content = `1. Scope\nThis fictional policy applies to synthetic equipment checkout exercises.\n\n2. Checkout Evidence\nCobalt lantern equipment must be returned within seven calendar days.\nThe training coordinator records each return in the fictional ledger.\n\n3. QA Run\nSynthetic browser test ${run}. No real employee data.\n`;
  const file = {name: 'fictional-equipment-checkout.txt', mimeType: 'text/plain', buffer: Buffer.from(content)};
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const libraryLoaded = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.goto('/signin-with-chatgpt?return_to=/');
  await libraryLoaded;

  async function prepareUpload(id: string) {
    await page.getByRole('button', {name: 'Upload document', exact: true}).click();
    const modal = page.getByRole('dialog', {name: 'Add a policy to your library'});
    await modal.getByLabel('Choose policy document').setInputFiles(file);
    await modal.getByRole('textbox', {name: 'Document title', exact: true}).fill(title);
    await modal.getByRole('textbox', {name: 'Document ID', exact: true}).fill(id);
    await modal.getByRole('textbox', {name: 'Version', exact: true}).fill('1.0');
    await modal.getByRole('textbox', {name: 'Department', exact: true}).fill('Training');
    await modal.getByRole('combobox', {name: 'Approval status', exact: true}).selectOption('approved');
    await modal.getByLabel('Effective from', {exact: true}).fill('2026-01-01');
    await modal.getByRole('checkbox', {name: 'This is a fictional / synthetic document.'}).check();
    await modal.getByRole('button', {name: 'Read document', exact: true}).click();
    await expect(modal.getByText('Extraction ready', {exact: true})).toBeVisible();
    await modal.getByText('Inspect extracted text', {exact: true}).click();
    await expect(modal.locator('.extraction-review pre')).toHaveText(content);
    return modal;
  }

  console.log('Uploading fictional TXT policy:', documentId);
  const modal = await prepareUpload(documentId);
  await page.screenshot({path: testInfo.outputPath('extraction-before-save.png'), fullPage: true});
  const saved = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.request().method() === 'POST');
  await modal.getByRole('button', {name: 'Save document', exact: true}).click();
  expect((await saved).status()).toBe(201);
  await expect(modal).not.toBeVisible();
  await page.getByLabel('Filter library').fill(documentId);
  const row = page.getByRole('row').filter({hasText: documentId});
  await expect(row).toContainText(title);
  await expect(row).toContainText('v1.0');
  await expect(row).toContainText('approved');

  console.log('Refreshing and inspecting the persisted document.');
  const reloaded = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.reload();
  await reloaded;
  await page.getByRole('button', {name: /^Document library/}).click();
  await page.getByLabel('Filter library').fill(documentId);
  await expect(row).toContainText('Your upload');
  await row.getByRole('button', {name: `Inspect ${title} 1.0`, exact: true}).click();
  const inspector = page.getByRole('dialog', {name: title, exact: true});
  await expect(inspector).toContainText('Cobalt lantern equipment must be returned within seven calendar days.');
  const downloading = page.waitForEvent('download');
  await inspector.getByRole('link', {name: 'Original file', exact: true}).click();
  const download = await downloading;
  const originalPath = testInfo.outputPath('downloaded-original.txt');
  await download.saveAs(originalPath);
  expect(await readFile(originalPath, 'utf8')).toBe(content);
  await page.getByRole('button', {name: 'Close source', exact: true}).click();

  console.log('Searching distinctive text and opening its citation.');
  await page.getByRole('button', {name: 'Evidence search', exact: true}).click();
  await page.getByLabel('In effect on', {exact: true}).fill('2026-10-19');
  await page.getByRole('combobox', {name: 'Department', exact: true}).selectOption('Training');
  await page.getByLabel('Search policies', {exact: true}).fill('Cobalt lantern equipment');
  await page.getByRole('button', {name: 'Find evidence', exact: true}).click();
  const result = page.locator('article.result').filter({hasText: documentId}).filter({hasText: 'Cobalt lantern equipment must be returned within seven calendar days.'});
  await expect(result).toContainText('Cobalt lantern equipment must be returned within seven calendar days.');
  await result.locator('.citation').click();
  await expect(inspector.locator('.highlighted')).toContainText([
    '2. Checkout Evidence',
    'Cobalt lantern equipment must be returned within seven calendar days.',
    'The training coordinator records each return in the fictional ledger.',
  ]);
  await page.screenshot({path: testInfo.outputPath('persisted-search-citation.png'), fullPage: true});
  await page.getByRole('button', {name: 'Close source', exact: true}).click();

  console.log('Re-uploading identical bytes with a new ID to check duplicate detection.');
  const duplicate = await prepareUpload(`${documentId}-COPY`);
  const rejected = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.request().method() === 'POST');
  await duplicate.getByRole('button', {name: 'Save document', exact: true}).click();
  expect((await rejected).status()).toBe(409);
  await expect(duplicate.getByRole('alert')).toContainText('already in your library');
  await page.screenshot({path: testInfo.outputPath('duplicate-rejected.png'), fullPage: true});
  console.log('Verified synthetic upload retained for inspection:', documentId);
  expect(errors).toEqual([]);
});
