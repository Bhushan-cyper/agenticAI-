const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from potential root and server .env paths
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  JWT_SECRET: process.env.JWT_SECRET || 'campusmind_jwt_secret_dev_fallback_2025',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  MONGO_URI: process.env.MONGO_URI || '',

  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  PINECONE_INDEX: process.env.PINECONE_INDEX || 'campusmind',
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || 'us-east-1',

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE, 10) || 600,
  CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP, 10) || 100,
  SIMILARITY_TOP_K: parseInt(process.env.SIMILARITY_TOP_K, 10) || 5,
  SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.35,

  getProvidersStatus() {
    return {
      database: this.MONGO_URI ? 'external-mongodb' : 'in-memory-mongodb-fallback',
      vectorStore: this.PINECONE_API_KEY ? 'pinecone' : 'local-memory-vector-store',
      embedding: this.OPENAI_API_KEY || this.OPENROUTER_API_KEY
        ? 'openai'
        : this.GEMINI_API_KEY
        ? 'gemini'
        : 'local-tfidf-vectorizer',
      llm: this.OPENAI_API_KEY || this.OPENROUTER_API_KEY
        ? 'openai'
        : this.GEMINI_API_KEY
        ? 'gemini'
        : 'extractive-synthesizer-fallback',
    };
  },
};

module.exports = env;
