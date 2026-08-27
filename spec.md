# Project Overview & Tech Stack

## Project Overview

Build an AI-powered **RAG-Based College Chatbot** (CampusMind_AI) that answers student questions about admissions, departments, courses, fees, exams, academic calendar, hostel, library, clubs, placements, scholarships, policies, and events. The system must retrieve relevant context from uploaded college documents (PDFs, notices, FAQs) using a real vector database and semantic search, then pass that context to an LLM to generate a grounded, source-cited answer. Simply wiring a chatbot to an LLM without a working retrieval pipeline does not satisfy the project requirements — embeddings, a vector store, and similarity search are mandatory.

## Tech Stack

**Frontend:** Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, Socket.IO client (for streaming answers), react-markdown (for rendering answers with citations), lucide-react icons.

**Backend:** Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, bcryptjs, multer (file uploads), express-validator, helmet, morgan, compression, express-rate-limit.

**Document Processing:** pdf-parse / pdfjs-dist for text extraction, tesseract.js for OCR fallback on scanned PDFs, a custom recursive character/token-based chunker.

**AI Integration:** OpenAI or OpenRouter API for embeddings + chat completion, Google Generative AI SDK (Gemini) as a fallback provider, LangChain for RAG orchestration (retrievers, chains, prompt templates).

**Vector Database:** Pinecone as the primary hosted vector store, with a local Chroma / in-memory cosine-similarity fallback when `PINECONE_API_KEY` is not configured — mirroring the provider-fallback pattern used for LLMs.

**Real-Time Layer:** Socket.IO for streaming token-by-token AI responses and for admin document-processing status updates.

---

# Authentication, Document Processing, and the RAG Pipeline

## Authentication

The authentication system must support registration, login, JWT-based session handling, protected routes, an `/auth/me` profile endpoint, role separation between **admin** and **student**, password hashing with bcrypt at cost factor 12, and persistent login state on the client through Zustand. Admin accounts unlock document management and analytics; student accounts are limited to chat and history.

## Document Upload & Processing Pipeline

Admins upload PDFs/documents through the admin panel. Each upload must pass through a fixed processing pipeline:

1. **Ingestion Agent/Service:** Validates file type/size, stores the raw file, and creates a `Document` record with status `UPLOADED`.
2. **Text Extraction:** Extracts raw text from the PDF; if extracted text is empty or below a length threshold, falls back to OCR (tesseract.js) and flags the document as `OCR_PROCESSED`.
3. **Chunking Service:** Splits extracted text into overlapping chunks (configurable chunk size and overlap) while preserving page/section metadata for later source display.
4. **Embedding Service:** Generates vector embeddings for every chunk via the configured embedding provider (OpenAI/OpenRouter primary, Gemini fallback).
5. **Vector Store Writer:** Upserts each chunk's embedding + metadata (documentId, page number, chunk text, department/collection tag) into Pinecone (or the local fallback store), then marks the document `INDEXED`.
6. **Failure Handling:** Any step failure marks the document `FAILED` with a stored error reason (`EXTRACTION_FAILED`, `EMBEDDING_FAILED`, `VECTOR_STORE_FAILED`) rather than silently dropping the document.

## RAG Pipeline (Query Time)

Every student query must run through this fixed chain:

**Query Embedding Agent:** Embeds the user's question using the same embedding model used at ingestion time.

**Retrieval Agent:** Performs similarity search against the vector database (top-k configurable, default k=5), optionally filtered by department/collection, and returns matched chunks with similarity/confidence scores.

**Context Assembly Agent:** Deduplicates and orders retrieved chunks, truncates to fit the LLM context window, and attaches source metadata (document name, page, collection) to each chunk.

**Generation Agent:** Sends the assembled context + conversation history + system prompt to the LLM and streams back the answer. The prompt must explicitly instruct the LLM to answer only from the provided context.

**Fallback/Unknown-Handling Agent:** If retrieved chunks fall below a minimum similarity threshold, or the LLM's response cannot be grounded in the context, the system must return a clear "I don't have information on that in the uploaded documents" style response instead of hallucinating.

**Logging Agent:** Persists the full turn (query, retrieved chunk IDs, scores, final answer, sources, latency) as a `ChatLog` entry for auditing and future analytics.

LangChain must be importable as the orchestration substrate, and the RAG service must report `ragPipeline: 'available' | 'not-installed'` with each response for observability, matching the fallback-transparency style used elsewhere in the system.

---

# Vector Database, LLM Generation, and Real-Time Streaming

## Vector Database / Semantic Search

The vector layer must support: creating and managing one or more **collections** (default + department-wise collections such as Admissions, Placements, Hostel, Library), upserting chunk embeddings with metadata, similarity search with a configurable top-k and score threshold, filtering by collection/department/tag, and deleting all vectors tied to a document when that document is deleted or re-uploaded (re-indexing must not create orphaned vectors).

## AI Answer Generation

When a student submits a question, the system must: embed the query, retrieve context, and generate an answer that cites its sources. The generator must prefer the primary LLM provider (OpenAI/OpenRouter) when its API key is set, fall back to Gemini when only `GEMINI_API_KEY` is set, and — if neither is configured — return the raw retrieved chunks directly (extractive fallback) so the system remains demonstrably functional without a paid LLM key.

## Real-Time Layer

The Socket.IO server must stream generation tokens to the chat UI as they are produced, and must broadcast document-processing status events (`UPLOADED → EXTRACTING → CHUNKING → EMBEDDING → INDEXED/FAILED`) to the admin dashboard so admins can watch ingestion progress live. Answer feedback (👍/👎) and any escalation notices must also be pushed as real-time notifications.

---

# Frontend Pages

The application uses the Next.js Pages Router. The root `/` page redirects authenticated users to `/chat` and unauthenticated users to `/login`.

- **`/`** – Landing page introducing the assistant, sample questions, and CTA buttons, with responsive layout and dark theme support.
- **`/login`** – Email/password authentication form with JWT handling, Zustand persistence, validation, and error states.
- **`/register`** – Student registration form with password validation and session persistence.
- **`/chat`** – Main chat interface: message list, streaming answer bubbles, source/reference chips under each answer, suggested-question shortcuts, feedback thumbs, and a chat history sidebar grouped by conversation.
- **`/chat/[conversationId]`** – Reopen a past conversation with full context preserved.
- **`/admin/documents`** – Admin document management: upload PDFs, view processing status per document, tag documents to a department/collection, re-index, and delete.
- **`/admin/dashboard`** – Admin analytics: total documents indexed, query volume, average confidence score, top unanswered questions, and 👍/👎 feedback ratio (AppShell layout).
- **`/admin/collections`** – Manage department-wise knowledge base collections and which documents belong to each.
- **`/settings`** – Profile management, role details, and API/embedding provider health checks.

---

# Backend Architecture & Database Collections

## Backend Architecture

**Routes:** Handle HTTP routing, request validation via express-validator, and middleware composition (auth, validation, error handler).

**Controllers:** Request parsing and response shaping only (never talk directly to MongoDB or the vector store).

**Services:** Business logic ownership (document CRUD, chunking, embedding, vector store operations, RAG orchestration, chat history, feedback, analytics).

**Agents Layer:** Holds the ingestion, retrieval, context-assembly, generation, fallback, and logging modules described in the RAG Pipeline section.

**Vector Store Layer:** Wraps Pinecone (and the local fallback) behind a common `baseVectorStore.js` interface so the provider can be swapped without touching services above it.

**Config Layer:** Centralizes environment variables, MongoDB connection (with in-memory fallback), vector store client init, and Socket.IO setup.

## Database Collections

- **Users:** Authenticated users (name, email, password with `select: false`, role: `admin | student`, lastLogin).
- **Documents:** Uploaded files (title, originalFilename, storagePath, owner, department/collection tag, status: `UPLOADED | EXTRACTING | CHUNKING | EMBEDDING | INDEXED | FAILED`, pageCount, errorReason, version).
- **Chunks:** Text chunks per document (documentId, pageNumber, chunkIndex, text, vectorId, embeddingModel) — kept in Mongo as the source of truth alongside the vector store copy.
- **Collections:** Named knowledge-base groupings (name, department, description, documentIds).
- **Conversations:** Chat sessions (owner, title, createdAt, lastMessageAt).
- **ChatLogs:** Individual turns (conversationId, owner, query, retrievedChunkIds, similarityScores, answer, sources, latencyMs, feedback: `up | down | none`).
- **Notifications:** Alerts for admins (owner, documentId, type, message, isRead).

---

# API Endpoints

## Health and Auth
- `GET /api/health` – System heartbeat and status check.
- `POST /api/auth/register` – Register a new user account.
- `POST /api/auth/login` – Authenticate user and issue JWT.
- `GET /api/auth/me` – Fetch current user profile.

## Documents & Collections (Admin)
- `GET /api/documents` – List all documents with processing status.
- `POST /api/documents` – Upload a new document (multipart/form-data).
- `GET /api/documents/:id` – Fetch a single document's metadata and chunk summary.
- `PUT /api/documents/:id` – Update document metadata (title, department/collection tag).
- `POST /api/documents/:id/reindex` – Re-run extraction/chunking/embedding for a document.
- `DELETE /api/documents/:id` – Delete a document and its associated vectors/chunks.
- `GET /api/collections` – List knowledge-base collections.
- `POST /api/collections` – Create a new collection.
- `PUT /api/collections/:id` – Update a collection's documents.

## Chat / RAG
- `POST /api/chat/query` – Submit a question; runs the full RAG pipeline and returns (or streams) the answer + sources.
- `GET /api/chat/conversations` – List a user's conversations.
- `GET /api/chat/conversations/:id` – Fetch full conversation history.
- `DELETE /api/chat/conversations/:id` – Delete a conversation.
- `POST /api/chat/:chatLogId/feedback` – Submit 👍/👎 feedback on an answer.
- `GET /api/chat/suggested-questions` – Fetch suggested/auto-generated FAQ questions.

## Notifications & Analytics
- `GET /api/notifications` – List admin notifications.
- `GET /api/analytics/overview` – Aggregated query volume, confidence scores, and feedback ratios.

---

# Folder Structure & Development Phases

## Frontend Structure
```
client/
└── src/
    ├── components/
    │   ├── AppShell/
    │   ├── ChatWindow/
    │   ├── MessageBubble/
    │   ├── SourceCitation/
    │   ├── DocumentUploader/
    │   ├── ProcessingStatusBadge/
    │   └── ProtectedRoute/
    ├── pages/
    │   ├── _app.js
    │   ├── index.js
    │   ├── login.js
    │   ├── register.js
    │   ├── chat/
    │   │   ├── index.js
    │   │   └── [conversationId].js
    │   ├── admin/
    │   │   ├── documents.js
    │   │   ├── dashboard.js
    │   │   └── collections.js
    │   └── settings.js
    ├── store/
    │   ├── authStore.js
    │   └── chatStore.js
    └── services/
        ├── api.js
        └── socket.js
```

## Backend Structure
```
server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   ├── vectorStore.js
    │   └── socket.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── documentRoutes.js
    │   ├── collectionRoutes.js
    │   ├── chatRoutes.js
    │   └── analyticsRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── documentController.js
    │   ├── collectionController.js
    │   └── chatController.js
    ├── services/
    │   ├── authService.js
    │   ├── documentService.js
    │   ├── chunkingService.js
    │   ├── embeddingService.js
    │   ├── ragService.js
    │   ├── chatService.js
    │   └── analyticsService.js
    ├── agents/
    │   ├── ingestionAgent.js
    │   ├── retrievalAgent.js
    │   ├── contextAssemblyAgent.js
    │   ├── generationAgent.js
    │   ├── fallbackAgent.js
    │   └── loggingAgent.js
    ├── vectorstore/
    │   ├── baseVectorStore.js
    │   ├── pineconeStore.js
    │   └── localFallbackStore.js
    ├── models/
    │   ├── User.js
    │   ├── Document.js
    │   ├── Chunk.js
    │   ├── Collection.js
    │   ├── Conversation.js
    │   ├── ChatLog.js
    │   └── Notification.js
    └── queues/
        └── ingestionQueue.js
```

## Development Phases

- **Phase 1:** Project setup (Next.js, Express, MongoDB with in-memory fallback, JWT authentication, Zustand auth store, AppShell layout).
- **Phase 2:** Document upload, text extraction, chunking, and admin document management UI.
- **Phase 3:** Embedding generation and vector database integration (Pinecone primary, local fallback), including re-indexing and deletion cleanup.
- **Phase 4:** Full RAG pipeline — retrieval agent, context assembly, generation agent, unknown-question fallback, and chat logging.
- **Phase 5:** Chat interface with streaming answers (Socket.IO), source/reference display, chat history, and conversation management.
- **Phase 6:** Bonus layer — department-wise collections, admin analytics dashboard, answer feedback, suggested questions, OCR for scanned PDFs, hybrid keyword + semantic search, and re-ranking.

---

# UI, Security, Outcome, and Codex Instructions

## UI and UX Requirements

The UI must use a clean, approachable chat-console aesthetic with Tailwind, be fully responsive, include loading/streaming states and skeleton loaders, render each AI answer with clearly separated source citation chips (document name + page number), show a confidence/relevance indicator per answer, support suggested-question shortcuts, provide a 👍/👎 feedback control on every answer, and offer an admin document-processing status view with color-coded badges per pipeline stage.

## Security Requirements

The application must hash passwords with bcrypt at cost 12, sign and verify JWTs with `JWT_SECRET`, restrict document upload/delete/reindex endpoints to admin role only, set HTTP security headers via helmet, apply CORS limited to `CLIENT_URL`, rate-limit auth and chat query endpoints via express-rate-limit, validate every request body with express-validator, never log full document text or raw embedding vectors, and treat a missing or misconfigured embedding/LLM/vector-store API key as an explicit `PROVIDER_NOT_CONFIGURED` error surfaced to the admin rather than a generic 500.

## Final Expected Outcome

The completed platform must let a student ask a plain-English question about the college and receive an answer that is demonstrably grounded in uploaded documents, with visible sources and a confidence indicator, gracefully declining to answer when no relevant document exists. Admins must be able to upload, tag, re-index, and delete documents, watch ingestion progress live, and review analytics on usage and answer quality. The final application should feel like a trustworthy campus help-desk assistant, backed by a real retrieval pipeline and a full audit trail in MongoDB — not a generic LLM wrapper.

## Codex & AI Agent Implementation Instructions

The AI coding agent must build the application phase by phase, follow the folder structure strictly, keep controllers thin and push logic into services, keep agents pure (no HTTP knowledge), wrap every vector store provider behind the `baseVectorStore` interface, never call Mongo or the vector store directly from a controller, never call an embedding/LLM provider from an agent without going through the corresponding service, treat every secret as `process.env`, use the in-memory/local-fallback store when Pinecone/Mongo is unavailable so local dev still works, emit a Socket.IO event for every ingestion and generation step, write one `ChatLog` per query, ensure no answer is ever returned without either a source citation or an explicit "not found in knowledge base" message, and report the list of files created or changed at the end of every phase.