const Logger = require('../utils/logger');

/**
 * AI Dream Classifier Service
 * Supports Groq API (openai/gpt-oss-20b) and OpenAI API
 * Includes intelligent deterministic fallback for offline/CI environments
 */
class AIClassifierService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;

    // Prioritize Groq if GROQ_API_KEY is supplied, otherwise OpenAI
    if (this.groqApiKey && this.groqApiKey.trim() !== '') {
      this.provider = 'groq';
      this.apiKey = this.groqApiKey.trim();
      this.model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
      this.apiUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions';
    } else if (this.openaiApiKey && this.openaiApiKey.trim() !== '') {
      this.provider = 'openai';
      this.apiKey = this.openaiApiKey.trim();
      this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      this.apiUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
    } else {
      this.provider = 'fallback';
      this.apiKey = null;
      this.model = 'local-heuristic';
      this.apiUrl = null;
    }

    Logger.info(`AI Classifier initialized. Provider: ${this.provider}, Model: ${this.model}`);
  }

  /**
   * Deterministic NLP/Heuristic fallback for offline/CI execution when API keys are absent
   * @param {string} dreamName
   * @returns {'Good' | 'Bad'}
   */
  classifyLocally(dreamName) {
    const text = dreamName.toLowerCase();

    const negativeKeywords = [
      'monster', 'chase', 'late', 'exam', 'fail', 'lost', 'maze',
      'nightmare', 'fall', 'death', 'drown', 'trapped', 'fear', 'dark'
    ];

    const positiveKeywords = [
      'flying', 'mountain', 'mountains', 'lottery', 'winning', 'dolphin',
      'dolphins', 'swimming', 'adventure', 'travel', 'happy', 'peace', 'joy'
    ];

    for (const word of negativeKeywords) {
      if (text.includes(word)) return 'Bad';
    }

    for (const word of positiveKeywords) {
      if (text.includes(word)) return 'Good';
    }

    return 'Good';
  }

  /**
   * Classify a dream name into either "Good" or "Bad"
   * @param {string} dreamName
   * @returns {Promise<{ classification: 'Good' | 'Bad', source: string, reasoning?: string }>}
   */
  async classifyDream(dreamName) {
    if (!dreamName || typeof dreamName !== 'string') {
      throw new Error('Invalid dreamName provided for classification');
    }

    // Fallback if no API key is available
    if (!this.apiKey) {
      const localResult = this.classifyLocally(dreamName);
      Logger.info(`[Fallback Classifier] Classified "${dreamName}" as -> ${localResult}`);
      return { classification: localResult, source: 'fallback' };
    }

    try {
      Logger.info(`[${this.provider.toUpperCase()} Classifier] Requesting classification for "${dreamName}" using ${this.model}...`);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a dream sentiment classifier. Categorize the given dream description strictly into either "Good" or "Bad". Respond with only one word: "Good" or "Bad".',
            },
            {
              role: 'user',
              content: `Classify this dream: "${dreamName}"`,
            },
          ],
          temperature: 0.1,
          max_tokens: 300, // Provides ample token budget for reasoning models like gpt-oss-20b
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.warn(`API returned status ${response.status}: ${errorText}. Using fallback.`);
        return { classification: this.classifyLocally(dreamName), source: 'fallback' };
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;
      const content = (message?.content || '').trim();
      const reasoning = message?.reasoning || '';

      let classification;
      if (content.toLowerCase().startsWith('bad')) {
        classification = 'Bad';
      } else if (content.toLowerCase().startsWith('good')) {
        classification = 'Good';
      } else if (content.toLowerCase().includes('bad')) {
        classification = 'Bad';
      } else if (content.toLowerCase().includes('good')) {
        classification = 'Good';
      } else {
        // Fallback to local heuristic if model content is empty or ambiguous
        classification = this.classifyLocally(dreamName);
      }

      Logger.pass(`[${this.provider.toUpperCase()} Classifier] "${dreamName}" -> ${classification}`);

      return {
        classification,
        source: this.provider,
        reasoning,
      };
    } catch (err) {
      Logger.warn(`API request error: ${err.message}. Using fallback.`);
      return { classification: this.classifyLocally(dreamName), source: 'fallback' };
    }
  }

  /**
   * Batch classify an array of dream items
   * @param {Array<{ name: string, type: string }>} dreams
   * @returns {Promise<Array<{ name: string, expectedType: string, aiType: string, match: boolean, source: string }>>}
   */
  async classifyAndCompare(dreams) {
    const results = [];

    for (const dream of dreams) {
      const { classification, source } = await this.classifyDream(dream.name);
      results.push({
        name: dream.name,
        expectedType: dream.type,
        aiType: classification,
        match: classification === dream.type,
        source,
      });
    }

    return results;
  }
}

module.exports = new AIClassifierService();
