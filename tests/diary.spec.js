const { test, expect } = require('@playwright/test');
const { DreamsDiaryPage } = require('../pages');
const Logger = require('../utils/logger');

test.describe('Part 1: Dreams Diary Tests (dreams-diary.html)', () => {
  let diaryPage;

  test.beforeEach(async ({ page }) => {
    diaryPage = new DreamsDiaryPage(page);
    await diaryPage.goto();
  });

  test('should validate that there are exactly 10 dream entries', async () => {
    Logger.info('Starting test: validate dream entries count');

    const count = await diaryPage.getRowCount();
    Logger.info(`Found ${count} dream rows in table.`);
    expect(count).toBe(10);
    await expect(diaryPage.rows).toHaveCount(10);

    await diaryPage.takeScreenshot('diary-10-entries');
  });

  test('should validate that dream types are strictly "Good" or "Bad"', async () => {
    Logger.info('Starting test: validate dream types strictly "Good" or "Bad"');

    const { isValid, invalidEntries } = await diaryPage.validateDreamTypes();
    if (!isValid) {
      Logger.error('Invalid dream type entries found:', JSON.stringify(invalidEntries));
    }
    expect(isValid).toBeTruthy();
    expect(invalidEntries).toHaveLength(0);

    const dreams = await diaryPage.getAllDreams();
    for (const dream of dreams) {
      expect(['Good', 'Bad']).toContain(dream.type);
    }
  });

  test('should validate that each row has all three columns filled (Dream Name, Days Ago, Dream Type)', async () => {
    Logger.info('Starting test: validate all 3 columns are filled per row');

    const dreams = await diaryPage.getAllDreams();
    expect(dreams).toHaveLength(10);

    dreams.forEach((dream, index) => {
      expect(dream.name, `Row ${index + 1} Dream Name should not be empty`).toBeTruthy();
      expect(dream.daysAgo, `Row ${index + 1} Days Ago should not be empty`).toBeTruthy();
      expect(dream.type, `Row ${index + 1} Dream Type should not be empty`).toBeTruthy();
    });

    const { isValid, emptyRows } = await diaryPage.validateAllColumnsFilled();
    expect(isValid).toBeTruthy();
    expect(emptyRows).toHaveLength(0);
  });
});
