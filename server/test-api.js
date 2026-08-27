const http = require('http');

async function testBackend() {
  console.log('Testing CampusMind AI backend imports and setup...');
  
  // Test Model imports
  const User = require('./src/models/User');
  const Document = require('./src/models/Document');
  const Chunk = require('./src/models/Chunk');
  const Collection = require('./src/models/Collection');
  const Conversation = require('./src/models/Conversation');
  const ChatLog = require('./src/models/ChatLog');
  const Notification = require('./src/models/Notification');
  console.log('✅ All Mongoose Models loaded successfully');

  // Test Services
  const authService = require('./src/services/authService');
  const chunkingService = require('./src/services/chunkingService');
  const embeddingService = require('./src/services/embeddingService');
  const documentService = require('./src/services/documentService');
  const ragService = require('./src/services/ragService');
  const chatService = require('./src/services/chatService');
  const analyticsService = require('./src/services/analyticsService');
  console.log('✅ All Services loaded successfully');

  // Test RAG Agents
  const ingestionAgent = require('./src/agents/ingestionAgent');
  const retrievalAgent = require('./src/agents/retrievalAgent');
  const contextAssemblyAgent = require('./src/agents/contextAssemblyAgent');
  const generationAgent = require('./src/agents/generationAgent');
  const fallbackAgent = require('./src/agents/fallbackAgent');
  const loggingAgent = require('./src/agents/loggingAgent');
  console.log('✅ All RAG Agents loaded successfully');

  // Test Vector Store
  const { getVectorStore } = require('./src/config/vectorStore');
  const vs = getVectorStore();
  const health = await vs.healthCheck();
  console.log('✅ Vector Store initialized:', health);

  // Test chunking and embedding logic
  const sampleText = "CampusMind AI is a college chatbot. It provides verified information about admissions, fees, hostel rules, and placements.";
  const chunks = chunkingService.chunkDocumentPages([{ pageNumber: 1, text: sampleText }]);
  console.log(`✅ Chunking test passed: produced ${chunks.length} chunk(s)`);

  const vector = await embeddingService.embedText(sampleText);
  console.log(`✅ Embedding test passed: vector dimension = ${vector.length}`);

  console.log('\n🎉 ALL BACKEND COMPONENT TESTS PASSED!\n');
  process.exit(0);
}

testBackend().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
