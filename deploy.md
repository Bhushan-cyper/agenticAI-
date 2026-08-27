# 🚀 Deployment Guide — CampusMind AI

This guide walks you through deploying **CampusMind_AI** with **Render** (Backend API & WebSockets) and **Vercel** (Next.js Frontend).

---

## 📋 Architecture & Deployment Overview

- **Backend (Render):** Express.js API, Socket.IO WebSockets, Mongoose with MongoDB Atlas, and Multi-LLM RAG Engine.
- **Frontend (Vercel):** Next.js Pages Router, React 19, and Tailwind CSS.
- **Database (MongoDB Atlas):** Hosted MongoDB cloud cluster.

---

## Step 1: Push Code to GitHub

### 1.1 Verify `.gitignore`
Make sure secrets (`.env`, `.env.local`) and `node_modules` are ignored before committing.
*(The `.gitignore` file has already been set up for you).*

### 1.2 Initialize and Push to GitHub
Open a terminal in the project root directory (`c:\Users\BHUSHAN PATIL\Downloads\Project- Rag`) and run:

```bash
# 1. Initialize Git repository (if not already initialized)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit: CampusMind AI full-stack RAG platform"

# 4. Rename default branch to main
git branch -M main

# 5. Add your GitHub remote repository URL (replace with your actual GitHub URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# 6. Push to GitHub
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

1. Go to **[Render.com](https://render.com/)** and log in (or sign up with GitHub).
2. Click **New +** $\rightarrow$ select **Web Service**.
3. Choose **Build and deploy from a Git repository** and select your `campusmind` repository.
4. Configure the Web Service settings as follows:

| Setting | Value |
| :--- | :--- |
| **Name** | `campusmind-server` *(or your preferred name)* |
| **Region** | Select the region closest to you / your database (e.g., *Singapore*, *Oregon*, *Frankfurt*) |
| **Branch** | `main` |
| **Root Directory** | `server` ⚠️ *(Important: do not leave blank)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install --legacy-peer-deps` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Scroll down to **Environment Variables** and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment flag |
| `PORT` | `5000` | Port for Express server |
| `MONGO_URI` | `mongodb+srv://.../campusmind?appName=AgenticAi` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `supersecret_campusmind_jwt_key_prod_2025` | Strong random secret string |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `GEMINI_API_KEY` | `AIzaSyA...` | Your Google Gemini API Key |
| `CLIENT_URL` | `http://localhost:3000` *(Temporary until Step 4)* | Allowed CORS origin |
| `CHUNK_SIZE` | `600` | RAG chunk size |
| `CHUNK_OVERLAP` | `100` | RAG chunk overlap |
| `SIMILARITY_TOP_K` | `5` | Top-K retrieval matches |
| `SIMILARITY_THRESHOLD`| `0.35` | Minimum similarity threshold |

*(Optional: Add `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX` if using paid OpenAI/Pinecone services).*

6. Click **Create Web Service**.
7. Wait for the build and deployment to complete. Render will provide you with a public URL:
   👉 **`https://campusmind-server.onrender.com`** *(Copy this URL for Step 3)*.

---

## Step 3: Deploy Frontend to Vercel

1. Go to **[Vercel.com](https://vercel.com/)** and log in with GitHub.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository.
4. In the **Configure Project** screen:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and select `client` ⚠️ *(Important)*
   - **Build Command:** `npm run build` *(Default)*
   - **Output Directory:** `.next` *(Default)*
   - **Install Command:** `npm install --legacy-peer-deps`

5. Expand the **Environment Variables** section and add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://campusmind-server.onrender.com/api` *(Your Render Backend URL + `/api`)* |
| `NEXT_PUBLIC_SOCKET_URL` | `https://campusmind-server.onrender.com` *(Your Render Backend URL)* |

6. Click **Deploy**.
7. Once deployment finishes, Vercel will give you your production domain:
   👉 **`https://agenticai26.vercel.app`**

---

## Step 4: Link Frontend URL in Render (CORS & WebSockets)

Now that your frontend is live on Vercel:

1. Return to **Render Dashboard** $\rightarrow$ Click on `campusmind-server`.
2. Go to **Environment** tab.
3. Edit `CLIENT_URL` and set it to your **Vercel domain**:
   ```
   CLIENT_URL = https://agenticai26.vercel.app
   ```
4. Click **Save Changes**. Render will automatically redeploy with the updated CORS policy.

---

## Step 5: Seed Production Database & Verify

The backend is programmed to automatically detect an empty database and seed the 6 demo campus handbooks and demo accounts on first boot.

If you ever want to re-seed manually:
1. In Render Dashboard, go to your service $\rightarrow$ **Shell** tab.
2. Run:
   ```bash
   npm run seed
   ```

---

## ✅ Post-Deployment Verification Checklist

- [ ] Visit your Vercel URL (`https://agenticai26.vercel.app`).
- [ ] Log in with Demo Admin: `admin@campusmind.edu` / `Admin@123456`.
- [ ] Visit `/settings` and verify all services (MongoDB, Vector Store, Gemini, RAG Pipeline) show **Active / Operational**.
- [ ] Visit `/chat` and submit a test query (e.g., *"What are the hostel mess timings?"*).
- [ ] Verify streaming answer, confidence indicator, and source citation chips appear.
- [ ] Visit `/admin/documents` and test uploading a new campus circular or document.
