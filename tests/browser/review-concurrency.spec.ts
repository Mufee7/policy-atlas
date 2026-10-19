import {test, expect} from './visible-test';
import type {Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const pair = {left: 'sample-remote-1', right: 'sample-remote-2'};
const notesLabel = 'Reasoning, scope and owner follow-up';
async function selectReview(page: Page, date: string) {
  const library = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.goto('/signin-with-chatgpt?return_to=/');
  await library;
  await page.getByRole('button', {name: 'Conflict review', exact: true}).click();
  const loaded = page.waitForResponse(r => r.url().includes('/api/conflict-reviews?') && r.url().includes(date));
  await page.getByLabel('Review as of').fill(date);
  expect((await loaded).status()).toBe(200);
  await expect(page.getByRole('button', {name: 'Save review', exact: true})).toBeEnabled();
}
async function save(page: Page, expectedStatus: number) {
  const response = page.waitForResponse(r => r.url().endsWith('/api/conflict-reviews') && r.request().method() === 'POST');
  await page.getByRole('button', {name: 'Save review', exact: true}).click();
  expect((await response).status()).toBe(expectedStatus);
}

test('two visible tabs cannot silently overwrite a review and can recover their drafts', async ({page, context}, testInfo) => {
  const date = '2099-12-24';
  await selectReview(page, date);
  const original = await page.getByLabel(notesLabel).inputValue();
  expect(!original || original.startsWith('PLAYWRIGHT-CONCURRENT-'), 'Never replace a human note').toBeTruthy();
  const second = await context.newPage();
  await selectReview(second, date);
  const noteA = 'PLAYWRIGHT-CONCURRENT-A: First tab saved this synthetic assessment.';
  const noteB = 'PLAYWRIGHT-CONCURRENT-B: Second tab draft must survive the rejected save.';
  const merged = 'PLAYWRIGHT-CONCURRENT-MERGED: Reviewed the latest assessment and manually combined the synthetic notes.';
  await page.bringToFront();
  console.log('Tab A saves; tab B still holds the older revision.');
  await page.getByLabel(notesLabel).fill(noteA);
  await save(page, 200);
  await second.bringToFront();
  await second.getByLabel(notesLabel).fill(noteB);
  await save(second, 409);
  await expect(second.locator('.review-decision .alert')).toContainText('changed in another tab or session');
  await expect(second.getByLabel(notesLabel)).toHaveValue(noteB);
  await expect(second.getByRole('button', {name: 'Save review', exact: true})).toBeDisabled();
  await expect(second.locator('.review-save')).toContainText('Unsaved changes');
  const exporting = second.waitForEvent('download');
  await second.getByRole('button', {name: 'Export review', exact: true}).click();
  const exportPath = testInfo.outputPath('rejected-draft.json');
  await (await exporting).saveAs(exportPath);
  const draft = JSON.parse(await readFile(exportPath, 'utf8'));
  expect(draft.review.notes).toBe(noteB);
  expect(draft.review.unsaved).toBe(true);
  await second.screenshot({path: testInfo.outputPath('overwrite-blocked.png'), fullPage: true});
  const stored = await (await page.request.get('/api/conflict-reviews?' + new URLSearchParams({...pair, date}))).json();
  expect(stored.review.notes).toBe(noteA);
  second.once('dialog', dialog => dialog.dismiss());
  await second.getByRole('button', {name: 'Reload review', exact: true}).click();
  await expect(second.getByLabel(notesLabel)).toHaveValue(noteB);
  second.once('dialog', dialog => dialog.accept());
  const latest = second.waitForResponse(r => r.url().includes('/api/conflict-reviews?') && r.url().includes(date));
  await second.getByRole('button', {name: 'Reload review', exact: true}).click();
  expect((await latest).status()).toBe(200);
  await expect(second.getByLabel(notesLabel)).toHaveValue(noteA);
  await second.getByLabel(notesLabel).fill(merged);
  await save(second, 200);
  await page.bringToFront();
  await selectReview(page, date);
  await expect(page.getByLabel(notesLabel)).toHaveValue(merged);
  await page.screenshot({path: testInfo.outputPath('merged-after-refresh.png'), fullPage: true});
});

test('atomic revision guard allows one create or update and rejects missing revisions', async ({page}) => {
  await selectReview(page, '2099-12-23');
  let date: string;
  let existing;
  do {
    date = `${2600 + Math.floor(Math.random() * 6000)}-12-24`;
    existing = await (await page.request.get('/api/conflict-reviews?' + new URLSearchParams({...pair, date}))).json();
  } while (existing.review);
  const body = {...pair, date, status: 'needs-review', notes: 'PLAYWRIGHT-ATOMIC-QA: Synthetic simultaneous save.'};
  const initial = await Promise.all([1,2].map(n => page.request.post('/api/conflict-reviews', {data: {...body, notes: body.notes + n, baseRevision: null}})));
  expect(initial.map(r => r.status()).sort()).toEqual([200,409]);
  const first = await (await page.request.get('/api/conflict-reviews?' + new URLSearchParams({...pair, date}))).json();
  expect(first.review.revision).toMatch(/^[a-f0-9-]{36}$/);
  const updates = await Promise.all([1,2].map(n => page.request.post('/api/conflict-reviews', {data: {...body, notes: body.notes + ' update ' + n, baseRevision: first.review.revision}})));
  expect(updates.map(r => r.status()).sort()).toEqual([200,409]);
  const final = await (await page.request.get('/api/conflict-reviews?' + new URLSearchParams({...pair, date}))).json();
  expect(final.review.revision).not.toBe(first.review.revision);
  const stale = await page.request.post('/api/conflict-reviews', {data: {...body, baseRevision: first.review.revision}});
  expect(stale.status()).toBe(409);
  const missing = await page.request.post('/api/conflict-reviews', {data: body});
  expect(missing.status()).toBe(400);
  const unchanged = await (await page.request.get('/api/conflict-reviews?' + new URLSearchParams({...pair, date}))).json();
  expect(unchanged.review).toEqual(final.review);
  console.log('Atomic create/update races passed; synthetic review retained at', date);
});
