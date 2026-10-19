import {test, expect} from './visible-test';
import type {Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const notesLabel = 'Reasoning, scope and owner follow-up';
async function openReview(page: Page, date: string) {
  const library = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.goto('/signin-with-chatgpt?return_to=/');
  await library;
  await page.getByRole('button', {name: 'Conflict review', exact: true}).click();
  await page.getByRole('combobox', {name: 'Document A', exact: true}).selectOption('sample-remote-1');
  await page.getByRole('combobox', {name: 'Document B', exact: true}).selectOption('sample-remote-2');
  const loaded = page.waitForResponse(r => r.url().includes('/api/conflict-reviews?') && r.url().includes(date));
  await page.getByLabel('Review as of').fill(date);
  return loaded;
}

async function guardNote(page: Page, date: string, expected: string) {
  const response = await page.request.get('/api/conflict-reviews?' + new URLSearchParams({left: 'sample-remote-1', right: 'sample-remote-2', date}));
  expect(response.status()).toBe(200);
  const {review} = await response.json();
  expect(!review || review.notes === expected, 'Do not overwrite an existing human note').toBeTruthy();
}

test('failed review load disables editing and saving until reload succeeds', async ({page}, testInfo) => {
  let fail = true;
  let writes = 0;
  await page.route('**/api/conflict-reviews?**', route => fail
    ? route.fulfill({status: 503, json: {error: 'Saved review could not be loaded. Retry before saving.'}})
    : route.continue());
  page.on('request', r => {if (r.url().endsWith('/api/conflict-reviews') && r.method() === 'POST') writes++;});
  expect((await openReview(page, '2099-12-28')).status()).toBe(503);
  await expect(page.getByLabel(notesLabel)).toBeDisabled();
  await expect(page.getByRole('combobox', {name: 'Assessment', exact: true})).toBeDisabled();
  await expect(page.getByRole('button', {name: 'Save review', exact: true})).toBeDisabled();
  await page.screenshot({path: testInfo.outputPath('load-failure-disabled.png'), fullPage: true});
  fail = false;
  const reloaded = page.waitForResponse(r => r.url().includes('/api/conflict-reviews?') && r.url().includes('2099-12-28'));
  await page.getByRole('button', {name: 'Reload review', exact: true}).click();
  expect((await reloaded).status()).toBe(200);
  await expect(page.getByLabel(notesLabel)).toBeEnabled();
  await expect(page.getByRole('button', {name: 'Save review', exact: true})).toBeEnabled();
  expect(writes).toBe(0);
});

test('failed save retains unsaved notes and retry persists the assessment', async ({page}, testInfo) => {
  const date = '2099-12-27';
  const note = 'PLAYWRIGHT-RETRY-QA: Synthetic historical review. Failed save must preserve this exact note; retry should persist it.';
  expect((await openReview(page, date)).status()).toBe(200);
  await guardNote(page, date, note);
  let fail = true;
  await page.route('**/api/conflict-reviews', route => fail && route.request().method() === 'POST'
    ? route.fulfill({status: 503, json: {error: 'Review could not be saved. Please try again.'}})
    : route.continue());
  await page.getByRole('combobox', {name: 'Assessment', exact: true}).selectOption('historical-change');
  await page.getByLabel(notesLabel).fill(note);
  await page.getByRole('button', {name: 'Save review', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Retry save', exact: true})).toBeVisible();
  await expect(page.getByLabel(notesLabel)).toHaveValue(note);
  await expect(page.locator('.review-save')).toContainText('Unsaved changes');
  const exporting = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export review', exact: true}).click();
  const exportPath = testInfo.outputPath('unsaved-review.json');
  await (await exporting).saveAs(exportPath);
  const exported = JSON.parse(await readFile(exportPath, 'utf8'));
  expect(exported.review.unsaved).toBe(true);
  expect(exported.review.notes).toBe(note);
  await page.screenshot({path: testInfo.outputPath('failed-save-retained-note.png'), fullPage: true});
  fail = false;
  const saving = page.waitForResponse(r => r.url().endsWith('/api/conflict-reviews') && r.request().method() === 'POST');
  await page.getByRole('button', {name: 'Retry save', exact: true}).click();
  expect((await saving).status()).toBe(200);
  await expect(page.locator('.review-save')).not.toContainText('Unsaved changes');
  const library = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.reload();
  await library;
  await page.getByRole('button', {name: 'Conflict review', exact: true}).click();
  const reloaded = page.waitForResponse(r => r.url().includes('/api/conflict-reviews?') && r.url().includes(date));
  await page.getByLabel('Review as of').fill(date);
  expect((await reloaded).status()).toBe(200);
  await expect(page.getByLabel(notesLabel)).toHaveValue(note);
  await expect(page.getByRole('combobox', {name: 'Assessment', exact: true})).toHaveValue('historical-change');
  await page.screenshot({path: testInfo.outputPath('retry-persisted-after-refresh.png'), fullPage: true});
});

test('unavailable source blocks saving and the real API rejects unknown document IDs', async ({page}, testInfo) => {
  await page.route('**/api/conflict-reviews?**', route => route.fulfill({status: 404, json: {error: 'A selected document is unavailable.'}}));
  expect((await openReview(page, '2099-12-25')).status()).toBe(404);
  await expect(page.locator('.review-decision .alert')).toContainText('A selected document is unavailable.');
  await expect(page.getByLabel(notesLabel)).toBeDisabled();
  await expect(page.getByRole('button', {name: 'Save review', exact: true})).toBeDisabled();
  const missing = await page.request.get('/api/conflict-reviews?' + new URLSearchParams({left: 'qa-nonexistent-source', right: 'sample-remote-2', date: '2099-12-25'}));
  expect(missing.status()).toBe(404);
  expect((await missing.json()).error).toBe('A selected document is unavailable.');
  await page.screenshot({path: testInfo.outputPath('unavailable-source.png'), fullPage: true});
});

test('stale API flag resets assessment, preserves context and allows a fresh saved review', async ({page}, testInfo) => {
  const date = '2099-12-26';
  const oldNote = 'SIMULATED-STALE-QA: Prior synthetic assessment retained for context.';
  const freshNote = 'PLAYWRIGHT-STALE-QA: Rechecked synthetic evidence and saved a fresh needs-clarification assessment.';
  await page.route('**/api/conflict-reviews?**', async route => {
    const requestDate = new URL(route.request().url()).searchParams.get('date');
    const actual = requestDate === date ? await (await route.fetch()).json() : null;
    return requestDate === date
      ? route.fulfill({status: 200, json: {review: {status: 'compatible', notes: oldNote, updatedAt: '2026-01-01T00:00:00.000Z', revision: actual.review?.revision ?? null, stale: true}}})
      : route.continue();
  });
  expect((await openReview(page, date)).status()).toBe(200);
  await guardNote(page, date, freshNote);
  await expect(page.locator('.review-decision .alert')).toContainText('A source changed since the saved review.');
  await expect(page.getByRole('combobox', {name: 'Assessment', exact: true})).toHaveValue('needs-review');
  await expect(page.getByLabel(notesLabel)).toHaveValue(oldNote);
  await page.screenshot({path: testInfo.outputPath('stale-review-reset.png'), fullPage: true});
  await page.getByRole('combobox', {name: 'Assessment', exact: true}).selectOption('needs-clarification');
  await page.getByLabel(notesLabel).fill(freshNote);
  const saving = page.waitForResponse(r => r.url().endsWith('/api/conflict-reviews') && r.request().method() === 'POST');
  await page.getByRole('button', {name: 'Save review', exact: true}).click();
  expect((await saving).status()).toBe(200);
  await expect(page.locator('.review-decision .alert')).toHaveCount(0);
  await page.unroute('**/api/conflict-reviews?**');
  const stored = await page.request.get('/api/conflict-reviews?' + new URLSearchParams({left: 'sample-remote-1', right: 'sample-remote-2', date}));
  expect(stored.status()).toBe(200);
  const {review} = await stored.json();
  expect(review.notes).toBe(freshNote);
  expect(review.status).toBe('needs-clarification');
  expect(review.stale).toBe(false);
  await page.screenshot({path: testInfo.outputPath('fresh-review-saved.png'), fullPage: true});
});
