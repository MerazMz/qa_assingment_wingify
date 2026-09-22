const BasePage = require('./BasePage');
const Logger = require('../utils/logger');

/**
 * Page Object for Dreams Diary (dreams-diary.html)
 */
class DreamsDiaryPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // Locators
    this.table = page.locator('#dreamsDiary');
    this.rows = page.locator('#dreamsDiary tbody tr');
    this.headers = page.locator('#dreamsDiary thead th');
  }

  /**
   * Direct navigation helper
   */
  async goto() {
    await this.navigate('dreams-diary.html');
  }

  /**
   * Return count of entries/rows in the diary table
   */
  async getRowCount() {
    return await this.rows.count();
  }

  /**
   * Extract all row data as structured objects
   * @returns {Promise<Array<{ name: string, daysAgo: string, type: string }>>}
   */
  async getAllDreams() {
    const rowElements = await this.rows.all();
    const dreams = [];

    for (const row of rowElements) {
      const cells = await row.locator('td').allInnerTexts();
      dreams.push({
        name: cells[0] ? cells[0].trim() : '',
        daysAgo: cells[1] ? cells[1].trim() : '',
        type: cells[2] ? cells[2].trim() : '',
      });
    }

    Logger.info(`Parsed ${dreams.length} dream records from diary table.`);
    return dreams;
  }

  /**
   * Validate that all rows have all 3 columns non-empty
   * @returns {Promise<{ isValid: boolean, emptyRows: Array<object> }>}
   */
  async validateAllColumnsFilled() {
    const dreams = await this.getAllDreams();
    const emptyRows = dreams.filter(
      (d) => !d.name || !d.daysAgo || !d.type
    );

    return {
      isValid: emptyRows.length === 0,
      emptyRows,
    };
  }

  /**
   * Validate that all dream types are strictly "Good" or "Bad"
   * @returns {Promise<{ isValid: boolean, invalidEntries: Array<object> }>}
   */
  async validateDreamTypes() {
    const dreams = await this.getAllDreams();
    const allowedTypes = ['Good', 'Bad'];
    const invalidEntries = dreams.filter((d) => !allowedTypes.includes(d.type));

    return {
      isValid: invalidEntries.length === 0,
      invalidEntries,
    };
  }

  /**
   * Calculate recurring dreams based on diary table entries
   * A dream is recurring if it appears more than once (> 1)
   * @returns {Promise<{ recurringCounts: Record<string, number>, recurringNames: Array<string> }>}
   */
  async getRecurringDreams() {
    const dreams = await this.getAllDreams();
    const frequencyMap = {};

    for (const dream of dreams) {
      frequencyMap[dream.name] = (frequencyMap[dream.name] || 0) + 1;
    }

    const recurringNames = Object.keys(frequencyMap).filter((name) => frequencyMap[name] > 1);

    Logger.info(`Identified ${recurringNames.length} recurring dreams: ${recurringNames.join(', ')}`);
    return {
      frequencyMap,
      recurringNames,
      recurringCount: recurringNames.length,
    };
  }
}

module.exports = DreamsDiaryPage;
