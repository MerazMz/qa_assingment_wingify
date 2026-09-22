const Logger = require('../utils/logger');

/**
 * BasePage encapsulating shared methods and common operations across pages
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a path relative to baseURL
   * @param {string} path
   */
  async navigate(path = '') {
    Logger.info(`Navigating to: ${path || '/'}`);
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Capture a full page screenshot
   * @param {string} filename
   */
  async takeScreenshot(filename) {
    Logger.info(`Capturing screenshot: ${filename}`);
    return await this.page.screenshot({ path: `test-results/screenshots/${filename}.png`, fullPage: true });
  }

  /**
   * Get page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getUrl() {
    return this.page.url();
  }
}

module.exports = BasePage;
