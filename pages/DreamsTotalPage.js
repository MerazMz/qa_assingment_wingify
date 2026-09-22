const BasePage = require('./BasePage');
const Logger = require('../utils/logger');

/**
 * Page Object for Dreams Summary / Total (dreams-total.html)
 */
class DreamsTotalPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // Locators
    this.table = page.locator('#dreamsTotal');
    this.rows = page.locator('#dreamsTotal tbody tr');
    this.headers = page.locator('#dreamsTotal thead th');
  }

  /**
   * Direct navigation helper
   */
  async goto() {
    await this.navigate('dreams-total.html');
  }

  /**
   * Extract all stats from the summary table as a key-value object
   * Example: { "Good Dreams": 6, "Bad Dreams": 4, "Total Dreams": 10, ... }
   * @returns {Promise<Record<string, number>>}
   */
  async getSummaryStats() {
    const rowElements = await this.rows.all();
    const stats = {};

    for (const row of rowElements) {
      const cells = await row.locator('td').allInnerTexts();
      if (cells.length >= 2) {
        const key = cells[0].trim();
        const value = parseInt(cells[1].trim(), 10);
        stats[key] = Number.isNaN(value) ? cells[1].trim() : value;
      }
    }

    Logger.info('Extracted summary statistics:', JSON.stringify(stats));
    return stats;
  }

  /**
   * Get value of a specific stat
   * @param {string} statName
   * @returns {Promise<number>}
   */
  async getStatValue(statName) {
    const stats = await this.getSummaryStats();
    return stats[statName];
  }
}

module.exports = DreamsTotalPage;
