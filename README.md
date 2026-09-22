# IntelliSummarize AI — Advanced NLP-Based Text Summarization Platform

An advanced Transformer-based AI Text Summarization System supporting extractive, abstractive, hybrid, and multilingual document summarization with a FastAPI backend, React (Vite) frontend, SQLite database, and Docker containerization.

---

## ⚡ Key Features

* **Multi-Algorithm Engine**:
  * **Extractive**: TF-IDF weighting and Cosine Similarity TextRank.
  * **Abstractive**: Sequence-to-Sequence NLP pipelines (`BART`, `T5`).
  * **Hybrid**: Extractive pre-filtering + Abstractive fluency synthesis.
* **Multilingual Translation**: English, Hindi, Spanish, French, German, Arabic.
* **Rich Inputs**: Raw text, file imports (PDF, DOCX, TXT), and Web page URL scrapers.
* **Interactive Dashboard**: Configurable length adjustments, readability analysis, and custom-rendered SVG charts.
* **JWT Security**: Protected user history archive.

---

## 📂 Project Architecture

```bash
text-summarization-ai/
│
├── backend/
│   ├── app/
│   │   ├── api/             # API routes (auth, summarize, history, analytics)
│   │   ├── core/            # Config, security, database helpers
│   │   ├── models/          # SQLAlchemy Database Models
│   │   ├── schemas/         # Pydantic Schemas
│   │   └── services/        # Summarizer Engine, NLP Utils
│   └── requirements.txt     # Python backend dependencies
│
├── frontend/
│   ├── src/                 # React code components, visualizers
│   └── package.json         # Node configurations
│
├── docker/
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend Server Setup

Prerequisites: Python 3.9+

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate # On Windows

# Install dependencies
pip install -r requirements.txt

# Start the uvicorn development server
uvicorn app.main:app --reload --port 8000
```
API docs will be available at `http://localhost:8000/docs`.

### 2. Frontend Development Setup

Prerequisites: Node.js 18+

```bash
# Navigate to frontend
cd frontend

# Install package modules
npm install

# Run the local Vite server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🐳 Docker Deployment

To launch the entire platform in containerized mode (including backend, database, and frontend):

```bash
docker-compose up --build
```
This maps the FastAPI server to port `8000` and the React frontend to port `80`.
