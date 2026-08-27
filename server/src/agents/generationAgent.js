const env = require('../config/env');

class GenerationAgent {
  constructor() {
    this.openaiClient = null;
    this.geminiClient = null;
    this._init();
  }

  _init() {
    if (env.OPENAI_API_KEY || env.OPENROUTER_API_KEY) {
      try {
        const { OpenAI } = require('openai');
        const config = { apiKey: env.OPENAI_API_KEY || env.OPENROUTER_API_KEY };
        if (env.OPENROUTER_API_KEY && !env.OPENAI_API_KEY) {
          config.baseURL = 'https://openrouter.ai/api/v1';
        }
        this.openaiClient = new OpenAI(config);
      } catch (err) {
        console.warn('⚠️ OpenAI client in GenerationAgent failed:', err.message);
      }
    }

    if (env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      } catch (err) {
        console.warn('⚠️ Gemini client in GenerationAgent failed:', err.message);
      }
    }
  }

  /**
   * System Prompt enforcing groundness and source citation
   */
  _buildSystemPrompt() {
    return `You are CampusMind AI, an intelligent, precise, and supportive college assistant.
Your goal is to answer student questions accurately based STRICTLY and ONLY on the provided college document context.

Guidelines:
1. Ground your response entirely in the provided CONTEXT SOURCES. Do NOT make up rules, dates, fees, or requirements.
2. Structure your response with clear headings, bullet points, and concise explanations.
3. At the end of key points or facts, cite the source in brackets, e.g., "[Source: Admissions Guide, Page 2]".
4. If the provided context does NOT contain enough information to answer the question, clearly state: "I don't have information on that in the uploaded campus documents. Please contact the relevant department office."
5. Be polite, encouraging, and clear.`;
  }

  /**
   * Extractive fallback synthesizer when no external LLM API key is present
   */
  _extractiveSynthesizer(query, contextText, sources = []) {
    if (!contextText || sources.length === 0) {
      return "I don't have information on that in the uploaded college documents.";
    }

    let response = `### 📋 Information from Campus Knowledge Base\n\n`;
    response += `Based on the official college documents, here is the relevant information regarding **"${query}"**:\n\n`;

    sources.forEach((source, index) => {
      response += `#### 📄 Source ${index + 1}: ${source.documentTitle} (Page ${source.pageNumber}, Dept: ${source.department})\n`;
      response += `> ${source.snippet}\n\n`;
    });

    response += `\n*Confidence Score: ${(sources[0]?.score * 100).toFixed(0)}%* | *Sources Cited: ${sources.length} document chunk(s)*\n`;
    return response;
  }

  /**
   * Generate answer with token streaming
   * @param {string} query 
   * @param {string} contextText 
   * @param {Array} history 
   * @param {Array} sources 
   * @param {function} onTokenCallback 
   * @returns {Promise<{ answer: string, provider: string }>}
   */
  async generateAnswer(query, contextText, history = [], sources = [], onTokenCallback = null) {
    const systemPrompt = this._buildSystemPrompt();
    const userPrompt = `CONTEXT SOURCES:\n${contextText}\n\nSTUDENT QUESTION:\n${query}\n\nPlease provide a clear, helpful, and source-cited answer based only on the context above:`;

    // 1. Try OpenAI / OpenRouter
    if (this.openaiClient) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: userPrompt },
        ];

        const model = env.OPENROUTER_API_KEY && !env.OPENAI_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini';

        if (onTokenCallback) {
          const stream = await this.openaiClient.chat.completions.create({
            model,
            messages,
            stream: true,
            temperature: 0.2,
          });

          let fullAnswer = '';
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (token) {
              fullAnswer += token;
              onTokenCallback(token);
            }
          }
          return { answer: fullAnswer, provider: 'openai' };
        } else {
          const response = await this.openaiClient.chat.completions.create({
            model,
            messages,
            temperature: 0.2,
          });
          const answer = response.choices[0]?.message?.content || '';
          return { answer, provider: 'openai' };
        }
      } catch (err) {
        console.warn(`⚠️ OpenAI generation failed (${err.message}). Trying Gemini fallback...`);
      }
    }

    // 2. Try Gemini Fallback
    if (this.geminiClient) {
      const geminiModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
      for (const modelName of geminiModels) {
        try {
          const model = this.geminiClient.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
          });

          const prompt = `${contextText}\n\nQuestion: ${query}`;

          if (onTokenCallback) {
            const resultStream = await model.generateContentStream(prompt);
            let fullAnswer = '';
            for await (const chunk of resultStream.stream) {
              const token = chunk.text();
              if (token) {
                fullAnswer += token;
                onTokenCallback(token);
              }
            }
            return { answer: fullAnswer, provider: 'gemini' };
          } else {
            const result = await model.generateContent(prompt);
            const answer = result.response.text();
            return { answer, provider: 'gemini' };
          }
        } catch (err) {
          console.warn(`⚠️ Gemini generation with ${modelName} failed (${err.message}). Trying next...`);
        }
      }
    }

    // 3. Extractive Fallback Synthesizer (Works without any external keys!)
    const extractiveAnswer = this._extractiveSynthesizer(query, contextText, sources);

    // Simulate streaming for extractive fallback if callback provided
    if (onTokenCallback) {
      const words = extractiveAnswer.split(' ');
      for (const word of words) {
        onTokenCallback(word + ' ');
        // tiny sleep simulation
        await new Promise((r) => setTimeout(r, 15));
      }
    }

    return {
      answer: extractiveAnswer,
      provider: 'extractive-synthesizer-fallback',
    };
  }
}

module.exports = new GenerationAgent();
