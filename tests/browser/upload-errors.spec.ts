import {test, expect} from './visible-test';
import type {Page} from '@playwright/test';

async function openUpload(page: Page, id: string) {
  const loaded = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.goto('/signin-with-chatgpt?return_to=/');
  const library = await (await loaded).json();
  await page.getByRole('button', {name: 'Upload document', exact: true}).click();
  const modal = page.getByRole('dialog', {name: 'Add a policy to your library'});
  await modal.getByRole('textbox', {name: 'Document title', exact: true}).fill('Fictional upload failure QA');
  await modal.getByRole('textbox', {name: 'Document ID', exact: true}).fill(id);
  await modal.getByRole('checkbox', {name: 'This is a fictional / synthetic document.'}).check();
  return {modal, library};
}

test('image-only, encrypted and damaged PDFs show errors without saving', async ({page}, testInfo) => {
  const {modal, library} = await openUpload(page, 'QA-PDF-REJECTED');
  const writes: string[] = [];
  page.on('request', r => {if (r.url().endsWith('/api/documents') && r.method() === 'POST') writes.push(r.url());});
  const cases = [
    {name: 'image-only', file: 'public/samples/image-only.pdf', error: /not enough readable text.*OCR/i},
    {name: 'encrypted', file: 'public/samples/protected.pdf', error: /Password-protected PDFs are not supported/i},
    {name: 'damaged', file: {name: 'damaged.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nThis deliberately damaged synthetic fixture has no objects or trailer.\n%%EOF')}, error: /invalid PDF|damaged|unsupported/i},
  ];
  for (const entry of cases) {
    console.log(`Checking ${entry.name} PDF rejection.`);
    await modal.getByLabel('Choose policy document').setInputFiles(entry.file);
    await modal.getByRole('button', {name: 'Read document', exact: true}).click();
    await expect(modal.getByRole('alert')).toContainText(entry.error);
    await expect(modal.getByRole('button', {name: 'Read document', exact: true})).toBeEnabled();
    await expect(modal.getByRole('button', {name: 'Save document', exact: true})).toHaveCount(0);
    await page.screenshot({path: testInfo.outputPath(`${entry.name}-pdf-error.png`), fullPage: true});
  }
  expect(writes).toEqual([]);
  const after = await page.request.get('/api/documents');
  expect(after.status()).toBe(200);
  expect((await after.json()).documents.map((p: {id: string}) => p.id).sort()).toEqual(library.documents.map((p: {id: string}) => p.id).sort());
});

test('damaged DOCX archive and invalid UTF-8 TXT are rejected without saving', async ({page}, testInfo) => {
  const {modal} = await openUpload(page, 'QA-DAMAGED-REJECTED');
  let writes = 0;
  page.on('request', r => {if (r.url().endsWith('/api/documents') && r.method() === 'POST') writes++;});
  const cases = [
    {name: 'damaged-docx', file: {name: 'damaged.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from([80,75,3,4,0,1,2,3])}, error: /DOCX archive is damaged or unsupported/i},
    {name: 'invalid-utf8', file: {name: 'damaged.txt', mimeType: 'text/plain', buffer: Buffer.from([0xff,0xfe,0x80])}, error: /UTF-8 encoding/i},
  ];
  for (const entry of cases) {
    console.log(`Checking ${entry.name} rejection.`);
    await modal.getByLabel('Choose policy document').setInputFiles(entry.file);
    await modal.getByRole('button', {name: 'Read document', exact: true}).click();
    await expect(modal.getByRole('alert')).toContainText(entry.error);
    await expect(modal.getByRole('button', {name: 'Save document', exact: true})).toHaveCount(0);
    await page.screenshot({path: testInfo.outputPath(`${entry.name}-error.png`), fullPage: true});
  }
  expect(writes).toBe(0);
});

test('oversized TXT, PDF and DOCX fail before extraction or upload', async ({page}, testInfo) => {
  const {modal} = await openUpload(page, 'QA-OVERSIZED-REJECTED');
  let writes = 0;
  page.on('request', r => {if (r.url().endsWith('/api/documents') && r.method() === 'POST') writes++;});
  for (const format of ['txt', 'pdf', 'docx']) {
    console.log(`Checking oversized ${format.toUpperCase()} rejection.`);
    const limit = format === 'txt' ? 512 * 1024 : 5 * 1024 * 1024;
    await modal.getByLabel('Choose policy document').setInputFiles({name: `oversized.${format}`, mimeType: 'application/octet-stream', buffer: Buffer.alloc(limit + 1, 65)});
    await modal.getByRole('button', {name: 'Read document', exact: true}).click();
    await expect(modal.getByRole('alert')).toContainText(format === 'txt' ? 'TXT files must be 512 KB or smaller.' : 'PDF and DOCX files must be 5 MB or smaller.');
    await expect(modal.getByRole('button', {name: 'Save document', exact: true})).toHaveCount(0);
    await page.screenshot({path: testInfo.outputPath(`oversized-${format}-error.png`), fullPage: true});
  }
  expect(writes).toBe(0);
});

test('mixed scanned PDF warns about page 2 and preserves omitted-text warning after refresh', async ({page}, testInfo) => {
  const {modal, library} = await openUpload(page, 'QA-BROWSER-MIXED');
  const title = 'QA Browser Fictional Mixed Scan PDF';
  const existing = library.documents.find((p: {documentId: string}) => p.documentId === 'QA-BROWSER-MIXED');
  if (existing) {
    expect(existing.title).toBe(title);
    expect(existing.synthetic).toBe(true);
    expect(existing.filename).toBe('mixed-scan.pdf');
  }
  await modal.getByLabel('Choose policy document').setInputFiles('public/samples/mixed-scan.pdf');
  await modal.getByRole('textbox', {name: 'Document title', exact: true}).fill(title);
  await modal.getByRole('button', {name: 'Read document', exact: true}).click();
  await expect(modal.getByText('Extraction ready', {exact: true})).toBeVisible();
  await expect(modal.locator('.extraction-notices')).toContainText('Page 2 has little or no extractable text.');
  await expect(modal.locator('.extraction-notices')).toContainText('image content is not searchable');
  await modal.getByText('Inspect extracted text', {exact: true}).click();
  await expect(modal.locator('.preview-unit')).toHaveCount(2);
  await expect(modal.locator('.preview-unit').nth(1).locator('pre')).toHaveText('[No text extracted]');
  await modal.getByRole('button', {name: 'Save document', exact: true}).click();
  await expect(modal.getByRole('alert')).toContainText('Review and acknowledge');
  await page.screenshot({path: testInfo.outputPath('mixed-scan-warning.png'), fullPage: true});
  await modal.getByRole('checkbox', {name: 'I reviewed the extraction limitations and searchable text.'}).check();
  const saving = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.request().method() === 'POST');
  await modal.getByRole('button', {name: 'Save document', exact: true}).click();
  const response = await saving;
  expect(response.status(), await response.text()).toBe(existing ? 409 : 201);
  if (existing) await modal.getByRole('button', {name: 'Close upload', exact: true}).click();
  await expect(modal).not.toBeVisible();
  const refreshed = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.reload();
  await refreshed;
  await expect(page.locator('.alert').filter({hasText: 'Some uploaded pages have little or no extractable text.'})).toBeVisible();
  await page.getByRole('button', {name: /^Document library/}).click();
  await page.getByLabel('Filter library').fill('QA-BROWSER-MIXED');
  const row = page.getByRole('row').filter({hasText: 'QA-BROWSER-MIXED'});
  await expect(row).toContainText('Check extraction / OCR');
  await row.getByRole('button', {name: `Inspect ${title} 1.0`, exact: true}).click();
  const inspector = page.getByRole('dialog', {name: title, exact: true});
  await expect(inspector.locator('.extraction-notices')).toContainText('Page 2 has little or no extractable text.');
  await expect(inspector.locator('.source-units > section').nth(1)).toContainText('No searchable text extracted from this page.');
  await page.screenshot({path: testInfo.outputPath('persisted-mixed-scan-warning.png'), fullPage: true});
});
