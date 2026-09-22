const { test, expect } = require('@playwright/test');
const { HomePage, DreamsDiaryPage, DreamsTotalPage } = require('../pages');
const Logger = require('../utils/logger');

test.describe('Part 1: End-to-End User Flow (Complete Multi-Tab Journey)', () => {
  test('should execute full workflow: Home -> Click Button -> Validate Diary & Total tabs', async ({ page }) => {
    Logger.info('Starting Full E2E Journey test');

    // 1. Visit Home
    const homePage = new HomePage(page);
    await homePage.goto();

    // 2. Wait for loading animation to complete
    await homePage.waitForLoadingAnimationToDisappear();
    await expect(homePage.mainContent).toBeVisible();
    await expect(homePage.dreamButton).toBeVisible();

    // 3. Click "My Dreams" and capture both simultaneously opened tabs
    const [openedPage1, openedPage2] = await homePage.clickMyDreamsAndCaptureTabs();
    expect(openedPage1).toBeDefined();
    expect(openedPage2).toBeDefined();

    // Identify which tab is diary and which is total
    const diaryNativePage = [openedPage1, openedPage2].find((p) => p.url().includes('dreams-diary.html'));
    const totalNativePage = [openedPage1, openedPage2].find((p) => p.url().includes('dreams-total.html'));

    expect(diaryNativePage, 'Diary tab should be opened').toBeDefined();
    expect(totalNativePage, 'Total tab should be opened').toBeDefined();

    // 4. Validate Dreams Diary tab
    const diaryPage = new DreamsDiaryPage(diaryNativePage);
    const rowCount = await diaryPage.getRowCount();
    expect(rowCount).toBe(10);

    const { isValid: columnsValid } = await diaryPage.validateAllColumnsFilled();
    expect(columnsValid).toBeTruthy();

    const { isValid: typesValid } = await diaryPage.validateDreamTypes();
    expect(typesValid).toBeTruthy();

    const { frequencyMap, recurringNames, recurringCount } = await diaryPage.getRecurringDreams();
    expect(recurringCount).toBe(2);
    expect(recurringNames).toEqual(expect.arrayContaining(['Flying over mountains', 'Lost in maze']));

    // 5. Validate Dreams Total / Summary tab
    const totalPage = new DreamsTotalPage(totalNativePage);
    const stats = await totalPage.getSummaryStats();

    expect(stats['Good Dreams']).toBe(6);
    expect(stats['Bad Dreams']).toBe(4);
    expect(stats['Total Dreams']).toBe(10);
    expect(stats['Recurring Dreams']).toBe(recurringCount);

    Logger.pass('Full E2E user flow passed successfully!');

    // Clean up popups
    await diaryNativePage.close();
    await totalNativePage.close();
  });
});
