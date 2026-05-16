# PEBLO Notes — AI-Powered Collaborative Workspace

A full-stack, AI-powered notes workspace built for the **PEBLO Full Stack Developer Challenge**. Create, organize, and share notes with AI-generated summaries, action items, and productivity insights.

![Stack](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![Stack](https://img.shields.io/badge/Express.js-4-green?logo=express) ![Stack](https://img.shields.io/badge/Prisma-SQLite-blue?logo=prisma) ![Stack](https://img.shields.io/badge/Gemini-AI-orange?logo=google)

---

## ✨ Features

### Core Features
- **🔐 Authentication** — Secure signup/login with JWT, bcrypt password hashing, and protected routes
- **📝 Notes Workspace** — Create, edit, auto-save, tag, and archive notes with full markdown support
- **🤖 AI Integration** — Generate summaries, action items, and title suggestions via Google Gemini
- **🔍 Search & Filtering** — Real-time keyword search, tag filtering, and smart sorting
- **🔗 Public Sharing** — One-click share links with clean, public-facing read-only pages
- **📊 Insights Dashboard** — Total notes, weekly activity chart, top tags, AI usage stats

### Bonus Features
- **🌙 Dark/Light Mode** — Theme toggle with localStorage persistence
- **📖 Markdown Preview** — Live preview with GFM (tables, strikethrough, task lists)
- **⌨️ Keyboard Shortcuts** — `Ctrl+S` save, `Ctrl+N` new note, `Ctrl+K` search
- **⚡ Optimistic UI** — Instant updates with automatic rollback on error

---

## 🏗️ Architecture

```
assignment/
├── backend/                  # Express.js API
│   ├── prisma/
│   │   └── schema.prisma     # Database schema (User, Note, Tag, AILog)
│   ├── src/
│   │   ├── index.js          # Server entry point
│   │   ├── config/           # Environment + Prisma client
│   │   ├── middleware/        # JWT auth + request validation
│   │   ├── routes/           # Auth, Notes, Share, Insights
│   │   └── services/         # Business logic layer
│   └── package.json
├── frontend/                 # Next.js 15 (App Router)
│   ├── app/
│   │   ├── page.js           # Landing page
│   │   ├── login/            # Login page
│   │   ├── signup/           # Signup page
│   │   ├── dashboard/        # Protected workspace
│   │   │   ├── page.js       # Notes list + search
│   │   │   ├── notes/[id]/   # Note editor
│   │   │   └── insights/     # Productivity dashboard
│   │   └── shared/[shareId]/ # Public share page
│   ├── lib/                  # API client + utilities
│   └── store/                # Zustand state management
├── .env.example
├── .gitignore
└── README.md
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, Zustand, Axios |
| **Styling** | Vanilla CSS with CSS Modules, CSS Custom Properties |
| **Backend** | Express.js 4, JWT, bcryptjs |
| **Database** | SQLite via Prisma ORM |
| **AI** | Google Gemini (`gemini-2.5-flash`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone the Repository
```bash
git clone <repo-url>
cd assignment
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp ../.env.example .env
# Edit .env → set GEMINI_API_KEY to your key

# Run database migrations
npx prisma migrate dev --name init

# Start the backend server
npm run dev
```
The API will be running at `http://localhost:5001`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The app will be running at `http://localhost:3000`.

### 4. Open the App
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key-change-me
GEMINI_API_KEY=your-gemini-api-key
PORT=5001
```

> ⚠️ **Never commit real API keys.** Use the `.env.example` as a template.

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | ✗ | Register new user |
| `POST` | `/api/auth/login` | ✗ | Login, returns JWT |
| `GET` | `/api/auth/me` | ✓ | Get current user |
| `GET` | `/api/notes` | ✓ | List notes (search, filter, sort) |
| `POST` | `/api/notes` | ✓ | Create note |
| `GET` | `/api/notes/:id` | ✓ | Get single note |
| `PATCH` | `/api/notes/:id` | ✓ | Update note (auto-save) |
| `DELETE` | `/api/notes/:id` | ✓ | Delete note |
| `PATCH` | `/api/notes/:id/archive` | ✓ | Toggle archive |
| `POST` | `/api/notes/:id/generate-summary` | ✓ | AI summary |
| `POST` | `/api/notes/:id/share` | ✓ | Toggle share link |
| `GET` | `/api/shared/:shareId` | ✗ | Public shared note |
| `GET` | `/api/insights` | ✓ | Dashboard analytics |
| `GET` | `/api/health` | ✗ | Health check |

---

## 🗄️ Database Schema

```
User ──┐
       ├── Note ──── NoteTag ──── Tag
       └── AILog
```

- **User**: id, name, email, password (bcrypt), timestamps
- **Note**: id, title, content, isArchived, isPublic, shareId, summary, actionItems, timestamps
- **Tag**: id, name (unique) — Many-to-many with Notes via NoteTag
- **AILog**: id, type, noteId, userId, createdAt — Tracks AI usage

---

## 🧪 Testing

```bash
# Verify backend health
curl http://localhost:5001/api/health

# Run frontend build check
cd frontend && npm run build

# View database
cd backend && npx prisma studio
```

---

## 📋 Sample API Responses

### Signup
```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-05-16T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### AI Summary
```json
{
  "summary": "Weekly project planning discussion covering sprint goals, task assignments, and timeline adjustments.",
  "action_items": [
    "Prepare UI mockups by Friday",
    "Review API structure with team",
    "Set up CI/CD pipeline"
  ],
  "suggested_title": "Sprint Planning Notes"
}
```

### Insights
```json
{
  "notes": { "total": 12, "active": 10, "archived": 2 },
  "recentlyEdited": [...],
  "topTags": [
    { "name": "work", "count": 5 },
    { "name": "ideas", "count": 3 }
  ],
  "aiStats": { "total": 8, "summary": 6, "action_items": 1, "title_suggestion": 1 },
  "weeklyActivity": [
    { "date": "2026-05-10", "day": "Sat", "created": 2, "updated": 1 },
    ...
  ]
}
```

---

## 🎨 Design Decisions

- **Dark-first design** with glassmorphism cards and vibrant gradient accents
- **Inter font family** for modern, clean typography
- **CSS Custom Properties** for seamless dark/light theme switching
- **CSS Modules** for component-scoped styles, preventing conflicts
- **Zustand** over Redux for minimal boilerplate state management
- **SQLite** for zero-config portable database — just clone and run
- **Service layer pattern** separating route handlers from business logic

---

Built with ❤️ for the PEBLO Full Stack Developer Challenge
# peblo
