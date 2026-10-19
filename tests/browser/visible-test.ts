import {test as base, expect} from '@playwright/test';

// An automatic fixture applies in every spec, even when this module is cached.
export const test = base.extend<{keepVisibleForInspection: void}>({
  keepVisibleForInspection: [async ({page}, use) => {
    await use();
    console.log('Browser check finished; keeping the window open for 10 seconds.');
    await page.waitForTimeout(10_000);
  }, {auto: true}],
});
export {expect};
