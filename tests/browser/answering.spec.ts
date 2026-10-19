import {test,expect} from './visible-test';

test('extractive answer preserves conditions, verifies source, exports and refuses a missing fact',async({page},testInfo)=>{
 await page.goto('/signin-with-chatgpt?return_to=/');
 await page.getByLabel('In effect on',{exact:true}).fill('2026-10-19');
 await page.getByLabel('Search policies',{exact:true}).fill('What is the remote work allowance?');
 await page.getByRole('button',{name:'Find evidence',exact:true}).click();
 const answer=page.getByRole('region',{name:'Extractive answer',exact:true});
 await expect(answer.getByRole('heading',{name:'Extractive answer',exact:true})).toBeVisible();
 await expect(answer).toContainText('Interns and contractors are not covered.');
 await expect(answer).toContainText('Written manager approval is required');
 await expect(answer).toContainText('department head and People Operations');
 await answer.getByRole('button',{name:/POL-001 \/ v2.0/}).nth(1).click();
 const source=page.getByRole('dialog',{name:'Remote Work Policy',exact:true});
 await expect(source.locator('.highlighted')).toContainText(['Eligible employees may work remotely up to three days per week.','Written manager approval is required before working remotely.']);
 await page.getByRole('button',{name:'Close source',exact:true}).click();
 const pending=page.waitForEvent('download');
 await answer.getByRole('button',{name:'Export answer decision and citations',exact:true}).click();
 const file=await pending;await file.saveAs(testInfo.outputPath('answer-decision.json'));
 await page.screenshot({path:testInfo.outputPath('supported-answer.png'),fullPage:true});
 await page.getByLabel('Search policies',{exact:true}).fill('What is the remote work insurance allowance?');
 await page.getByRole('button',{name:'Find evidence',exact:true}).click();
 await expect(answer.getByRole('heading',{name:'Insufficient evidence to answer',exact:true})).toBeVisible();
 await expect(answer.locator('blockquote')).toHaveCount(0);
 await page.screenshot({path:testInfo.outputPath('insufficient-evidence.png'),fullPage:true});
});
