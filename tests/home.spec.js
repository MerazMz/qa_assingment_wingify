const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages');
const Logger = require('../utils/logger');

test.describe('Part 1: Dream Portal Home Page Tests (index.html)', () => {
  let homePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should verify loading animation appears and disappears after ~3 seconds', async ({ page }) => {
    Logger.info('Starting test: verify loading animation behavior');

    // 1. Loading animation is initially visible or appears on load
    const isInitiallyVisible = await homePage.isLoadingAnimationVisible();
    Logger.info(`Loading animation initial visibility: ${isInitiallyVisible}`);
    expect(isInitiallyVisible).toBeTruthy();

    const startTime = Date.now();

    // 2. Loading animation disappears after ~3 seconds
    await homePage.waitForLoadingAnimationToDisappear(5000);
    const elapsedSeconds = (Date.now() - startTime) / 1000;

    Logger.info(`Loading animation disappeared in ${elapsedSeconds.toFixed(2)} seconds`);
    // Assert duration is roughly around 3 seconds (2.5s to 4.5s tolerance for network/rendering)
    expect(elapsedSeconds).toBeGreaterThanOrEqual(2.5);
    expect(elapsedSeconds).toBeLessThanOrEqual(5.0);

    const isHidden = await homePage.isLoadingAnimationVisible();
    expect(isHidden).toBeFalsy();

    await homePage.takeScreenshot('home-after-loading');
  });

  test('should verify main content and "My Dreams" button become visible after loading', async () => {
    Logger.info('Starting test: verify main content & "My Dreams" button visibility');

    // Wait for the loader to vanish
    await homePage.waitForLoadingAnimationToDisappear();

    // Verify main content is visible
    const isMainContentVisible = await homePage.isMainContentVisible();
    expect(isMainContentVisible).toBeTruthy();
    await expect(homePage.mainContent).toBeVisible();

    // Verify "My Dreams" button is visible and contains expected text
    const isButtonVisible = await homePage.isDreamButtonVisible();
    expect(isButtonVisible).toBeTruthy();
    await expect(homePage.dreamButton).toBeVisible();
    await expect(homePage.dreamButton).toHaveText('My Dreams');

    await homePage.takeScreenshot('home-main-content-visible');
  });

  test('should open dreams-diary.html and dreams-total.html in new tabs upon clicking "My Dreams"', async () => {
    Logger.info('Starting test: verify new tabs opening on "My Dreams" click');

    await homePage.waitForLoadingAnimationToDisappear();

    // Click button and capture both opened tabs
    const openedPages = await homePage.clickMyDreamsAndCaptureTabs();
    expect(openedPages).toHaveLength(2);

    const urls = openedPages.map((p) => p.url());
    Logger.info('Opened tabs URLs:', urls.join(' | '));

    // Verify one of the opened pages is dreams-diary.html
    const hasDiaryPage = urls.some((url) => url.includes('dreams-diary.html'));
    expect(hasDiaryPage).toBeTruthy();

    // Verify one of the opened pages is dreams-total.html
    const hasTotalPage = urls.some((url) => url.includes('dreams-total.html'));
    expect(hasTotalPage).toBeTruthy();
  });
});
