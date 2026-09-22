const { test, expect } = require('@playwright/test');
const { DreamsTotalPage, DreamsDiaryPage } = require('../pages');
const Logger = require('../utils/logger');

test.describe('Part 1: Dreams Total / Summary Page Tests (dreams-total.html)', () => {
  let totalPage;

  test.beforeEach(async ({ page }) => {
    totalPage = new DreamsTotalPage(page);
    await totalPage.goto();
  });

  test('should verify correct stats displayed on summary page', async () => {
    Logger.info('Starting test: verify summary statistics values');

    const stats = await totalPage.getSummaryStats();
    Logger.info('Captured stats from UI:', JSON.stringify(stats));

    // PDF Requirement validations:
    // Good Dreams: 6
    expect(stats['Good Dreams'], 'Good Dreams count mismatch').toBe(6);

    // Bad Dreams: 4
    expect(stats['Bad Dreams'], 'Bad Dreams count mismatch').toBe(4);

    // Total Dreams: 10
    expect(stats['Total Dreams'], 'Total Dreams count mismatch').toBe(10);

    // Recurring Dreams: 2
    expect(stats['Recurring Dreams'], 'Recurring Dreams count mismatch').toBe(2);

    await totalPage.takeScreenshot('summary-stats-verified');
  });

  test('should assert that "Flying over mountains" and "Lost in maze" are counted as recurring using logic from dreams-diary.html', async ({ browser }) => {
    Logger.info('Starting cross-page validation: recurring dreams calculation from diary');

    // Open a page to fetch diary data
    const diaryContext = await browser.newContext();
    const diaryPageObj = new DreamsDiaryPage(await diaryContext.newPage());
    await diaryPageObj.goto();

    // Compute recurring dreams from the actual diary table entries
    const { frequencyMap, recurringNames, recurringCount } = await diaryPageObj.getRecurringDreams();
    Logger.info('Frequency map computed from diary:', JSON.stringify(frequencyMap));
    Logger.info('Recurring dreams computed:', recurringNames);

    // Assert that the computed recurring count equals 2
    expect(recurringCount).toBe(2);

    // Assert that specific dreams "Flying over mountains" and "Lost in maze" are recurring
    expect(recurringNames).toContain('Flying over mountains');
    expect(recurringNames).toContain('Lost in maze');
    expect(frequencyMap['Flying over mountains']).toBeGreaterThan(1);
    expect(frequencyMap['Lost in maze']).toBeGreaterThan(1);

    // Cross-verify with the Total Summary page's displayed Recurring Dreams stat
    const displayedRecurringStat = await totalPage.getStatValue('Recurring Dreams');
    expect(displayedRecurringStat).toBe(recurringCount);

    await diaryContext.close();
  });
});
