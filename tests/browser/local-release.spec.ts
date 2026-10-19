import {test, expect} from './visible-test';
import {readFile} from 'node:fs/promises';
import type {Page} from '@playwright/test';

async function openApp(page:Page){
  const loaded=page.waitForResponse(r=>r.url().endsWith('/api/documents')&&r.status()===200);
  await page.goto('/signin-with-chatgpt?return_to=/');
  await loaded;
}

test('version comparison preserves direction, source versions and exported evidence', async ({page}, info) => {
  await openApp(page);
  await page.getByRole('button', {name:'Version comparison', exact:true}).click();
  await page.getByRole('combobox',{name:'Policy family',exact:true}).selectOption('POL-001');
  await page.getByRole('combobox', {name:'Before',exact:true}).selectOption('sample-remote-1');
  await page.getByRole('combobox', {name:'After',exact:true}).selectOption('sample-remote-2');
  await expect(page.locator('.compare-identity')).toContainText('v1.0');
  await expect(page.locator('.compare-identity')).toContainText('v2.0');
  for (const [version, word] of [['1.0','two'], ['2.0','three']]) {
    await page.getByRole('button', {name:new RegExp(`Inspect POL-001 version ${version},`)}).first().click();
    const source=page.getByRole('dialog', {name:'Remote Work Policy',exact:true});
    await expect(source).toContainText(`Version ${version}`);
    await expect(source).toContainText(`up to ${word} days per week`);
    await page.getByRole('button', {name:'Close source',exact:true}).click();
  }
  await page.getByRole('button', {name:'Swap comparison direction',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Before',exact:true})).toHaveValue('sample-remote-2');
  await expect(page.getByRole('combobox',{name:'After',exact:true})).toHaveValue('sample-remote-1');
  await expect(page.getByText(/Reverse chronology:/)).toBeVisible();
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export comparison',exact:true}).click();
  const download=await pending, path=info.outputPath('comparison.json');await download.saveAs(path);
  const exported=JSON.parse(await readFile(path,'utf8'));
  expect(exported.before.version).toBe('2.0');expect(exported.after.version).toBe('1.0');
  expect(exported.groups.length).toBeGreaterThan(0);
  await page.screenshot({path:info.outputPath('reverse-comparison.png'),fullPage:true});
});

test('known grammar limitation refuses an answerable paraphrase without hiding source evidence', async ({page},info) => {
  await openApp(page);
  await page.getByLabel('In effect on',{exact:true}).fill('2026-10-19');
  await page.getByLabel('Search policies',{exact:true}).fill('Whose permission is needed for remote work?');
  await page.getByRole('button',{name:'Find evidence',exact:true}).click();
  await expect(page.getByRole('region',{name:'Extractive answer',exact:true})).toContainText('Insufficient evidence to answer');
  await page.locator('article.result').filter({hasText:'Written manager approval is required'}).first().locator('.citation').click();
  await expect(page.getByRole('dialog',{name:'Remote Work Policy',exact:true})).toContainText('Written manager approval is required');
  await page.screenshot({path:info.outputPath('answerable-paraphrase-refused.png'),fullPage:true});
});

test('library failure offers retry and does not present an answer as supported', async ({page}) => {
  let fail=true;
  await page.route('**/api/documents', route => fail && route.request().method()==='GET'
    ? route.fulfill({status:503,json:{error:'The document library is unavailable. Please try again.'}})
    : route.continue());
  await page.goto('/signin-with-chatgpt?return_to=/');
  await expect(page.locator('.alert').filter({hasText:'The document library is unavailable.'})).toBeVisible();
  fail=false;
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(page.locator('.alert').filter({hasText:'The document library is unavailable.'})).toHaveCount(0);
  await expect(page.getByRole('combobox',{name:'Department',exact:true})).toContainText('People');
});

test('empty and unsupported uploads fail clearly; invalid dates preserve the upload draft', async ({page}) => {
  await openApp(page);
  await page.getByRole('button',{name:'Upload document',exact:true}).click();
  const modal=page.getByRole('dialog',{name:'Add a policy to your library'});
  await modal.getByRole('textbox',{name:'Document title',exact:true}).fill('Fictional invalid upload');
  await modal.getByRole('textbox',{name:'Document ID',exact:true}).fill('QA-INVALID-RELEASE');
  await modal.getByLabel('Effective from',{exact:true}).fill('2026-03-01');
  for(const [name,buffer,error] of [
    ['empty.txt',Buffer.from(''),/empty/i],
    ['unsupported.exe',Buffer.from('fictional'),/TXT|PDF|DOCX|supported/i],
  ] as const){
    await modal.getByLabel('Choose policy document').setInputFiles({name,mimeType:'application/octet-stream',buffer});
    await modal.getByRole('button',{name:'Read document',exact:true}).click();
    await expect(modal.getByRole('alert')).toContainText(error);
  }
  await modal.getByLabel('Choose policy document').setInputFiles({name:'fictional.txt',mimeType:'text/plain',buffer:Buffer.from('Fictional release validation only. No employee data.')});
  await modal.getByLabel('Effective until (optional)',{exact:true}).fill('2026-02-01');
  await modal.getByRole('button',{name:'Read document',exact:true}).click();
  const saving=page.waitForResponse(r=>r.url().endsWith('/api/documents')&&r.request().method()==='POST');
  await modal.getByRole('button',{name:'Save document',exact:true}).click();
  expect((await saving).status()).toBe(400);
  await expect(modal.getByRole('alert')).toContainText('End date must be after start date');
  await expect(modal.getByRole('textbox',{name:'Document title',exact:true})).toHaveValue('Fictional invalid upload');
  await expect(modal.getByText('Extraction ready',{exact:true})).toBeVisible();
});
