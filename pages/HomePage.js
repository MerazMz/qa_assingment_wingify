const BasePage = require('./BasePage');
const Logger = require('../utils/logger');

/**
 * Page Object for Dream Portal Home (index.html)
 */
class HomePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // Locators
    this.loadingAnimation = page.locator('#loadingAnimation');
    this.mainContent = page.locator('#mainContent');
    this.dreamButton = page.locator('#dreamButton');
    this.welcomeSection = page.locator('#welcome-section');
    this.dreamStats = page.locator('.dream-stats');
  }

  /**
   * Navigate to the Dream Portal Home page
   */
  async goto() {
    await this.navigate('index.html');
  }

  /**
   * Check if the loading animation is visible initially
   */
  async isLoadingAnimationVisible() {
    return await this.loadingAnimation.isVisible();
  }

  /**
   * Wait for the loading animation to disappear (timed ~3 seconds)
   * @param {number} timeoutMs
   */
  async waitForLoadingAnimationToDisappear(timeoutMs = 6000) {
    Logger.info('Waiting for loading animation to disappear...');
    await this.loadingAnimation.waitFor({ state: 'hidden', timeout: timeoutMs });
    Logger.pass('Loading animation disappeared.');
  }

  /**
   * Check if main content is visible
   */
  async isMainContentVisible() {
    return await this.mainContent.isVisible();
  }

  /**
   * Check if "My Dreams" button is visible
   */
  async isDreamButtonVisible() {
    return await this.dreamButton.isVisible();
  }

  /**
   * Click "My Dreams" and capture both simultaneously opened new tabs:
   * 1. dreams-diary.html
   * 2. dreams-total.html
   * @returns {Promise<Array<import('@playwright/test').Page>>}
   */
  async clickMyDreamsAndCaptureTabs() {
    Logger.info('Clicking "My Dreams" button and awaiting opened tabs...');
    const context = this.page.context();

    // Set up a listener for both popup pages spawned on button click
    const pagesPromise = new Promise((resolve, reject) => {
      const capturedPages = [];
      const timer = setTimeout(() => {
        context.off('page', handler);
        reject(new Error(`Timed out waiting for 2 popup pages. Captured ${capturedPages.length} pages.`));
      }, 10000);

      const handler = (newPage) => {
        capturedPages.push(newPage);
        if (capturedPages.length === 2) {
          clearTimeout(timer);
          context.off('page', handler);
          resolve(capturedPages);
        }
      };

      context.on('page', handler);
    });

    await this.dreamButton.click();
    const newPages = await pagesPromise;

    // Ensure DOM is ready on both opened tabs
    await Promise.all(newPages.map((p) => p.waitForLoadState('domcontentloaded')));
    Logger.pass(`Successfully captured ${newPages.length} new tabs.`);

    return newPages;
  }
}

module.exports = HomePage;
