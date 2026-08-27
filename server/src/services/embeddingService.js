const env = require('../config/env');

class EmbeddingService {
  constructor() {
    this.openaiClient = null;
    this.geminiClient = null;
    this.vectorDim = 384; // Local fallback dimension
    this._initClients();
  }

  _initClients() {
    if (env.OPENAI_API_KEY || env.OPENROUTER_API_KEY) {
      try {
        const { OpenAI } = require('openai');
        const config = { apiKey: env.OPENAI_API_KEY || env.OPENROUTER_API_KEY };
        if (env.OPENROUTER_API_KEY && !env.OPENAI_API_KEY) {
          config.baseURL = 'https://openrouter.ai/api/v1';
        }
        this.openaiClient = new OpenAI(config);
      } catch (err) {
        console.warn('⚠️ OpenAI client init failed:', err.message);
      }
    }

    if (env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      } catch (err) {
        console.warn('⚠️ Gemini client init failed:', err.message);
      }
    }
  }

  getActiveProvider() {
    if (this.openaiClient) return 'openai';
    if (this.geminiClient) return 'gemini';
    return 'local-dense-vectorizer';
  }

  getEmbeddingModelName() {
    const provider = this.getActiveProvider();
    if (provider === 'openai') return 'text-embedding-3-small';
    if (provider === 'gemini') return 'gemini-embedding-001';
    return 'local-tfidf-vectorizer-384d';
  }

  /**
   * Deterministic hash-based dense vectorizer fallback (384 dimensions)
   * Produces semantic similarity based on token, subword n-grams, and term frequencies.
   */
  _localDenseVectorize(text) {
    const dim = this.vectorDim;
    const vec = new Float64Array(dim).fill(0);
    if (!text || typeof text !== 'string') return Array.from(vec);

    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = clean.split(/\s+/).filter(Boolean);

    if (tokens.length === 0) return Array.from(vec);

    const hashString = (str) => {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
      }
      return Math.abs(hash);
    };

    // 1. Unigram feature weights
    for (const token of tokens) {
      const h = hashString(token);
      const index = h % dim;
      const sign = (h % 2 === 0) ? 1 : -1;
      vec[index] += sign * (1.0 + Math.log(1 + token.length));

      // Character trigrams for morphological robustness
      if (token.length >= 3) {
        for (let i = 0; i <= token.length - 3; i++) {
          const tri = token.slice(i, i + 3);
          const triH = hashString(tri);
          const triIdx = triH % dim;
          vec[triIdx] += 0.35 * ((triH % 2 === 0) ? 1 : -1);
        }
      }
    }

    // 2. Bigram weights for contextual phrases
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]}_${tokens[i + 1]}`;
      const bh = hashString(bigram);
      const bIdx = bh % dim;
      vec[bIdx] += 1.5 * ((bh % 2 === 0) ? 1 : -1);
    }

    // 3. L2 Normalize vector
    let norm = 0;
    for (let i = 0; i < dim; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dim; i++) {
        vec[i] = vec[i] / norm;
      }
    }

    return Array.from(vec);
  }

  /**
   * Embeds a single text string
   */
  async embedText(text) {
    if (!text || text.trim().length === 0) {
      return this._localDenseVectorize('');
    }

    const provider = this.getActiveProvider();

    if (provider === 'openai' && this.openaiClient) {
      try {
        const response = await this.openaiClient.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
        });
        return response.data[0].embedding;
      } catch (err) {
        console.warn(`⚠️ OpenAI embedding failed (${err.message}). Falling back to next provider.`);
      }
    }

    if ((provider === 'gemini' || this.geminiClient) && this.geminiClient) {
      const geminiEmbedModels = [
        'gemini-embedding-001',
        'gemini-embedding-2',
        'gemini-embedding-2-preview',
      ];
      for (const modelName of geminiEmbedModels) {
        try {
          const model = this.geminiClient.getGenerativeModel({ model: modelName });
          const result = await model.embedContent(text);
          if (result && result.embedding && result.embedding.values) {
            return result.embedding.values;
          }
        } catch (err) {
          // try next model
        }
      }
      console.warn('⚠️ All Gemini embedding models failed. Falling back to local vectorizer.');
    }

    // Local dense vectorizer fallback
    return this._localDenseVectorize(text);
  }

  /**
   * Embeds an array of texts in batches
   */
  async embedDocuments(texts = []) {
    if (!texts.length) return [];

    const provider = this.getActiveProvider();

    if (provider === 'openai' && this.openaiClient) {
      try {
        const response = await this.openaiClient.embeddings.create({
          model: 'text-embedding-3-small',
          input: texts,
        });
        return response.data.map((item) => item.embedding);
      } catch (err) {
        console.warn(`⚠️ OpenAI batch embedding failed (${err.message}). Falling back to local.`);
      }
    }

    // Process sequentially or via local fallback
    const results = [];
    for (const text of texts) {
      const vec = await this.embedText(text);
      results.push(vec);
    }
    return results;
  }
}

module.exports = new EmbeddingService();
