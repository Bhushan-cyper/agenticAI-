const env = require('./env');
const PineconeStore = require('../vectorstore/pineconeStore');
const LocalFallbackStore = require('../vectorstore/localFallbackStore');

let vectorStoreInstance = null;

const getVectorStore = () => {
  if (!vectorStoreInstance) {
    if (env.PINECONE_API_KEY && env.PINECONE_INDEX) {
      console.log('🌲 Using Pinecone as primary Vector Database');
      vectorStoreInstance = new PineconeStore();
    } else {
      console.log('🧠 Using Local In-Memory Cosine Vector Store (Zero-Config Fallback)');
      vectorStoreInstance = new LocalFallbackStore();
    }
  }
  return vectorStoreInstance;
};

module.exports = { getVectorStore };
