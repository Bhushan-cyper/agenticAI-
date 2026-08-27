# 🎓 CampusMind_AI — RAG-Based College Chatbot

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%20(Pages%20Router)-000000?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-43853D?style=flat&logo=nodedotjs)](https://expressjs.com/)
[![Vector Store](https://img.shields.io/badge/Vector_DB-Pinecone%20%2F%20In--Memory%20Cosine-0c8fe9?style=flat)](https://www.pinecone.io/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO-010101?style=flat&logo=socketdotio)](https://socket.io/)

**CampusMind_AI** is a production-grade, Retrieval-Augmented Generation (RAG) college help desk platform. It answers student queries about admissions, fees, hostel rules, academic calendar, placements, and campus facilities by retrieving grounded context from official documents with vector search, page-level source citations, and real-time streaming.

---

## 🌟 Key Features

- 🧠 **Vector Semantic Search**: Real embeddings and similarity search against Pinecone or the built-in local cosine vector store.
- 📜 **Source Attribution & Citations**: Every AI response includes clickable citation chips displaying document titles, page numbers, and exact context snippets.
- ⚡ **Real-Time Token Streaming**: Real-time answer streaming via Socket.IO for low perceived latency.
- 📡 **Live Document Processing Pipeline**: Administrators can upload PDFs and monitor live ingestion stages (`UPLOADED` $\rightarrow$ `EXTRACTING` $\rightarrow$ `CHUNKING` $\rightarrow$ `EMBEDDING` $\rightarrow$ `INDEXED` / `FAILED`).
- 🛡️ **Multi-Tier Fallback Chain (Zero-Config Out-of-the-Box)**:
  - **Database**: Remote MongoDB or automatic in-memory `mongodb-memory-server` fallback.
  - **Vector DB**: Pinecone or local in-memory cosine similarity fallback.
  - **AI Generation**: OpenAI / OpenRouter $\rightarrow$ Google Gemini $\rightarrow$ Extractive Grounded Synthesizer.
- 🔍 **OCR Fallback**: Automatic `tesseract.js` OCR extraction on scanned or non-selectable PDFs.
- 📊 **Governance & Analytics**: Track query volume, average retrieval confidence, student satisfaction (👍/👎 feedback), and unanswered inquiries.
- 🔒 **Enterprise Security**: Role-based access control (Admin vs Student), bcrypt cost 12 hashing, rate limiting, and HTTP security headers with Helmet.

---

## 🏗️ Architecture & Pipeline Flow

```
[ Student / Admin Web Client (Next.js) ]
               │
      REST & Socket.IO
               │
               ▼
   [ Express Backend API & Sockets ]
               │
    ┌──────────┴──────────────────────────────┐
    ▼                                         ▼
[ Document Ingestion Queue ]            [ RAG Query Engine ]
 1. PDF / OCR Extraction                 1. Query Embedding
 2. Recursive Chunker                    2. Vector Retrieval (Top-K)
 3. Vector Embedder                      3. Context Assembly & Citation
 4. Vector Store Upsert                  4. Grounded Multi-LLM Generation
 5. Mongo Chunk Metadata                 5. Token Streaming & Audit Log
    │                                         │
    └──────────────────┬──────────────────────┘
                       ▼
         [ Vector Store & Database ]
          - Pinecone / Local Store
          - MongoDB / In-Memory
```

---

## 🚀 Quick Start (Run Locally in 2 Minutes)

### 1. Prerequisites
- **Node.js** v18 or higher (v20+ recommended)
- **npm** v9 or higher

> [!TIP]
> **No API keys or MongoDB installations are required** to test and run the project! The system automatically boots an in-memory database, seeds demo handbooks, and uses local vector search out of the box.

---

### 2. Backend Setup (`server`)

Open a terminal and run:

```bash
cd server
npm install --legacy-peer-deps
npm start
```

*The server will automatically connect to database, seed 6 sample campus handbooks, and start listening at `http://localhost:5000`.*

---

### 3. Frontend Setup (`client`)

Open a second terminal and run:

```bash
cd client
npm install --legacy-peer-deps
npm run dev
```

*The Next.js client will start at `http://localhost:3000`.*

---

### 4. Demo Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **🛡️ Campus Admin** | `admin@campusmind.edu` | `Admin@123456` | Document Upload, Re-index, Analytics, Collections |
| **👤 Student** | `student@campusmind.edu` | `Student@123456` | Campus Chat, History, Department Filtering, Feedback |

*(You can also use the **1-Click Demo Login** buttons on the `/login` page).*

---

## ⚙️ Environment Configuration

### Backend (`server/.env`)

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Authentication
JWT_SECRET=supersecret_campusmind_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# Database (Leave empty to use automatic in-memory MongoDB fallback)
MONGO_URI=

# Hosted Vector Database (Optional - uses local cosine vector store if empty)
PINECONE_API_KEY=
PINECONE_INDEX=campusmind
PINECONE_ENVIRONMENT=us-east-1

# External AI Providers (Optional - uses extractive synthesis if empty)
OPENAI_API_KEY=
OPENROUTER_API_KEY=
GEMINI_API_KEY=

# RAG & Ingestion Hyperparameters
CHUNK_SIZE=600
CHUNK_OVERLAP=100
SIMILARITY_TOP_K=5
SIMILARITY_THRESHOLD=0.35
```

### Frontend (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 📖 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` – Register a student or administrator.
- `POST /api/auth/login` – Authenticate user and issue JWT token.
- `GET /api/auth/me` – Retrieve profile of authenticated user.

### 💬 Chat & RAG Pipeline (`/api/chat`)
- `POST /api/chat/query` – Execute RAG pipeline and stream source-cited response.
- `GET /api/chat/conversations` – List chat history sessions.
- `GET /api/chat/conversations/:id` – Fetch conversation message turns.
- `DELETE /api/chat/conversations/:id` – Delete a conversation.
- `POST /api/chat/:chatLogId/feedback` – Submit 👍/👎 feedback with comments.
- `GET /api/chat/suggested-questions` – Fetch campus FAQ question shortcuts.

### 📄 Document Ingestion (`/api/documents`) [Admin]
- `GET /api/documents` – List all uploaded campus documents with pipeline status.
- `POST /api/documents` – Upload and queue a PDF/TXT/MD document.
- `GET /api/documents/:id` – View document metadata and chunk summary.
- `PUT /api/documents/:id` – Update document title or department tagging.
- `POST /api/documents/:id/reindex` – Re-extract, chunk, and embed a document.
- `DELETE /api/documents/:id` – Purge document, MongoDB chunks, and vector store embeddings.

### 📂 Knowledge Base Collections (`/api/collections`)
- `GET /api/collections` – List department collections.
- `POST /api/collections` – Create a new department knowledge grouping [Admin].
- `PUT /api/collections/:id` – Update collection details [Admin].
- `DELETE /api/collections/:id` – Delete collection [Admin].

### 📊 Analytics & Health (`/api/analytics` & `/api/health`)
- `GET /api/analytics/overview` – Get indexed document count, query metrics, satisfaction rate, and unanswered questions [Admin].
- `GET /api/notifications` – List system alerts and low-confidence query notices [Admin].
- `GET /api/health` – Heartbeat and diagnostic status of MongoDB, Vector DB, and LLM providers.

---

## 📂 Project Directory Structure

```
.
├── client/                     # Next.js Pages Router Frontend
│   ├── src/
│   │   ├── components/         # AppShell, ChatWindow, MessageBubble, SourceCitation, DocumentUploader
│   │   ├── pages/              # index, login, register, chat, admin (documents, dashboard, collections), settings
│   │   ├── services/           # Axios API and Socket.IO real-time client
│   │   ├── store/              # Zustand Auth & Chat state stores
│   │   └── styles/             # Tailwind & global CSS
│   └── package.json
│
├── server/                     # Node.js Express Backend
│   ├── src/
│   │   ├── agents/             # IngestionAgent, RetrievalAgent, ContextAssembly, GenerationAgent, FallbackAgent, LoggingAgent
│   │   ├── config/             # DB (with memory fallback), VectorStore (Pinecone/Local), Socket, Env
│   │   ├── controllers/        # Express request controllers
│   │   ├── middlewares/        # Auth (JWT), Validation, Error handling
│   │   ├── models/             # Mongoose Schemas (User, Document, Chunk, Collection, Conversation, ChatLog, Notification)
│   │   ├── queues/             # Ingestion task queue
│   │   ├── routes/             # REST route declarations
│   │   ├── services/           # Business logic, Chunking, Embedding, RAG orchestrator, Chat, Analytics
│   │   ├── vectorstore/        # BaseVectorStore, PineconeStore, LocalFallbackStore
│   │   ├── seed.js             # Initial database & document seeder
│   │   └── server.js           # Server entry point
│   ├── data/sample_documents/  # Preloaded college handbooks & guides
│   └── package.json
│
├── spec.md                     # Project specification sheet (Single source of truth)
└── README.md                   # Complete documentation
```

---

## 🧪 Testing the RAG Pipeline

1. **Grounded Query Test**:
   - Question: *"What is the annual tuition fee for B.Tech Computer Science and when is the payment deadline?"*
   - Expected Result: Answers $8,500/year, July 1-25 payment window, citing `Fee_Structure_and_Scholarships_Policy.txt` with confidence score.

2. **Hostel Rules Test**:
   - Question: *"What are the hostel mess timings for breakfast and dinner?"*
   - Expected Result: Answers 07:30-09:30 AM and 07:45-09:45 PM citing `Hostel_Mess_and_Campus_Rules.txt`.

3. **Unknown / Out-of-Domain Guardrail Test**:
   - Question: *"How do I design a rocket propulsion engine?"*
   - Expected Result: Gracefully states that the campus documents do not contain information on this topic, avoids hallucinating, and alerts the admin.
