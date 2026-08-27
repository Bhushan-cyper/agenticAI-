const retrievalAgent = require('../agents/retrievalAgent');
const contextAssemblyAgent = require('../agents/contextAssemblyAgent');
const generationAgent = require('../agents/generationAgent');
const fallbackAgent = require('../agents/fallbackAgent');
const loggingAgent = require('../agents/loggingAgent');
const env = require('../config/env');

class RagService {
  constructor() {
    this.isLangChainAvailable = this._checkLangChain();
  }

  _checkLangChain() {
    try {
      require('langchain');
      return true;
    } catch {
      return false;
    }
  }

  getPipelineStatus() {
    return this.isLangChainAvailable ? 'available' : 'not-installed';
  }

  /**
   * Execute complete RAG pipeline for a student query
   */
  async executePipeline({
    query,
    conversationId,
    user,
    departmentFilter = null,
    history = [],
    onTokenCallback = null,
  }) {
    const startTime = Date.now();
    const ragPipelineStatus = this.getPipelineStatus();

    // 1. Retrieval Phase
    const filter = departmentFilter && departmentFilter !== 'All' ? { department: departmentFilter } : null;
    const retrievedChunks = await retrievalAgent.retrieve(query, {
      topK: env.SIMILARITY_TOP_K || 5,
      minScore: env.SIMILARITY_THRESHOLD || 0.25,
      filter,
    });

    // Check if we found any chunks or if confidence is too low
    if (!retrievedChunks || retrievedChunks.length === 0) {
      console.log(`ℹ️ No matching chunks for query: "${query}". Triggering FallbackAgent.`);
      const fallbackResult = await fallbackAgent.handleUnknown(query, user, conversationId);
      const latencyMs = Date.now() - startTime;

      const chatLog = await loggingAgent.logTurn({
        conversationId,
        owner: user?._id || user?.id,
        query,
        retrievedChunkIds: [],
        similarityScores: [],
        answer: fallbackResult.answer,
        sources: [],
        confidenceScore: 0.0,
        latencyMs,
        isGrounded: false,
        providerUsed: fallbackResult.provider,
        ragPipeline: ragPipelineStatus,
      });

      return {
        answer: fallbackResult.answer,
        sources: [],
        confidenceScore: 0.0,
        latencyMs,
        chatLogId: chatLog?._id,
        providerUsed: fallbackResult.provider,
        ragPipeline: ragPipelineStatus,
        isGrounded: false,
      };
    }

    // 2. Context Assembly Phase
    const assembled = contextAssemblyAgent.assemble(retrievedChunks);

    // If assembled context is empty or top confidence is under threshold
    if (!assembled.contextText || assembled.topConfidence < (env.SIMILARITY_THRESHOLD || 0.25)) {
      const fallbackResult = await fallbackAgent.handleUnknown(query, user, conversationId);
      const latencyMs = Date.now() - startTime;

      const chatLog = await loggingAgent.logTurn({
        conversationId,
        owner: user?._id || user?.id,
        query,
        retrievedChunkIds: retrievedChunks.map((c) => c.chunkId),
        similarityScores: retrievedChunks.map((c) => c.score),
        answer: fallbackResult.answer,
        sources: assembled.sources,
        confidenceScore: assembled.topConfidence,
        latencyMs,
        isGrounded: false,
        providerUsed: fallbackResult.provider,
        ragPipeline: ragPipelineStatus,
      });

      return {
        answer: fallbackResult.answer,
        sources: assembled.sources,
        confidenceScore: assembled.topConfidence,
        latencyMs,
        chatLogId: chatLog?._id,
        providerUsed: fallbackResult.provider,
        ragPipeline: ragPipelineStatus,
        isGrounded: false,
      };
    }

    // 3. Generation Phase (with streaming support)
    const genResult = await generationAgent.generateAnswer(
      query,
      assembled.contextText,
      history,
      assembled.sources,
      onTokenCallback
    );

    const latencyMs = Date.now() - startTime;

    // 4. Logging Phase
    const chatLog = await loggingAgent.logTurn({
      conversationId,
      owner: user?._id || user?.id,
      query,
      retrievedChunkIds: retrievedChunks.map((c) => c.chunkId),
      similarityScores: retrievedChunks.map((c) => c.score),
      answer: genResult.answer,
      sources: assembled.sources,
      confidenceScore: assembled.topConfidence,
      latencyMs,
      isGrounded: true,
      providerUsed: genResult.provider,
      ragPipeline: ragPipelineStatus,
    });

    return {
      answer: genResult.answer,
      sources: assembled.sources,
      confidenceScore: assembled.topConfidence,
      latencyMs,
      chatLogId: chatLog?._id,
      providerUsed: genResult.provider,
      ragPipeline: ragPipelineStatus,
      isGrounded: true,
    };
  }
}

module.exports = new RagService();
