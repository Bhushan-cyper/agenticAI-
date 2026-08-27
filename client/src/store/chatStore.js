import { create } from 'zustand';
import api from '../services/api';
import { getSocket, joinConversationRoom, leaveConversationRoom } from '../services/socket';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingMessage: null,
  activeDepartmentFilter: 'All',
  suggestedQuestions: [],

  setDepartmentFilter: (department) => {
    set({ activeDepartmentFilter: department });
  },

  loadSuggestedQuestions: async () => {
    try {
      const res = await api.get('/chat/suggested-questions');
      if (res.data.success) {
        set({ suggestedQuestions: res.data.questions || [] });
      }
    } catch (err) {
      console.warn('Failed to load suggested questions:', err.message);
    }
  },

  loadConversations: async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        set({ conversations: res.data.conversations || [] });
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err.message);
    }
  },

  selectConversation: async (conversationId) => {
    if (!conversationId) {
      set({ currentConversation: null, messages: [], streamingMessage: null });
      return;
    }

    const prevConv = get().currentConversation;
    if (prevConv?._id) {
      leaveConversationRoom(prevConv._id);
    }

    set({ isLoading: true });
    try {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      if (res.data.success) {
        set({
          currentConversation: res.data.conversation,
          messages: res.data.messages || [],
          isLoading: false,
          streamingMessage: null,
          isStreaming: false,
          activeDepartmentFilter: res.data.conversation?.departmentFilter || 'All',
        });
        joinConversationRoom(conversationId);
      }
    } catch (err) {
      console.error('Failed to fetch conversation:', err.message);
      set({ isLoading: false });
    }
  },

  startNewChat: () => {
    const prevConv = get().currentConversation;
    if (prevConv?._id) {
      leaveConversationRoom(prevConv._id);
    }
    set({
      currentConversation: null,
      messages: [],
      streamingMessage: null,
      isStreaming: false,
    });
  },

  deleteConversation: async (conversationId) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      const updated = get().conversations.filter((c) => c._id !== conversationId);
      set({ conversations: updated });

      if (get().currentConversation?._id === conversationId) {
        set({ currentConversation: null, messages: [] });
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err.message);
    }
  },

  sendMessage: async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    const trimmed = queryText.trim();
    const currentConv = get().currentConversation;
    const departmentFilter = get().activeDepartmentFilter;

    // Temporary optimistic user bubble
    const optimisticTurn = {
      _id: 'temp-' + Date.now(),
      query: trimmed,
      answer: '',
      sources: [],
      isOptimistic: true,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticTurn],
      isStreaming: true,
      streamingMessage: { query: trimmed, answer: '', sources: [], confidenceScore: 0 },
    }));

    // Setup Socket listener for streaming tokens
    const socket = getSocket();
    let accumulatedAnswer = '';

    const handleToken = (data) => {
      if (data && data.token) {
        accumulatedAnswer += data.token;
        set({
          streamingMessage: {
            query: trimmed,
            answer: accumulatedAnswer,
            sources: [],
          },
        });
      }
    };

    if (socket) {
      socket.off('chat:token');
      socket.on('chat:token', handleToken);
    }

    try {
      const res = await api.post('/chat/query', {
        query: trimmed,
        conversationId: currentConv?._id,
        departmentFilter,
      });

      if (res.data.success) {
        const finalTurn = {
          _id: res.data.chatLogId || 'log-' + Date.now(),
          query: trimmed,
          answer: res.data.answer,
          sources: res.data.sources || [],
          confidenceScore: res.data.confidenceScore,
          latencyMs: res.data.latencyMs,
          feedback: 'none',
          providerUsed: res.data.providerUsed,
          ragPipeline: res.data.ragPipeline,
          isGrounded: res.data.isGrounded,
          createdAt: new Date().toISOString(),
        };

        // Update messages replacing optimistic turn
        set((state) => {
          const filtered = state.messages.filter((m) => m._id !== optimisticTurn._id);
          return {
            messages: [...filtered, finalTurn],
            isStreaming: false,
            streamingMessage: null,
            currentConversation: state.currentConversation || { _id: res.data.conversationId, title: trimmed },
          };
        });

        // Join conversation room if newly created
        if (res.data.conversationId) {
          joinConversationRoom(res.data.conversationId);
        }

        // Refresh conversation sidebar list
        get().loadConversations();
      }
    } catch (err) {
      console.error('Chat query failed:', err);
      const errorMessage = err.response?.data?.message || 'Error communicating with AI campus assistant.';
      const failedTurn = {
        _id: 'err-' + Date.now(),
        query: trimmed,
        answer: `⚠️ ${errorMessage}`,
        sources: [],
        confidenceScore: 0,
        isGrounded: false,
        createdAt: new Date().toISOString(),
      };

      set((state) => {
        const filtered = state.messages.filter((m) => m._id !== optimisticTurn._id);
        return {
          messages: [...filtered, failedTurn],
          isStreaming: false,
          streamingMessage: null,
        };
      });
    } finally {
      if (socket) {
        socket.off('chat:token', handleToken);
      }
    }
  },

  submitFeedback: async (chatLogId, feedback, comment = '') => {
    try {
      await api.post(`/chat/${chatLogId}/feedback`, { feedback, comment });
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === chatLogId ? { ...m, feedback, feedbackComment: comment } : m
        ),
      }));
    } catch (err) {
      console.error('Failed to submit feedback:', err.message);
    }
  },
}));
