const { test, expect } = require('@playwright/test');
const { DreamsDiaryPage } = require('../pages');
const aiClassifier = require('../services/aiClassifier');
const Logger = require('../utils/logger');

test.describe('Part 2: Bonus AI-Based Validation (Content Classification)', () => {
  let diaryPage;

  test.beforeEach(async ({ page }) => {
    diaryPage = new DreamsDiaryPage(page);
    await diaryPage.goto();
  });

  test('should validate the assignment example: "Monster chase" is classified as "Bad"', async () => {
    Logger.info('Starting AI classification test for specific PDF example: "Monster chase"');

    const result = await aiClassifier.classifyDream('Monster chase');
    Logger.info(`Classification for "Monster chase": ${result.classification} (Engine: ${result.source})`);

    // Assert that the AI categorized "Monster chase" as "Bad"
    expect(result.classification).toBe('Bad');
  });

  test('should retrieve all dream names from the table, classify them with AI, and compare with table data', async () => {
    Logger.info('Starting table-wide AI validation and comparison against UI table types');

    // Retrieve dream entries from diary page
    const dreams = await diaryPage.getAllDreams();
    expect(dreams.length).toBe(10);

    // Run classification and comparison
    const comparisonResults = await aiClassifier.classifyAndCompare(dreams);

    console.log('\n=================== AI VALIDATION REPORT ===================');
    console.table(
      comparisonResults.map((r) => ({
        'Dream Name': r.name,
        'Table Value': r.expectedType,
        'AI Prediction': r.aiType,
        'Match?': r.match ? '✅ YES' : '❌ NO',
        'Engine': r.source,
      }))
    );
    console.log('============================================================\n');

    // Calculate match rate
    const matches = comparisonResults.filter((r) => r.match);
    const accuracy = (matches.length / comparisonResults.length) * 100;
    Logger.pass(`AI Classification vs Table Match Rate: ${accuracy.toFixed(1)}% (${matches.length}/${comparisonResults.length})`);

    // Assert that accuracy meets or exceeds 90% (allows for high semantic alignment)
    expect(accuracy).toBeGreaterThanOrEqual(90);

    // Specifically verify known critical examples:
    const monsterChase = comparisonResults.find((r) => r.name === 'Monster chase');
    expect(monsterChase.aiType).toBe('Bad');
    expect(monsterChase.match).toBeTruthy();

    const flyingMountains = comparisonResults.find((r) => r.name === 'Flying over mountains');
    expect(flyingMountains.aiType).toBe('Good');
    expect(flyingMountains.match).toBeTruthy();

    const lostInMaze = comparisonResults.find((r) => r.name === 'Lost in maze');
    expect(lostInMaze.aiType).toBe('Bad');
    expect(lostInMaze.match).toBeTruthy();
  });
});
