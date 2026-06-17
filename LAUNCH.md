# 🚀 Launching InterPass & Deployment Guide

This document contains instructions for launching both the backend (FastAPI) and the frontend (Next.js) of InterPass locally, along with free hosting services you can use to deploy the project.

---

## 💻 Local Launch Commands

Both services are currently active on your local environment:
*   **Backend Server:** running at [http://localhost:8000](http://localhost:8000) (Docs: [/docs](http://localhost:8000/docs))
*   **Frontend Server:** running at [http://localhost:3001](http://localhost:3001)

Here are the terminal commands to run both manually:

### 1. Backend (FastAPI + LangGraph)
Navigate to the `backend` directory and run the server using python inside the virtual environment:
```bash
cd backend
# With the preconfigured virtual environment:
./.venv/bin/python main.py
```
> [!NOTE]
> Ensure that you have a `.env` file containing your `OPENAI_API_KEY` in the `backend/` folder before launching.

### 2. Frontend (Next.js)
Navigate to the `frontend` directory and start the dev server on port `3001` (to match the backend CORS setup):
```bash
cd frontend
npm run dev -- -p 3001
```

---

## 🌐 Free Deployment Services

Since this is a full-stack application (Next.js frontend, FastAPI backend, SQLite database), deploying it requires hosting for all three layers. Below are the best free services you can use.

### 📦 1. Frontend (Next.js)

| Service | Best For | Description |
| :--- | :--- | :--- |
| **[Vercel](https://vercel.com/)** | **Recommended** | Built by the creators of Next.js. Offers seamless GitHub integration, automatic deployments, and full serverless capability for Next.js out of the box. |
| **[Netlify](https://www.netlify.com/)** | Alternative hosting | Excellent, generous free tier for static/Jamstack/Next.js hosting with automatic SSL and form handling. |
| **[Cloudflare Pages](https://pages.cloudflare.com/)** | Speed & uptime | Extremely fast global CDN, completely free tier with unlimited bandwidth, supports Next.js SSR via Cloudflare Workers. |

### ⚙️ 2. Backend (FastAPI / Python)

| Service | Best For | Description |
| :--- | :--- | :--- |
| **[Render](https://render.com/)** | **Recommended** | Very simple to set up web services. The free tier gives you a container that spins down after 15 minutes of inactivity (starts up in ~50s when pinged). |
| **[Koyeb](https://www.koyeb.com/)** | High Performance | Modern hosting platform offering a free tier instance (runs microVMs). Supports Docker or Git deployments with fast build times. |
| **[Hugging Face Spaces](https://hugging face.co/spaces)** | Continuous Uptime | By deploying as a Docker space or Gradio/FastAPI template, Hugging Face spaces remain active without sleeping. |
| **[Railway](https://railway.app/)** | Easy templates | Developer-friendly platform. Generous initial trial credits, though persistent free execution is limited. |

### 🗄️ 3. Database (SQLite / SQL)

> [!WARNING]
> SQLite is a local file-based database. If you deploy your backend on serverless platforms (like Vercel) or ephemeral containers (like Render/Koyeb free tiers), **any changes made to the database file will be lost** whenever the server restarts or scales down.
> To prevent this, you should use a cloud database for production.

Here are the best free database options:

*   **[Turso](https://turso.tech/) (Highly Recommended for SQLite):**
    *   Turso is a distributed database built on libSQL, a fork of SQLite.
    *   It allows you to keep using SQLite syntax and local SQLite files for development, but syncs to a highly responsive cloud SQLite instance.
    *   **Free tier:** Generous 500 databases and 9GB storage.
*   **[Neon](https://neon.tech/):**
    *   Serverless PostgreSQL with a generous free tier (0.5 GiB storage, auto-suspend).
*   **[Supabase](https://supabase.com/):**
    *   Full backend-as-a-service offering a free PostgreSQL database (500MB storage).

---

## 🛠️ Recommended Deployment Setup

For a production build, the best workflow is:
1.  **Frontend:** Deploy to **Vercel** connected to your GitHub repository.
2.  **Backend:** Deploy the FastAPI code to **Render** or **Koyeb**.
3.  **Database:** Migrate from local `interpass.db` to **Turso** so your SQLite data remains persistent and accessible by both backend and frontend.
