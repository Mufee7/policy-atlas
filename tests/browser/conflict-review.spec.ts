import {test, expect} from './visible-test';

// Reserved synthetic QA date keeps this separate from manual review notes.
const date = '2099-12-30';
const note = 'PLAYWRIGHT-QA: Inspected Remote Work v1.0 and v2.0 original lines. Allowance changed from two to three days per week; written manager approval is required in v2.0. Historical change; no authority decision.';

test('inspect both versions, save assessment, refresh, and guard unsaved notes', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  console.log('Opening local development sign-in');
  const libraryLoaded = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.goto('/signin-with-chatgpt?return_to=/', {waitUntil: 'domcontentloaded'});
  await libraryLoaded;
  console.log('Local page loaded');
  async function selectPair(reverse = false) {
    console.log('Selecting conflict-review pair', {reverse});
    await page.getByRole('button', {name: 'Conflict review', exact: true}).click();
    console.log('Conflict review opened');
    await page.getByRole('combobox', {name: 'Document A', exact: true}).selectOption(reverse ? 'sample-remote-2' : 'sample-remote-1');
    console.log('Document A selected');
    await page.getByRole('combobox', {name: 'Document B', exact: true}).selectOption(reverse ? 'sample-remote-1' : 'sample-remote-2');
    console.log('Document B selected');
    const loaded = page.waitForResponse(r => r.url().includes('/api/conflict-reviews?') && r.url().includes(date) && r.request().method() === 'GET');
    await page.getByLabel('Review as of').fill(date);
    expect((await loaded).status()).toBe(200);
    await expect(page.getByRole('button', {name: 'Save review', exact: true})).toBeEnabled();
  }
  await selectPair();
  console.log('Pair loaded; inspecting evidence');
  const notes = page.getByLabel('Reasoning, scope and owner follow-up');
  const existing = await notes.inputValue();
  expect(existing === '' || existing === note, 'Do not overwrite an unrelated human review').toBeTruthy();
  await expect(page.locator('.finding').first()).toContainText('Historical change');
  for (const [index, version, allowance] of [[0, '1.0', 'two'], [1, '2.0', 'three']] as const) {
    await page.locator('.finding .citation').nth(index).click();
    const dialog = page.getByRole('dialog', {name: 'Remote Work Policy'});
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(`Version ${version}`);
    await expect(dialog.locator('.highlighted')).toContainText([
      '2. Remote Work Allowance',
      `Eligible employees may work remotely up to ${allowance} days per week.`,
      version === '1.0' ? 'Manager approval is required before working remotely.' : 'Written manager approval is required before working remotely.',
    ]);
    await page.getByRole('button', {name: 'Close source', exact: true}).click();
    await expect(dialog).not.toBeVisible();
  }
  await page.getByRole('combobox', {name: 'Assessment', exact: true}).selectOption('historical-change');
  await notes.fill(note);
  await expect(page.locator('.review-save')).toContainText('Unsaved changes');
  const saving = page.waitForResponse(r => r.url().endsWith('/api/conflict-reviews') && r.request().method() === 'POST');
  await page.getByRole('button', {name: 'Save review', exact: true}).click();
  expect((await saving).status()).toBe(200);
  await expect(page.locator('.review-save')).not.toContainText('Unsaved changes');
  await expect(page.locator('.review-save')).toContainText('Saved');
  const savedLabel = await page.locator('.review-save > span').innerText();
  const libraryReloaded = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
  await page.reload();
  await libraryReloaded;
  await selectPair();
  await expect(notes).toHaveValue(note);
  await expect(page.getByRole('combobox', {name: 'Assessment', exact: true})).toHaveValue('historical-change');
  await expect(page.locator('.review-save > span')).toHaveText(savedLabel);
  await page.screenshot({path: 'outputs/playwright/review-after-refresh.png', fullPage: true});
  // Navigating away resets selectors, allowing an unambiguous reversed-pair load.
  await page.getByRole('button', {name: 'Evidence search', exact: true}).click();
  await selectPair(true);
  await expect(notes).toHaveValue(note);
  await expect(page.getByRole('combobox', {name: 'Assessment', exact: true})).toHaveValue('historical-change');
  await notes.fill(note + ' UNSAVED TEST');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', {name: 'Evidence search', exact: true}).click();
  await expect(notes).toHaveValue(note + ' UNSAVED TEST');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', {name: 'Evidence search', exact: true}).click();
  await selectPair();
  await expect(notes).toHaveValue(note);
  expect(errors).toEqual([]);
});

