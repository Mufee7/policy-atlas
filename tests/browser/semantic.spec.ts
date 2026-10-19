import {test, expect} from './visible-test';
import type {Page} from '@playwright/test';

async function openSearch(page: Page) {
  const loaded = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.goto('/signin-with-chatgpt?return_to=/');
  await loaded;
  await page.getByLabel('In effect on', {exact: true}).fill('2026-10-19');
  await page.getByRole('combobox', {name: 'Department', exact: true}).selectOption('Security');
  await page.getByRole('combobox', {name: 'Search mode', exact: true}).selectOption('semantic');
  await page.getByLabel('Search policies', {exact: true}).fill('incident reporting discovery');
}

test('real local WASM inference, cited evidence and historical version filters', async ({page, context}, testInfo) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  const network: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  context.on('request', r => network.push(r.url()));
  await openSearch(page);
  console.log('Starting real browser WASM inference with a fresh browser cache.');
  await page.getByRole('button', {name: 'Find evidence', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Find evidence', exact: true})).toBeEnabled({timeout: 195_000});
  await expect(page.getByRole('button', {name: 'Use keyword search', exact: true})).toHaveCount(0);
  const incident = page.locator('article.result').filter({hasText: 'Report suspected security incidents to the security team within one hour of discovery.'});
  await expect(incident).toHaveCount(1);
  await expect(incident).toContainText('POL-002 / v1.0');
  await expect(incident).toContainText('Cosine');
  await incident.locator('.citation').click();
  const inspector = page.getByRole('dialog', {name: 'Information Security Policy', exact: true});
  await expect(inspector.locator('.highlighted')).toContainText(['Report suspected security incidents to the security team within one hour of discovery.']);
  await page.screenshot({path: testInfo.outputPath('real-wasm-source.png'), fullPage: true});
  await page.getByRole('button', {name: 'Close source', exact: true}).click();

  console.log('Checking the exclusive historical version cutoff in semantic mode.');
  // Keyword mode avoids starting intermediate searches as filters are edited.
  await page.getByRole('combobox', {name: 'Search mode', exact: true}).selectOption('keyword');
  await page.getByRole('combobox', {name: 'Department', exact: true}).selectOption('People');
  await page.getByLabel('In effect on', {exact: true}).fill('2026-06-30');
  await page.getByLabel('Search policies', {exact: true}).fill('remote work allowance');
  await page.getByRole('button', {name: 'Find evidence', exact: true}).click();
  await page.getByRole('combobox', {name: 'Search mode', exact: true}).selectOption('semantic');
  await expect(page.getByRole('button', {name: 'Find evidence', exact: true})).toBeEnabled({timeout: 195_000});
  const remote = page.locator('article.result').filter({hasText: 'POL-001 /'});
  await expect(remote.first()).toBeVisible();
  for (const meta of await remote.locator('.result-meta').allTextContents()) expect(meta).toContain('v1.0');
  await expect(page.locator('article.result .result-meta').filter({hasText: 'POL-001 / v2.0'})).toHaveCount(0);
  await page.getByLabel('In effect on', {exact: true}).fill('2026-07-01');
  await expect(page.getByRole('button', {name: 'Find evidence', exact: true})).toBeEnabled({timeout: 195_000});
  await expect(remote.first()).toBeVisible();
  for (const meta of await remote.locator('.result-meta').allTextContents()) expect(meta).toContain('v2.0');
  await expect(page.locator('article.result .result-meta').filter({hasText: 'POL-001 / v1.0'})).toHaveCount(0);
  await page.screenshot({path: testInfo.outputPath('semantic-version-cutoff.png'), fullPage: true});

  // Only same-origin model/runtime assets should be requested. Google Fonts are
  // an existing UI dependency and are unrelated to embedding inference.
  const assets = network.filter(url => /\/models\/|\.wasm(?:\?|$)/.test(url));
  expect(assets.some(url => url.includes('model_quantized.onnx'))).toBeTruthy();
  expect(assets.some(url => url.includes('.wasm'))).toBeTruthy();
  for (const url of assets) expect(new URL(url).origin).toBe('http://127.0.0.1:5173');
  const external = network.filter(url => /^https?:/.test(url) && new URL(url).origin !== 'http://127.0.0.1:5173');
  for (const url of external) expect(['fonts.googleapis.com', 'fonts.gstatic.com']).toContain(new URL(url).hostname);
  expect(errors).toEqual([]);
});

test('cancel a stalled model download and return to working keyword search', async ({page, context}, testInfo) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => {release = resolve;});
  let reached!: () => void;
  const requested = new Promise<void>(resolve => {reached = resolve;});
  await context.route('**/models/minilm/onnx/model_quantized.onnx', async route => {
    reached();
    await gate;
    await route.abort('failed').catch(() => {});
  });
  try {
    await openSearch(page);
    await page.getByRole('button', {name: 'Find evidence', exact: true}).click();
    await Promise.race([requested, new Promise((_, reject) => setTimeout(() => reject(new Error('Model download was not requested')), 30_000))]);
    await expect(page.getByRole('button', {name: 'Find evidence', exact: true})).toBeDisabled();
    await page.getByRole('button', {name: 'Cancel · use keyword search', exact: true}).click();
    release();
    await expect(page.getByRole('combobox', {name: 'Search mode', exact: true})).toHaveValue('keyword');
    await expect(page.locator('article.result').filter({hasText: 'within one hour of discovery'})).toContainText('BM25');
    await expect.poll(() => page.workers().length).toBe(0);
    await expect(page.getByRole('button', {name: 'Find evidence', exact: true})).toBeEnabled();
    await page.screenshot({path: testInfo.outputPath('cancelled-to-keyword.png'), fullPage: true});
  } finally {release();}
});

test('model asset failure offers an explicit working keyword fallback', async ({page, context}, testInfo) => {
  await context.route('**/models/minilm/onnx/model_quantized.onnx', route => route.abort('failed'));
  await openSearch(page);
  await page.getByRole('button', {name: 'Find evidence', exact: true}).click();
  const fallback = page.getByRole('button', {name: 'Use keyword search', exact: true});
  await expect(fallback).toBeVisible({timeout: 45_000});
  await expect(page.getByRole('heading', {name: 'Meaning-based search could not finish', exact: true})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'No matching evidence', exact: true})).toHaveCount(0);
  await expect(page.locator('.alert').filter({has: fallback})).toContainText('The local model could not load or run.');
  await expect(page.locator('.alert').filter({has: fallback})).not.toContainText('allowRemoteModels');
  await page.screenshot({path: testInfo.outputPath('simulated-model-error.png'), fullPage: true});
  await fallback.click();
  await expect(page.getByRole('combobox', {name: 'Search mode', exact: true})).toHaveValue('keyword');
  await expect(page.locator('article.result').filter({hasText: 'within one hour of discovery'})).toContainText('BM25');
  await expect(page.getByRole('button', {name: 'Find evidence', exact: true})).toBeEnabled();
  await page.screenshot({path: testInfo.outputPath('error-keyword-fallback.png'), fullPage: true});
});
