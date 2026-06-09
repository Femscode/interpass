# InterPass - AI-Powered Interview Simulation Platform

InterPass is a full-stack, AI-powered interview practice application designed to help users prepare for real-world interviews. It features interactive, dynamic interview simulations tailored to target roles, companies, seniority levels, and focus themes.

The system uses a **Human-in-the-Loop agentic workflow** powered by **LangGraph** on the backend and a modern **Next.js** dashboard on the frontend.

---

## Repository Structure

```text
interpass/
├── backend/            # FastAPI + LangGraph interview engine (Python)
├── frontend/           # Next.js App Router UI dashboard (TypeScript)
└── .gitignore          # Repository-wide git ignore configuration
```

---

## Step-by-Step Setup Guide

Follow these steps to get the frontend and backend running locally.

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Python 3.10 or higher**
- **Node.js 18 or higher**
- **npm** (or yarn/pnpm)
- An **OpenAI API Key** (required by the LangGraph backend agent)

---

### 2. Backend Setup (FastAPI & LangGraph)

The backend is built with FastAPI and runs the LangGraph interview orchestration graph.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open the newly created `.env` file and insert your OpenAI API Key:
   ```env
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

3. **Install Dependencies & Start Server:**

   We recommend using [uv](https://github.com/astral-sh/uv) for fast, reliable Python environments.
   
   * **Using `uv` (Recommended):**
     ```bash
     # Install packages and start the dev server directly
     uv run main.py
     ```

   * **Using standard `venv` & `pip`:**
     ```bash
     # Create virtual environment
     python3 -m venv .venv
     
     # Activate virtual environment
     source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
     
     # Install dependencies
     pip install -r requirements.txt
     
     # Start the FastAPI server
     python main.py
     ```

4. **Verify Backend Execution:**
   - The FastAPI backend should be running at [http://localhost:8000](http://localhost:8000).
   - You can access the interactive Swagger API documentation at [http://localhost:8000/docs](http://localhost:8000/docs).
   - Confirm backend health at [http://localhost:8000/health](http://localhost:8000/health).

---

### 3. Frontend Setup (Next.js)

The frontend is a Next.js application that manages session setup, interactive chat/voice interfaces, and final reports using a shared SQLite database.

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   *(By default, this points to `BACKEND_URL=http://localhost:8000` which connects to your local FastAPI server)*.

4. **Start the Next.js Development Server:**
   We run Next.js on port `3001` to coordinate CORS headers with the FastAPI server:
   ```bash
   npm run dev -- -p 3001
   ```
   *(Or run standard `npx next dev -p 3001`)*.

5. **Access the Application:**
   Open your browser and navigate to [http://localhost:3001](http://localhost:3001).

---

## How it Works (Under the Hood)

1. **Session Setup:** The user inputs their target company, role, level, and duration on the Next.js frontend. A session row is created in a local SQLite database (`frontend/interpass.db`).
2. **FastAPI Handshake:** The frontend calls Next.js API route proxies, which forward the request to the FastAPI server running on port `8000`.
3. **LangGraph Graph Execution:**
   - The FastAPI endpoint triggers LangGraph using the `session_id` as the thread checkpointer key.
   - The graph generates the first interview question using GPT-4o based on the configuration context.
   - The graph then **interrupts** execution (pauses state) at the `await_answer` node, saving progress in SQLite.
4. **Interactive Exchange:** Every time the user responds, their answer is saved, the graph is updated with their response, execution resumes to evaluate the answer, and then either asks the next question (and interrupts again) or proceeds to generate a final performance report.
