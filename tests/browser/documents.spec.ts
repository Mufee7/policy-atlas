import {test, expect} from './visible-test';
import {readFile} from 'node:fs/promises';

const cases = [
  {format: 'pdf', filename: 'travel-policy.pdf', title: 'QA Browser Fictional Travel PDF', id: 'QA-BROWSER-PDF', query: 'domestic meal allowance', evidence: 'The domestic meal allowance is LKR 3,500 per travel day.', unit: 2, unitName: 'Page', count: 2},
  {format: 'docx', filename: 'access-policy.docx', title: 'QA Browser Fictional Access DOCX', id: 'QA-BROWSER-DOCX', query: 'service desk portal', evidence: 'Employees must submit access requests through the service desk portal.', unit: 4, unitName: 'Paragraph', count: 7},
] as const;

for (const fixture of cases) {
  test(`${fixture.format.toUpperCase()} extraction, persistence, citations and original download`, async ({page}, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const loaded = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
    await page.goto('/signin-with-chatgpt?return_to=/');
    const library = await (await loaded).json();
    const existing = library.documents.find((p: {documentId: string}) => p.documentId === fixture.id);
    if (existing) {
      expect(existing.title, 'Only reuse this test fixture; never overwrite human data').toBe(fixture.title);
      expect(existing.synthetic).toBe(true);
      expect(existing.filename).toBe(fixture.filename);
    }

    console.log(`Reading bundled fictional ${fixture.format.toUpperCase()}: ${fixture.filename}`);
    await page.getByRole('button', {name: 'Upload document', exact: true}).click();
    const modal = page.getByRole('dialog', {name: 'Add a policy to your library'});
    await modal.getByLabel('Choose policy document').setInputFiles(`public/samples/${fixture.filename}`);
    await modal.getByRole('textbox', {name: 'Document title', exact: true}).fill(fixture.title);
    await modal.getByRole('textbox', {name: 'Document ID', exact: true}).fill(fixture.id);
    await modal.getByRole('textbox', {name: 'Version', exact: true}).fill('1.0');
    await modal.getByRole('textbox', {name: 'Department', exact: true}).fill('Training');
    await modal.getByRole('combobox', {name: 'Approval status', exact: true}).selectOption('approved');
    await modal.getByLabel('Effective from', {exact: true}).fill('2026-01-01');
    await modal.getByRole('checkbox', {name: 'This is a fictional / synthetic document.'}).check();
    await modal.getByRole('button', {name: 'Read document', exact: true}).click();
    await expect(modal.getByText('Extraction ready', {exact: true})).toBeVisible();
    await modal.getByText('Inspect extracted text', {exact: true}).click();
    await expect(modal.locator('.preview-unit')).toHaveCount(fixture.count);
    const unit = modal.locator('.preview-unit').filter({hasText: fixture.evidence});
    await expect(unit.locator('strong')).toHaveText(`${fixture.unitName} ${fixture.unit}`);
    await page.screenshot({path: testInfo.outputPath('extraction-preview.png'), fullPage: true});

    // Saving without accepting limitations must stay in the inspection step.
    await modal.getByRole('button', {name: 'Save document', exact: true}).click();
    await expect(modal.getByRole('alert')).toContainText('Review and acknowledge');
    await modal.getByRole('checkbox', {name: 'I reviewed the extraction limitations and searchable text.'}).check();
    const saving = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.request().method() === 'POST');
    await modal.getByRole('button', {name: 'Save document', exact: true}).click();
    const response = await saving;
    expect(response.status(), await response.text()).toBe(existing ? 409 : 201);
    if (existing) {
      // Repeat runs reuse the earlier persisted fixture instead of creating more copies.
      await expect(modal.getByRole('alert')).toContainText('already in your library');
      await modal.getByRole('button', {name: 'Close upload', exact: true}).click();
    }
    await expect(modal).not.toBeVisible();

    console.log(`Refreshing ${fixture.id} and checking metadata and original bytes.`);
    const refreshed = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.status() === 200);
    await page.reload();
    await refreshed;
    await page.getByRole('button', {name: /^Document library/}).click();
    await page.getByLabel('Filter library').fill(fixture.id);
    const row = page.getByRole('row').filter({hasText: fixture.id});
    await expect(row).toContainText('v1.0');
    await expect(row).toContainText('approved');
    await expect(row).toContainText(fixture.format.toUpperCase());
    await row.getByRole('button', {name: `Inspect ${fixture.title} 1.0`, exact: true}).click();
    const inspector = page.getByRole('dialog', {name: fixture.title, exact: true});
    await expect(inspector).toContainText(fixture.evidence);
    const downloading = page.waitForEvent('download');
    await inspector.getByRole('link', {name: 'Original file', exact: true}).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe(fixture.filename);
    const savedPath = testInfo.outputPath(`original.${fixture.format}`);
    await download.saveAs(savedPath);
    expect(await readFile(savedPath)).toEqual(await readFile(`public/samples/${fixture.filename}`));
    await page.getByRole('button', {name: 'Close source', exact: true}).click();

    console.log(`Searching ${fixture.format.toUpperCase()} evidence and checking source provenance.`);
    await page.getByRole('button', {name: 'Evidence search', exact: true}).click();
    await page.getByLabel('In effect on', {exact: true}).fill('2026-10-19');
    await page.getByRole('combobox', {name: 'Department', exact: true}).selectOption('Training');
    await page.getByLabel('Search policies', {exact: true}).fill(fixture.query);
    await page.getByRole('button', {name: 'Find evidence', exact: true}).click();
    const result = page.locator('article.result').filter({hasText: fixture.id}).filter({hasText: fixture.evidence});
    await expect(result).toHaveCount(1);
    await expect(result.locator('.citation')).toContainText(new RegExp(`${fixture.unitName.toLowerCase()} ${fixture.unit}`, 'i'));
    await result.locator('.citation').click();
    await expect(inspector.locator('.cited-unit h3')).toContainText(fixture.format === 'pdf' ? 'Page 2' : 'Extracted paragraph 4');
    await expect(inspector.locator('.cited-unit .highlighted')).toContainText([fixture.evidence]);
    await page.screenshot({path: testInfo.outputPath('persisted-source-citation.png'), fullPage: true});
    expect(errors).toEqual([]);
    console.log(`Verified ${fixture.id}; fixture retained for inspection.`);
  });
}
