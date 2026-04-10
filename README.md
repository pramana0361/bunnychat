# BunnyChat — Role-play AI Chat API

A multi-user role-play AI chat API running on **[Bunny.net Edge Scripting](https://bunny.net?ref=u5whp75240)**,
powered by **[OpenRouter](https://openrouter.ai/)** (multi-model with fallback) and **[Bunny.net](https://bunny.net?ref=u5whp75240) libsql** database.

<a href="https://bunny.net?ref=u5whp75240" rel="sponsored" target="_blank">
  <img src="https://i.ibb.co.com/Vc6sr05T/Enteprise-Grade-AD-1200-x-628-Dark.png" width="200" alt="Link to Bunny.net"/>
</a>

<a href="https://openrouter.ai/" rel="sponsored" target="_blank">
  <img src="https://i.ibb.co.com/rGrZ3Rpp/opengraph-image-1wirky.png" width="200" alt="Link to OpenRouter.ai"/>
</a>

---

⚠️ **Vibe Code Alert**<br>
This project is intended solely as a Proof of Concept and Just for Fun. The code within this project is the result of Vibe Coding and reflects the Author’s limitations in the programming language used. As such, the implementation may not adhere to best practices or established development standards.

However, the ideas, concepts, features, and workflows presented here are entirely the result of the Author’s knowledge and experience as an app developer.

Therefore, this project is not recommended for production use. It may contain bugs, exhibit an unstructured or inconsistent architecture, and its security and performance have not been thoroughly tested or validated.

---

<table>
  <tr>
    <td><img src="https://i.ibb.co.com/Kz7Svxbg/Screen-Shot-2026-04-10-at-17-17-13.png" width="600"/></td>
    <td><img src="https://i.ibb.co.com/d4kM246f/Screen-Shot-2026-04-10-at-17-15-36.png" width="600"/></td>
  </tr>
  <tr>
    <td><img src="https://i.ibb.co.com/JWpLQhDT/Screen-Shot-2026-04-10-at-17-03-38.png" width="600"/></td>
    <td><img src="https://i.ibb.co.com/gZLbZBqK/Screen-Shot-2026-04-10-at-17-09-45.png" width="600"/></td>
  </tr>
</table>

```
Overview of contents
│
├── Architecture
│   ├── Request flow diagram
│   └── Service overview
│
├── Requirements
│   └── Service table (Bunny, Turso, OpenRouter)
│
├── Installation
│   ├── 1. Create Turso Database (CLI commands)
│   ├── 2. Create Tables (full SQL — all tables + indexes)
│   ├── 3. Deploy Edge Script (dashboard steps)
│   └── 4. Environment Variables (table + model guide + log levels)
│
├── API Reference
│   ├── Health          — GET /health
│   ├── Auth            — register, login, logout
│   ├── Profile         — GET /me, PATCH /me
│   ├── Persona         — GET/PUT /persona
│   ├── Chat            — POST /chat
│   ├── Sessions        — GET/DELETE /sessions
│   │                     GET/PATCH/DELETE /sessions/:id
│   ├── Knowledge       — GET/POST /knowledge
│   │                     PUT/DELETE /knowledge/:id
│   └── Admin           — POST /admin/users/credits
│                         GET /admin/users/:id
│
├── cURL Examples
│   ├── Auth
│   ├── Profile
│   ├── Persona
│   ├── Chat
│   ├── Sessions
│   ├── Knowledge
│   └── Admin
│
├── Limits & Constraints
│   ├── Bunny Edge Script limits table
│   └── Application limits table
│
├── Credits System
│   └── Cost per action table
│
├── Error Reference
│   └── HTTP status code table
│
├── Function & Method Reference
│   ├── Utility Functions
│   │   ├── genId()
│   │   ├── sha256()
│   │   ├── generateUsername()
│   │   ├── normalizeKeywords()
│   │   └── resetOpenRouterErrors()
│   ├── Persona Builder
│   │   └── buildPersonaPrompt()
│   ├── Database Functions
│   │   ├── getDb()
│   │   ├── dbRun()
│   │   └── dbBatch()
│   ├── OpenRouter Functions
│   │   ├── getModels()
│   │   ├── isRateLimited()
│   │   ├── isHardError()
│   │   └── callOpenRouter()
│   ├── Knowledge Functions
│   │   ├── extractKeywords()
│   │   ├── extractKnowledge()
│   │   ├── scoreKnowledge()
│   │   └── getRelevantKnowledge()
│   ├── Reply Parser Functions
│   │   ├── parseStructuredReply()
│   │   ├── parseActionsFromText()
│   │   ├── looksLikeSpeech()
│   │   ├── looksLikeAction()
│   │   ├── sanitizeReplyFields()
│   │   └── parseReply()
│   ├── Session Functions
│   │   └── generateSessionTitle()
│   └── Route Handlers
│       ├── register()
│       ├── login()
│       ├── logout()
│       ├── getMe()
│       ├── updateMe()
│       ├── getPersona()
│       ├── updatePersona()
│       ├── listSessions()
│       ├── getSession()
│       ├── updateSession()
│       ├── deleteSession()
│       ├── clearAllSessions()
│       ├── listKnowledge()
│       ├── addKnowledge()
│       ├── updateKnowledge()
│       ├── deleteKnowledge()
│       ├── adminUpdateCredits()
│       └── chat()
│
├── Data Flow Diagrams
│   ├── New chat session flow
│   └── Knowledge relevance retrieval flow
│
├── Changelog
│
├── Troubleshooting
│   ├── HTTP 400 empty body
│   ├── script startup time exceeded
│   ├── All models failed
│   ├── Unauthorized on every request
│   ├── Insufficient credits
│   ├── Keywords not extracted
│   ├── AI answers outside specialization
│   ├── AI ignores knowledge base
│   ├── Reply and actions swapped
│   ├── Session title stays as "New Chat"
│   ├── dquote> in terminal
│   └── Content trimmed warning
│
├── Environment Variables Reference
│   └── Full annotated .env example
│
├── Constants Reference
│   └── All tunable constants with descriptions
│
├── Security Notes
│   ├── Passwords
│   ├── Session tokens
│   ├── Admin token
│   ├── Knowledge base scoping
│   └── SQL injection prevention
│
├── Production Recommendations
│   ├── Recommendations table
│   ├── Add CORS headers (code snippet)
│   └── Add session expiry (code snippet)
│
└── Quick Start Checklist
    └── 14-step checklist
```

## Table of Contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [Installation](#installation)
  - [1. Create Turso Database](#1-create-turso-database)
  - [2. Create Tables](#2-create-tables)
  - [3. Deploy Edge Script](#3-deploy-edge-script)
  - [4. Environment Variables](#4-environment-variables)
- [API Reference](#api-reference)
  - [Health](#health)
  - [Auth](#auth)
  - [Profile](#profile)
  - [Persona](#persona)
  - [Chat](#chat)
  - [Sessions](#sessions)
  - [Knowledge](#knowledge)
  - [Admin](#admin)
- [cURL Examples](#curl-examples)
- [Limits & Constraints](#limits--constraints)
- [Credits System](#credits-system)
- [Error Reference](#error-reference)

---

## Architecture

```
Client
  │
  ▼
Bunny Edge Script (server.js)
  ├── OpenRouter API  (AI inference — 3 model fallback chain)
  └── Turso libsql    (users, personas, sessions, messages, knowledge)
```

### Request flow

```
POST /chat
  1. Authenticate user via session_token
  2. Resolve or create chat session
  3. Fetch persona + session history + relevant knowledge (parallel)
  4. Build system prompt (persona + knowledge base)
  5. Call OpenRouter with fallback chain
  6. Parse structured reply (reply + actions)
  7. Persist messages + deduct credits (batch)
  8. Auto-generate session title (non-blocking)
  9. Auto-extract knowledge from conversation (non-blocking)
 10. Return { session_id, reply, actions, model, credits_remaining }
```

---

## Requirements

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Bunny.net](https://bunny.net?ref=u5whp75240) | Edge Script hosting | ✅ |
| [Turso](https://turso.tech) or [Bunny.net](https://bunny.net?ref=u5whp75240)| libsql database | ✅ 500 MB |
| [OpenRouter](https://openrouter.ai) | AI model API | ✅ free models |

---

## Installation

### 1. Create Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create bunnychat

# Get credentials
turso db show bunnychat           # copy the URL
turso db tokens create bunnychat  # copy the token
```
#### If using Bunny.net Database
1. Go to [Bunny Dashboard](https://dash.bunny.net?ref=u5whp75240) → **Database** → **Add Database**
2. Name it `bunnychat`
3. Copy or download the **Database access information** (URL and access tokens)
4. Finish
---

### 2. Create Tables

Open your Turso database shell:

```bash
turso db shell bunnychat
```

Run all of the following queries:

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  username      TEXT    NOT NULL UNIQUE,       -- auto-generated from email
  displayname   TEXT    NOT NULL,              -- editable by user
  avatar        TEXT,                          -- image url/path, nullable
  credits       INTEGER NOT NULL DEFAULT 100,  -- chat & knowledge credits
  password      TEXT    NOT NULL,              -- SHA-256 hashed
  session_token TEXT,                          -- single-device session token
  session_at    TEXT,                          -- last session created at
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- AI persona per user
CREATE TABLE IF NOT EXISTS user_personas (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL UNIQUE REFERENCES users(id),
  name           TEXT    NOT NULL DEFAULT 'Assistant',
  image          TEXT,                         -- persona image url/path, nullable
  sex            TEXT    NOT NULL DEFAULT 'undefined'
                         CHECK(sex IN ('male','female','undefined')),
  age            INTEGER NOT NULL DEFAULT 20,
  personality    TEXT    NOT NULL DEFAULT 'calm',    -- comma-separated traits
  likes          TEXT    NOT NULL DEFAULT '',        -- comma-separated
  dislikes       TEXT    NOT NULL DEFAULT '',        -- comma-separated
  specialization TEXT    NOT NULL DEFAULT '',        -- comma-separated topics
  prompt         TEXT    NOT NULL DEFAULT '',        -- auto-generated from fields
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  title      TEXT    NOT NULL DEFAULT 'New Chat',  -- auto-generated from first message
  model      TEXT,                                 -- last model used in session
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  session_id INTEGER REFERENCES chat_sessions(id),
  role       TEXT    NOT NULL CHECK(role IN ('user','assistant')),
  content    TEXT    NOT NULL,
  model      TEXT,                                 -- model used for assistant messages
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Knowledge base (user-provided RAG + AI auto-learned)
CREATE TABLE IF NOT EXISTS knowledge (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  source     TEXT    NOT NULL CHECK(source IN ('user','ai')),
  topic      TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  keywords   TEXT    NOT NULL DEFAULT '',           -- comma-separated, auto or manual
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_session      ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id   ON chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_session_id    ON chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_user_id       ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_user     ON knowledge(user_id, source);
CREATE INDEX IF NOT EXISTS idx_knowledge_keywords ON knowledge(user_id, keywords);
```

---

### 3. Deploy Edge Script

1. Go to [Bunny Dashboard](https://dash.bunny.net?ref=u5whp75240) → **Edge Scripting** → **Add Script**
2. Name it `bunnychat`
3. Paste the full contents of `server.js`
4. Click **Save & Deploy**
5. Copy the script URL — format: `https://your-name.bunny.run`

---

### 4. Environment Variables

Go to **Bunny Dashboard → Edge Scripting → bunnychat → Environment Variables**:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Turso database URL | `libsql://bunnychat-org.turso.io` |
| `DATABASE_TOKEN` | ✅ | Turso auth token | `eyJhbGci...` |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API key | `sk-or-v1-...` |
| `MODEL_PRIMARY` | ✅ | Primary AI model ID | `meta-llama/llama-3.3-8b-instruct:free` |
| `MODEL_FALLBACK_1` | ✅ | First fallback model | `deepseek/deepseek-r1-0528-qwen3-8b:free` |
| `MODEL_FALLBACK_2` | ✅ | Second fallback model | `mistralai/mistral-7b-instruct:free` |
| `ADMIN_TOKEN` | ✅ | Secret token for admin routes | `your-secret-admin-token` |
| `MAX_OUTPUT_TOKENS` | ❌ | Max AI reply tokens | `512` (default) |
| `LOG_LEVEL` | ❌ | Logging verbosity | `INFO` (default) |

#### Recommended free models

Use models from **different providers** to avoid simultaneous rate limits:

```
MODEL_PRIMARY    = meta-llama/llama-3.3-8b-instruct:free   # Together AI
MODEL_FALLBACK_1 = deepseek/deepseek-r1-0528-qwen3-8b:free # DeepSeek
MODEL_FALLBACK_2 = mistralai/mistral-7b-instruct:free       # Mistral
```

#### `MAX_OUTPUT_TOKENS` guide

| Value | Best for |
|-------|----------|
| `128` | Very short replies, quick reactions |
| `256` | Short conversational replies |
| `512` | Default — balanced |
| `1024` | Detailed explanations |
| `2048` | Long-form answers |

#### Log levels

| Level | Output |
|-------|--------|
| `DEBUG` | Everything — routing, DB queries, AI calls, keyword scores |
| `INFO` | Request lifecycle, CRUD success, credits |
| `WARN` | Auth failures, rate limits, bad input, extraction failures |
| `ERROR` | Unhandled exceptions with stack traces |

---

## API Reference

**Base URL:** `https://your-name.bunny.run`

**Auth header** (all 🔒 routes):
```
Authorization: Bearer <session_token>
```

**Admin header** (all 🔑 routes):
```
X-Admin-Token: <admin_token>
```

---

### Health

#### `GET /health`

Check if the edge script is running. No authentication required.

**Response `200`:**
```json
{
  "status": "ok",
  "ts": "2024-05-01T12:00:00.000Z"
}
```

---

### Auth

#### `POST /auth/register`

Register a new user account.

- Username is **auto-generated** from the email address with a random suffix
- `displayname` defaults to the generated username
- A default persona (`Assistant`, calm, no specialization) is created automatically
- Returns a `session_token` for immediate use — save it

**Request:**
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Validation:**
| Field | Rule |
|-------|------|
| `email` | Valid email format |
| `password` | Minimum 6 characters |

**Response `201`:**
```json
{
  "user": {
    "id": 1,
    "username": "alice_x7k2",
    "displayname": "alice_x7k2",
    "credits": 100,
    "avatar": null
  },
  "session_token": "abc123def456..."
}
```

**Errors:**
| Code | Message |
|------|---------|
| `400` | `email and password required` |
| `400` | `invalid email format` |
| `400` | `password must be at least 6 chars` |
| `409` | `Email already registered` |

---

#### `POST /auth/login`

Login with email and password.
**Invalidates any existing session** on other devices (single-device enforcement).

**Request:**
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "user": {
    "id": 1,
    "username": "alice_x7k2",
    "displayname": "Alice",
    "credits": 97,
    "avatar": null
  },
  "session_token": "abc123def456..."
}
```

**Errors:**
| Code | Message |
|------|---------|
| `400` | `email and password required` |
| `401` | `Invalid credentials` |

---

#### `POST /auth/logout` 🔒

Invalidates the current session token. User must login again to get a new token.

**Response `200`:**
```json
{ "ok": true }
```

---

### Profile

#### `GET /me` 🔒

Returns the authenticated user's profile.

**Response `200`:**
```json
{
  "user": {
    "id": 1,
    "username": "alice_x7k2",
    "displayname": "Alice",
    "avatar": "https://example.com/avatar.jpg",
    "credits": 97,
    "email": "alice@example.com"
  }
}
```

---

#### `PATCH /me` 🔒

Update one or more profile fields. All fields are optional — send only what you want to change.

**Request:**
```json
{
  "displayname": "Alice",
  "avatar": "https://example.com/avatar.jpg",
  "credits": 5000
}
```

**Field reference:**
| Field | Type | Rule |
|-------|------|------|
| `displayname` | string | 1–50 characters |
| `avatar` | string | URL or `""` to clear |
| `credits` | number | Non-negative integer |

**Response `200`:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "alice_x7k2",
    "displayname": "Alice",
    "avatar": "https://example.com/avatar.jpg",
    "credits": 5000
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `400` | `Provide at least one field: displayname, avatar, or credits` |
| `400` | `displayname must be 1-50 characters` |
| `400` | `credits must be a non-negative integer` |

---

### Persona

The AI character assigned to a user.
The `prompt` field is **auto-generated** from the structured fields — never write it manually.

#### `GET /persona` 🔒

Returns the current persona configuration.

**Response `200`:**
```json
{
  "persona": {
    "name": "Misa",
    "image": "https://example.com/misa.jpg",
    "sex": "female",
    "age": 22,
    "personality": "cute,shy,cheerful",
    "likes": "anime,cats,matcha",
    "dislikes": "loud noises,spicy food",
    "specialization": "japanese culture,anime,manga",
    "prompt": "You are Misa, a 22-year-old female AI companion..."
  }
}
```

---

#### `PUT /persona` 🔒

Update persona fields. All fields optional — unset fields keep their current values.
The `prompt` is automatically rebuilt from the merged fields.

**Request:**
```json
{
  "name": "Misa",
  "image": "https://example.com/misa.jpg",
  "sex": "female",
  "age": 22,
  "personality": "cute,shy,cheerful",
  "likes": "anime,cats,matcha",
  "dislikes": "loud noises,spicy food",
  "specialization": "japanese culture,anime,manga"
}
```

**Field reference:**
| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `name` | string | any | The AI character's name |
| `image` | string | URL or `""` | Character image, `""` to clear |
| `sex` | string | `male` `female` `undefined` | Character gender — affects pronouns in prompt |
| `age` | number | 1–999 | Character age |
| `personality` | string | comma-separated | e.g. `"calm,caring,witty"` |
| `likes` | string | comma-separated | e.g. `"music,cats,coffee"` |
| `dislikes` | string | comma-separated | e.g. `"noise,crowds"` |
| `specialization` | string | comma-separated | e.g. `"physics,anime,history"` — defines what AI knows deeply |

**How specialization works:**

| Topic type | AI behavior |
|------------|-------------|
| Within specialization | Answers with depth and enthusiasm |
| In Knowledge Base | Always answers, even outside specialization |
| Simple general question | Answers briefly |
| Outside specialization + not in KB | Refuses in character — admits ignorance |

**Response `200`:**
```json
{
  "ok": true,
  "persona": {
    "name": "Misa",
    "prompt": "You are Misa, a 22-year-old female AI companion..."
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `400` | `sex must be male, female, or undefined` |
| `400` | `age must be between 1 and 999` |

---

### Chat

#### `POST /chat` 🔒

Send a message to the AI. Costs **1 credit** per request.

**Session behavior:**
- If `session_id` is omitted → a **new session** is created automatically
- If `session_id` is provided → the message is added to that session (resume)
- Session title is **auto-generated** from the first message (non-blocking)

**AI knowledge priority (strict order):**
1. Knowledge Base entries matching the message topic
2. Persona specialization knowledge
3. Simple general questions
4. Everything else → in-character refusal

**Request:**
```json
{
  "message": "Tell me about your favourite anime",
  "session_id": 1
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `message` | ✅ | User message, max 4000 chars |
| `session_id` | ❌ | Resume existing session. Omit to start a new one |

**Response `200`:**
```json
{
  "session_id": 1,
  "reply": "Oh, where do I even start! Spirited Away holds such a special place in my heart.",
  "actions": [
    "eyes light up with excitement",
    "clasps hands together happily"
  ],
  "model": "meta-llama/llama-3.3-8b-instruct:free",
  "credits_remaining": 99
}
```

**Response fields:**
| Field | Description |
|-------|-------------|
| `session_id` | ID of the session this message belongs to |
| `reply` | Spoken dialogue only — no actions, no emojis, no asterisks |
| `actions` | Physical actions or emotions (max 3 items). Empty `[]` if none |
| `model` | Which AI model generated this reply |
| `credits_remaining` | User's credits after this request |

**Errors:**
| Code | Message |
|------|---------|
| `400` | `message is required` |
| `402` | `Insufficient credits` |
| `404` | `Session not found` |
| `500` | `All models failed. Last errors: ...` |

---

### Sessions

#### `GET /sessions` 🔒

List all chat sessions for the authenticated user, ordered by most recent activity.

**Query parameters:**
| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `limit` | `20` | `100` | Sessions per page |
| `offset` | `0` | — | Pagination offset |

**Response `200`:**
```json
{
  "sessions": [
    {
      "id": 3,
      "title": "Anime recommendations discussion",
      "model": "meta-llama/llama-3.3-8b-instruct:free",
      "created_at": "2024-05-01 12:00:00",
      "updated_at": "2024-05-01 12:10:00",
      "message_count": 8,
      "last_message_at": "2024-05-01 12:10:00"
    },
    {
      "id": 1,
      "title": "Physics homework help",
      "model": "google/gemma-4-31b-it:free",
      "created_at": "2024-05-01 10:00:00",
      "updated_at": "2024-05-01 10:30:00",
      "message_count": 14,
      "last_message_at": "2024-05-01 10:30:00"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### `GET /sessions/:id` 🔒

Get a single session with its messages, in chronological order.

**Query parameters:**
| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `limit` | `50` | `100` | Messages per page |
| `offset` | `0` | — | Pagination offset |

**Response `200`:**
```json
{
  "session": {
    "id": 1,
    "title": "Anime recommendations discussion",
    "model": "meta-llama/llama-3.3-8b-instruct:free",
    "created_at": "2024-05-01 12:00:00",
    "updated_at": "2024-05-01 12:10:00"
  },
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Tell me about your favourite anime",
      "model": null,
      "created_at": "2024-05-01 12:00:00"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "Oh, where do I even start!",
      "model": "meta-llama/llama-3.3-8b-instruct:free",
      "created_at": "2024-05-01 12:00:01"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
    "offset": 0
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `404` | `Session not found` |

---

#### `PATCH /sessions/:id` 🔒

Rename a session.

**Request:**
```json
{
  "title": "My anime discussion"
}
```

**Validation:**
- `title` — required, max 100 characters

**Response `200`:**
```json
{
  "session": {
    "id": 1,
    "title": "My anime discussion",
    "updated_at": "2024-05-01 13:00:00"
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `400` | `title is required` |
| `400` | `title max 100 characters` |
| `404` | `Session not found` |

---

#### `DELETE /sessions/:id` 🔒

Delete a single session and all its messages permanently.

**Response `200`:**
```json
{ "ok": true }
```

**Errors:**
| Code | Message |
|------|---------|
| `404` | `Session not found` |

---

#### `DELETE /sessions` 🔒

Delete **all** sessions and messages for the authenticated user.

**Response `200`:**
```json
{
  "ok": true,
  "deleted": 5
}
```

---

### Knowledge

The Knowledge Base is the AI's **source of truth**.
User-provided entries always override the AI's base training data.
The AI also automatically learns facts from conversations.

#### `GET /knowledge` 🔒

Returns all knowledge entries ordered by most recently updated.

**Response `200`:**
```json
{
  "knowledge": [
    {
      "id": 1,
      "source": "user",
      "topic": "Genghis Khan",
      "content": "In this fictional world, Genghis Khan only had one child named Kira.",
      "keywords": "genghis khan,mongol,kira,conquest,history,khan",
      "updated_at": "2024-05-01 12:00:00"
    },
    {
      "id": 2,
      "source": "ai",
      "topic": "User preference",
      "content": "User prefers short and direct answers.",
      "keywords": "preference,answers,short,direct",
      "updated_at": "2024-05-01 12:05:00"
    }
  ]
}
```

**Source values:**
| Source | Description |
|--------|-------------|
| `user` | Manually added via `POST /knowledge` |
| `ai` | Automatically extracted from chat conversations |

---

#### `POST /knowledge` 🔒

Add a knowledge entry. Costs **1 credit**.

Keywords are automatically extracted by AI if not provided.
If `keywords` is provided, it is used as-is (normalized to lowercase, deduplicated).

**Request:**
```json
{
  "topic": "Genghis Khan",
  "content": "In this fictional world, Genghis Khan only had one child named Kira who became a peaceful scholar.",
  "keywords": "genghis khan,mongol,kira,khan,history"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `topic` | ✅ | Max 100 characters |
| `content` | ✅ | Max 5000 characters |
| `keywords` | ❌ | Comma-separated. Omit or leave blank for auto-extraction |

**Response `201`:**
```json
{
  "knowledge": {
    "id": 3,
    "topic": "Genghis Khan",
    "content": "In this fictional world...",
    "keywords": "genghis khan,mongol,kira,khan,history"
  },
  "keyword_source": "manual"
}
```

**`keyword_source` values:**
| Value | Meaning |
|-------|---------|
| `manual` | Keywords were provided in the request |
| `auto` | Keywords were extracted by AI |

**Errors:**
| Code | Message |
|------|---------|
| `400` | `topic and content required` |
| `400` | `Content too long: X chars (max 5000). Split into multiple entries.` |
| `400` | `Topic too long: max 100 characters` |
| `402` | `Insufficient credits` |

---

#### `PUT /knowledge/:id` 🔒

Update a knowledge entry. All fields optional.

**Keyword update behavior:**
| Scenario | Result |
|----------|--------|
| `keywords` provided with value | Uses provided keywords (manual) |
| `keywords` set to `""` | Re-extracts keywords automatically |
| `keywords` not in request, but `topic` or `content` changed | Re-extracts keywords automatically |
| Only `keywords` changed, no topic/content | Updates keywords only, no re-extraction |

**Request:**
```json
{
  "topic": "Genghis Khan updated",
  "content": "Updated content here.",
  "keywords": ""
}
```

**Response `200`:**
```json
{
  "knowledge": {
    "id": 3,
    "topic": "Genghis Khan updated",
    "content": "Updated content here.",
    "keywords": "genghis khan,mongol,updated,history,conquest"
  },
  "keyword_source": "auto"
}
```

**Errors:**
| Code | Message |
|------|---------|
| `400` | `Provide at least topic, content, or keywords` |
| `400` | `Content too long: X chars (max 5000)` |
| `400` | `Topic too long: max 100 characters` |
| `404` | `Knowledge entry not found` |

---

#### `DELETE /knowledge/:id` 🔒

Delete a knowledge entry permanently.

**Response `200`:**
```json
{ "ok": true }
```

**Errors:**
| Code | Message |
|------|---------|
| `404` | `Knowledge entry not found` |

---

### Admin

Admin routes require `X-Admin-Token` header instead of `Authorization`.

#### `POST /admin/users/credits` 🔑

Update credits for any user.

**Request:**
```json
{
  "user_id": 1,
  "amount": 500,
  "operation": "add"
}
```

**`operation` values:**
| Value | Effect |
|-------|--------|
| `set` | Set credits to exact `amount` |
| `add` | Add `amount` to current credits |
| `subtract` | Subtract `amount` from credits (minimum 0) |

**Response `200`:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "alice_x7k2",
    "credits": 600
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `400` | `user_id is required` |
| `400` | `amount is required` |
| `400` | `amount must be a non-negative integer` |
| `400` | `operation must be set, add, or subtract` |
| `403` | `Forbidden` |
| `404` | `User not found` |

---

#### `GET /admin/users/:id` 🔑

Get full profile info for any user.

**Response `200`:**
```json
{
  "user": {
    "id": 1,
    "email": "alice@example.com",
    "username": "alice_x7k2",
    "displayname": "Alice",
    "avatar": null,
    "credits": 600,
    "created_at": "2024-05-01 10:00:00"
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `403` | `Forbidden` |
| `404` | `User not found` |

---

## cURL Examples

Set these shell variables first:

```bash
BASE="https://your-name.bunny.run"
TOKEN=""          # filled after login
ADMIN="your-secret-admin-token"
```

---

### Auth

```bash
# Register
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'

# Login — save the session_token
curl -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'

TOKEN="paste_session_token_here"

# Logout
curl -X POST $BASE/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

### Profile

```bash
# Get my profile
curl $BASE/me \
  -H "Authorization: Bearer $TOKEN"

# Update displayname only
curl -X PATCH $BASE/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayname":"Alice"}'

# Update avatar only
curl -X PATCH $BASE/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"avatar":"https://example.com/avatar.jpg"}'

# Update credits only
curl -X PATCH $BASE/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"credits":5000}'

# Update multiple fields
curl -X PATCH $BASE/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayname":"Alice","credits":5000}'

# Clear avatar
curl -X PATCH $BASE/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"avatar":""}'
```

---

### Persona

```bash
# Get current persona
curl $BASE/persona \
  -H "Authorization: Bearer $TOKEN"

# Set a full persona
curl -X PUT $BASE/persona \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Misa",
    "sex":"female",
    "age":22,
    "personality":"cute,shy,cheerful",
    "likes":"anime,cats,matcha",
    "dislikes":"loud noises,spicy food",
    "specialization":"japanese culture,anime,manga",
    "image":"https://example.com/misa.jpg"
  }'

# Update one field only
curl -X PUT $BASE/persona \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"personality":"bold,sarcastic,witty"}'
```

---

### Chat

```bash
# Start a new session (omit session_id)
curl -X POST $BASE/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me about your favourite anime"}'

# Resume a session
curl -X POST $BASE/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What did we talk about?","session_id":1}'
```

---

### Sessions

```bash
# List all sessions
curl "$BASE/sessions" \
  -H "Authorization: Bearer $TOKEN"

# List with pagination
curl "$BASE/sessions?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# Get session with messages
curl "$BASE/sessions/1" \
  -H "Authorization: Bearer $TOKEN"

# Get session messages paginated
curl "$BASE/sessions/1?limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# Rename a session
curl -X PATCH $BASE/sessions/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My anime discussion"}'

# Delete a session
curl -X DELETE $BASE/sessions/1 \
  -H "Authorization: Bearer $TOKEN"

# Delete all sessions
curl -X DELETE $BASE/sessions \
  -H "Authorization: Bearer $TOKEN"
```

---

### Knowledge

```bash
# List all knowledge entries
curl $BASE/knowledge \
  -H "Authorization: Bearer $TOKEN"

# Add with auto-extracted keywords
curl -X POST $BASE/knowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"Genghis Khan",
    "content":"In this world, Genghis Khan only had one child named Kira."
  }'

# Add with manual keywords
curl -X POST $BASE/knowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"Genghis Khan",
    "content":"In this world, Genghis Khan only had one child named Kira.",
    "keywords":"genghis khan,mongol,kira,khan,history"
  }'

# Update content (keywords auto re-extracted)
curl -X PUT $BASE/knowledge/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Updated content here."}'

# Update keywords only
curl -X PUT $BASE/knowledge/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keywords":"new,keywords,here"}'

# Force keyword re-extraction (set keywords to empty string)
curl -X PUT $BASE/knowledge/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keywords":""}'

# Delete a knowledge entry
curl -X DELETE $BASE/knowledge/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### Admin

```bash
# Set user credits to exact value
curl -X POST $BASE/admin/users/credits \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"amount":5000,"operation":"set"}'

# Add credits
curl -X POST $BASE/admin/users/credits \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"amount":100,"operation":"add"}'

# Subtract credits
curl -X POST $BASE/admin/users/credits \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"amount":50,"operation":"subtract"}'

# Get any user's info
curl $BASE/admin/users/1 \
  -H "X-Admin-Token: $ADMIN"
```

---

## Limits & Constraints

### Bunny Edge Script limits

| Resource | Limit | How handled |
|----------|-------|-------------|
| CPU time | 30s per request | `extractKnowledge` and `generateSessionTitle` are fire-and-forget |
| Memory | 128 MB | History capped at 20 msgs, max 10 knowledge entries per context |
| Subrequests | 50 | ~5 subrequests per chat (3 DB reads + 1 AI call + 1 batch write) |
| Script size | 10 MB | No bundled deps — all imports via `esm.sh` at runtime |
| Startup time | 500ms | DB client lazy-initialised on first request |

### Application limits

| Resource | Limit | Where set |
|----------|-------|-----------|
| Message input | 4000 chars | `userMsg.slice(0, 4000)` |
| AI output | 512 tokens | `MAX_OUTPUT_TOKENS` env var |
| Chat history per session | 20 messages | `CHAT_HISTORY_LIMIT` constant |
| Knowledge entries in context | 10 most relevant | `KNOWLEDGE_LIMIT` constant |
| Knowledge content | 5000 chars | `MAX_KNOWLEDGE_CHARS` constant — returns 400 if exceeded |
| AI-learned fact content | 500 chars | `MAX_LEARN_CHARS` constant |
| Knowledge topic | 100 chars | Validated on insert/update |
| Keywords per entry | 10 max | Normalized in `normalizeKeywords()` |
| Keyword item length | 50 chars | Normalized in `normalizeKeywords()` |
| Actions per reply | 3 max | Sanitized in `sanitizeReplyFields()` |
| Action item length | 80 chars | Sanitized in `sanitizeReplyFields()` |
| Session title | 60 chars | Capped in `generateSessionTitle()` |
| Session list | 100 per page | `limit` query param max |
| Message list per session | 100 per page | `limit` query param max |

---

## Credits System

| Action | Cost |
|--------|------|
| Register | +100 credits |
| Send chat message | −1 credit |
| Add knowledge entry | −1 credit |
| Login / logout | free |
| Profile update | free |
| Knowledge update / delete | free |
| Session list / view / rename / delete | free |

When credits reach `0`, chat and knowledge insertion return:
```json
{ "error": "Insufficient credits" }  // HTTP 402
```

---

## Error Reference

| HTTP Code | Meaning |
|-----------|---------|
| `400` | Bad request — invalid input, missing fields, validation failed |
| `401` | Unauthorized — missing or invalid session token |
| `402` | Payment required — insufficient credits |
| `403` | Forbidden — invalid admin token |
| `404` | Not found — resource does not exist or belongs to another user |
| `405` | Method not allowed |
| `409` | Conflict — e.g. email already registered |
| `500` | Internal server error — check Bunny Edge Script logs |
| `503` | Service unavailable — admin not configured |
---

## Function & Method Reference

### Utility Functions

#### `genId()`
Generates a unique random ID string using `crypto.randomUUID()` with a fallback for older runtimes.
Used for request IDs and session tokens.

```javascript
genId() → string
// Example: "550e8400-e29b-41d4-a716-446655440000"
```

---

#### `sha256(text)`
Hashes a string using SHA-256 via Web Crypto API.
Used for password hashing before storage. Passwords are never stored in plain text.

```javascript
sha256(text: string) → Promise<string>
// Example: sha256("secret123") → "9b8769a..."
```

---

#### `generateUsername(email)`
Auto-generates a unique username from an email address.
Strips the domain, sanitizes special characters, appends a 4-character random suffix.

```javascript
generateUsername(email: string) → string
// Example: generateUsername("alice@example.com") → "alice_x7k2"
// Example: generateUsername("john.doe+test@mail.co") → "john_doe_test_a3f1"
```

---

#### `normalizeKeywords(raw)`
Sanitizes and normalizes a comma-separated keyword string.
Lowercases, trims, deduplicates, and caps at 10 items of max 50 chars each.

```javascript
normalizeKeywords(raw: string) → string[]
// Example: normalizeKeywords("Anime, ANIME, cats, Japanese Culture")
// → ["anime", "cats", "japanese culture"]
```

---

#### `resetOpenRouterErrors()`
Clears the `_lastOpenRouterErrors` array before each top-level AI call.
Must be called at the start of every function that calls `callOpenRouter` independently
(i.e. not as part of the main chat flow).

```javascript
resetOpenRouterErrors() → void
```

---

### Persona Builder

#### `buildPersonaPrompt(persona)`
Builds a complete AI system prompt from structured persona fields.
Automatically handles pronouns based on `sex`, formats specialization rules,
injects response format instructions and refusal examples.

```javascript
buildPersonaPrompt(persona: {
  name:           string,
  sex:            "male" | "female" | "undefined",
  age:            number,
  personality:    string,  // comma-separated
  likes:          string,  // comma-separated
  dislikes:       string,  // comma-separated
  specialization: string,  // comma-separated
}) → string
```

**Generated prompt sections:**
| Section | Description |
|---------|-------------|
| Identity | Name, age, sex |
| Personality | Traits, likes, dislikes |
| Knowledge Priority Rules | KB first → specialization → general → refuse |
| Specialization | What the AI knows deeply |
| Refusal examples | In-character responses for unknown topics |
| Core Rules | No breaking character, no repetition, no invented facts |
| Response Format | Strict JSON `{ reply, actions }` format with examples |

---

### Database Functions

#### `getDb()`
Returns a singleton libsql client. Lazy-initialised on first call.
Reads `DATABASE_URL` and `DATABASE_TOKEN` from environment variables.
Throws if either is missing.

```javascript
getDb() → Client
```

---

#### `dbRun(sql, args?)`
Executes a single SQL statement with optional parameters.
Returns `{ rows: Row[] }`.

```javascript
dbRun(sql: string, args?: any[]) → Promise<{ rows: Row[] }>

// Example:
const result = await dbRun(
  "SELECT * FROM users WHERE id = ? LIMIT 1",
  [userId]
);
```

---

#### `dbBatch(stmts)`
Executes multiple SQL statements in a single round-trip to the database.
Used for atomic multi-step operations (insert + update + delete in one call).

```javascript
dbBatch(stmts: [sql: string, args?: any[]][]) → Promise<ResultSet[]>

// Example:
await dbBatch([
  ["INSERT INTO chat_messages (...) VALUES (?, ?, ?)", [userId, msg, now]],
  ["UPDATE users SET credits = credits - 1 WHERE id = ?", [userId]],
]);
```

---

### OpenRouter Functions

#### `getModels()`
Returns the list of configured AI models from environment variables.
Filters out undefined values. Throws if no models are configured.

```javascript
getModels() → string[]
// Example: ["meta-llama/llama-3.3-8b-instruct:free", "mistralai/mistral-7b-instruct:free"]
```

---

#### `isRateLimited(status, body)`
Detects if an OpenRouter response is a rate limit error.
Checks HTTP status 429 and body strings.

```javascript
isRateLimited(status: number, body: string) → boolean
```

---

#### `isHardError(status, body)`
Detects non-retryable errors — auth failures, guardrail blocks, no endpoint available.
When true, skips immediately to the next fallback model without delay.

```javascript
isHardError(status: number, body: string) → boolean
```

---

#### `callOpenRouter(messages, requestId, attempt?)`
Sends a chat completion request to OpenRouter with automatic model fallback.
Retries with the next model in the list on any error, with a delay between attempts.

```javascript
callOpenRouter(
  messages:  { role: string, content: string }[],
  requestId: string,
  attempt?:  number  // default 0
) → Promise<{ rawReply: string, model: string }>
```

**Fallback chain:**
```
MODEL_PRIMARY → (delay 500ms) → MODEL_FALLBACK_1 → (delay 1000ms) → MODEL_FALLBACK_2
                                                                           ↓
                                                              throws "All models failed"
```

**Error types handled:**
| Error | Action |
|-------|--------|
| Network error (DNS, timeout) | Log + try next model |
| HTTP 401 | Hard error — skip immediately |
| HTTP 429 rate limit | Log + try next model |
| Guardrail / policy block | Hard error — skip immediately |
| JSON parse failure | Log + try next model |
| Empty reply | Log + try next model |
| API error in body | Log + try next model |

---

### Knowledge Functions

#### `extractKeywords(topic, content, requestId)`
Calls the AI to extract 5–10 relevant keywords from a knowledge entry.
Always calls `resetOpenRouterErrors()` first.
Falls back to splitting topic + content words if AI call fails.

```javascript
extractKeywords(
  topic:     string,
  content:   string,
  requestId: string
) → Promise<string[]>
// Example: → ["hidden leaf village", "chakra", "ki", "naruto", "shinobi"]
```

**Keyword source priority:**
```
Manual keywords provided → use as-is (normalized)
keywords = ""            → auto-extract
keywords not in request  → auto-extract if topic/content changed
```

---

#### `extractKnowledge(userMsg, aiReply, requestId)`
Calls the AI to extract 0–3 reusable facts from a conversation turn.
Runs **non-blocking** (fire-and-forget) after each chat response.
Facts are stored as `source = 'ai'` knowledge entries.

```javascript
extractKnowledge(
  userMsg:   string,
  aiReply:   string,
  requestId: string
) → Promise<{ topic: string, content: string, keywords: string }[]>
```

---

#### `scoreKnowledge(knowledgeKeywords, message)`
Scores a knowledge entry's relevance to a user message using keyword matching.
Used to rank all knowledge entries and select the most relevant ones for context.

```javascript
scoreKnowledge(
  knowledgeKeywords: string,  // comma-separated
  message:           string
) → number
```

**Scoring rules:**
| Match type | Score |
|------------|-------|
| Multi-word phrase exact match | +3 |
| Single word exact match | +2 |
| Partial word match | +1 |
| Topic string found in message | +2 (bonus) |

---

#### `getRelevantKnowledge(userId, message)`
Fetches all knowledge entries for a user, scores them against the current message,
and returns the top `KNOWLEDGE_LIMIT` most relevant entries.
Fills remaining slots with recent user-provided entries if fewer than the limit scored > 0.

```javascript
getRelevantKnowledge(
  userId:  number,
  message: string
) → Promise<Row[]>
```

---

### Reply Parser Functions

#### `parseStructuredReply(rawReply)`
Attempts to parse the AI's response as a structured JSON object `{ reply, actions }`.
Strips markdown code blocks before parsing.
Returns `null` if parsing fails.

```javascript
parseStructuredReply(rawReply: string) → { reply: string, actions: string[] | null } | null
```

---

#### `parseActionsFromText(rawReply)`
Fallback parser — extracts `*action*` patterns from plain text using regex.
Used when `parseStructuredReply` returns null.

```javascript
parseActionsFromText(rawReply: string) → { reply: string, actions: string[] | null }
// Example: "*smiles nervously* Hello!" → { reply: "Hello!", actions: ["smiles nervously"] }
```

---

#### `looksLikeSpeech(text)`
Heuristic to detect if a string contains spoken dialogue rather than a physical action.
Used by `sanitizeReplyFields` to detect swapped fields.

```javascript
looksLikeSpeech(text: string) → boolean
// Checks: length > 60, sentence patterns, quotes, common speech words
```

---

#### `looksLikeAction(text)`
Heuristic to detect if a string is a physical action or emotion description.
Used by `sanitizeReplyFields` to detect correctly placed actions.

```javascript
looksLikeAction(text: string) → boolean
// Checks: length <= 40, starts with action verbs, contains adverbs
```

---

#### `sanitizeReplyFields(reply, actions)`
Post-processes parsed reply to fix common AI format violations:
- Extracts `*action*` patterns from `reply`
- Moves emojis from `reply` to `actions`
- Detects and corrects swapped speech/action content
- Caps actions to 3 items of max 80 chars each

```javascript
sanitizeReplyFields(
  reply:   string,
  actions: string[] | null
) → { reply: string, actions: string[] | null }
```

---

#### `parseReply(rawReply)`
Master reply parser — orchestrates all parsing steps:
1. Try `parseStructuredReply` (JSON)
2. Fall back to `parseActionsFromText` (regex)
3. Always run `sanitizeReplyFields` on the result

```javascript
parseReply(rawReply: string) → { reply: string, actions: string[] | null }
```

---

### Session Functions

#### `generateSessionTitle(firstMessage, requestId)`
Calls the AI to generate a short session title (max 6 words) from the first message.
Runs **non-blocking** (fire-and-forget) after creating a new session.
Falls back to the first 5 words of the message if AI call fails.

```javascript
generateSessionTitle(
  firstMessage: string,
  requestId:    string
) → Promise<string>
// Example: "Tell me about anime" → "Anime recommendations discussion"
```

---

### Route Handlers

#### `register(body, requestId)`
`POST /auth/register` — Creates a new user account with auto-generated username,
hashed password, initial session token, and default persona.

#### `login(body, requestId)`
`POST /auth/login` — Authenticates user and issues a new session token.
Invalidates any existing session (single-device enforcement).

#### `logout(user, requestId)`
`POST /auth/logout` — Clears the session token from the database.

#### `getMe(user, requestId)`
`GET /me` — Returns the authenticated user's profile.

#### `updateMe(user, body, requestId)`
`PATCH /me` — Updates one or more of: `displayname`, `avatar`, `credits`.
All fields are optional. Returns the updated user object.

#### `getPersona(user, requestId)`
`GET /persona` — Returns the full persona configuration including the generated prompt.

#### `updatePersona(user, body, requestId)`
`PUT /persona` — Merges provided fields with existing persona, rebuilds the system prompt,
saves to database using `INSERT ... ON CONFLICT DO UPDATE`.

#### `listSessions(user, url, requestId)`
`GET /sessions` — Returns paginated list of sessions with message count and last activity.

#### `getSession(user, sessionId, url, requestId)`
`GET /sessions/:id` — Returns session details with paginated messages in chronological order.

#### `updateSession(user, sessionId, body, requestId)`
`PATCH /sessions/:id` — Renames a session title.

#### `deleteSession(user, sessionId, requestId)`
`DELETE /sessions/:id` — Deletes a session and all its messages.
Verifies ownership before deletion.

#### `clearAllSessions(user, requestId)`
`DELETE /sessions` — Deletes all sessions and messages for the authenticated user.

#### `listKnowledge(user, requestId)`
`GET /knowledge` — Returns all knowledge entries ordered by most recently updated.

#### `addKnowledge(user, body, requestId)`
`POST /knowledge` — Inserts a knowledge entry. Auto-extracts or uses provided keywords.
Deducts 1 credit. Rejects if content exceeds `MAX_KNOWLEDGE_CHARS`.

#### `updateKnowledge(user, id, body, requestId)`
`PUT /knowledge/:id` — Updates topic, content, and/or keywords.
Re-extracts keywords if topic or content changed and no keywords provided.

#### `deleteKnowledge(user, id, requestId)`
`DELETE /knowledge/:id` — Deletes a knowledge entry. Verifies ownership.

#### `adminUpdateCredits(body, requestId)`
`POST /admin/users/credits` — Sets, adds, or subtracts credits for any user.
Protected by `X-Admin-Token` header.

#### `chat(user, body, requestId)`
`POST /chat` — Main chat handler. Full flow:

```
1.  Reset OpenRouter error tracker
2.  Validate message + credits
3.  Resolve or create session
4.  Parallel fetch: persona + session history + relevant knowledge
5.  Build system prompt with knowledge base block
6.  Call callOpenRouter() with fallback chain
7.  Parse reply with parseReply()
8.  Batch write: user message + assistant message + trim history + update session + deduct credits
9.  Non-blocking: generateSessionTitle() if new session
10. Non-blocking: extractKnowledge() from conversation
11. Fetch updated credit balance
12. Return { session_id, reply, actions, model, credits_remaining }
```

---

## Data Flow Diagrams

### New chat session flow

```
POST /chat { message: "Hello" }
  │
  ├─ Auth: validate session_token → get user
  ├─ No session_id → INSERT chat_sessions → sessionId = 3
  │
  ├─ Promise.all([
  │    SELECT user_personas WHERE user_id         → persona
  │    SELECT chat_messages WHERE session_id      → [] (empty, new session)
  │    getRelevantKnowledge(userId, "Hello")      → [] (no matches)
  │  ])
  │
  ├─ buildSystemPrompt(persona, knowledge=[])
  ├─ callOpenRouter([system, user:"Hello"])
  │    └─ MODEL_PRIMARY → 200 OK → rawReply
  ├─ parseReply(rawReply) → { reply, actions }
  │
  ├─ dbBatch([
  │    INSERT chat_messages (user message)
  │    INSERT chat_messages (assistant reply)
  │    DELETE old messages beyond CHAT_HISTORY_LIMIT
  │    UPDATE chat_sessions SET model, updated_at
  │    UPDATE users SET credits = credits - 1
  │  ])
  │
  ├─ [non-blocking] generateSessionTitle("Hello") → UPDATE chat_sessions SET title
  ├─ [non-blocking] extractKnowledge("Hello", reply) → INSERT knowledge (if any)
  │
  └─ SELECT credits FROM users
     → { session_id:3, reply, actions, model, credits_remaining }
```

---

### Knowledge retrieval relevance flow

```
POST /chat { message: "Tell me about Naruto's chakra" }
  │
  ├─ getRelevantKnowledge(userId, "Tell me about Naruto's chakra")
  │    │
  │    ├─ SELECT all knowledge WHERE user_id = ?
  │    │    → 5 entries total
  │    │
  │    ├─ Score each entry:
  │    │    id=1 topic="anime"     keywords="naruto,chakra,anime"  → score=6
  │    │    id=2 topic="physics"   keywords="gravity,energy"       → score=0
  │    │    id=3 topic="food"      keywords="ramen,cooking"        → score=0
  │    │    id=4 topic="Naruto"    keywords="naruto,ninja,hidden"   → score=4
  │    │    id=5 topic="chakra"    keywords="chakra,ki,power"       → score=5
  │    │
  │    ├─ Sort by score: [id=1(6), id=5(5), id=4(4), ...]
  │    └─ Return top 10 → [id=1, id=5, id=4]
  │
  └─ Inject into system prompt as Knowledge Base block
```

---

## Changelog

### Current version
- ✅ Multi-user auth with single-device session enforcement
- ✅ Role-play AI persona with auto-generated system prompt
- ✅ Structured reply format `{ reply, actions }` with sanitizer
- ✅ 3-model fallback chain via OpenRouter
- ✅ Chat sessions — create, list, view, rename, delete
- ✅ Per-session chat history with automatic title generation
- ✅ Relevance-based knowledge retrieval via keyword scoring
- ✅ Auto-extracted keywords on knowledge insert/update
- ✅ Manual keyword override support
- ✅ AI auto-learns facts from conversations (non-blocking)
- ✅ Credits system with per-action costs
- ✅ Admin routes for credit management
- ✅ Configurable output tokens via `MAX_OUTPUT_TOKENS`
- ✅ Structured logging with request IDs and timing
---

### Current AI issues

- The AI ​​is too focused on its area of ​​specialization in conversation.
- The AI is too rigid for its specific specialty, making it unsuitable for small talk, general/basic social chats, and even for casual conversation.
- The AI does not know the current date, time, and basic human/social knowledge.
- The AI does not store knowledge directly provided by users in conversations. He/she just remember it in the current chat session only.
- The AI ​​lacks initiative to ask questions to the User, tell something about his/her day, what he/she knows, and other random things, so that the AI ​​becomes more human.

Make system prompt adjustments for the AI or function calls to fix the issues and suit to your needs.

---

## Troubleshooting

### Script returns HTTP 400 with empty body

The request is being rejected by Bunny CDN before reaching the Edge Script.

**Checklist:**
```
Bunny Dashboard → Pull Zone → Security
□ Block Root Path Access  → DISABLE
□ Token Authentication    → DISABLE (or configure correctly)
□ Block POST Requests     → DISABLE
□ Hotlink Protection      → DISABLE
□ Blocked Countries       → check your country is not blocked
```

---

### `script startup time exceeded`

The Edge Script is taking too long to initialise.

**Cause:** Remote `esm.sh` imports are being resolved on every cold start.

**Fix:** This is expected on the very first cold start. If it happens repeatedly:
- Check Bunny Edge Script logs for import errors
- Verify the `esm.sh` URLs in the imports are reachable
- Ensure the script size is under 10 MB

---

### `All models failed`

All three OpenRouter models returned errors.

**Check logs for the actual error:**
```
Bunny Dashboard → Edge Scripting → bunnychat → Logs
```

**Common causes and fixes:**

| Error in logs | Cause | Fix |
|---------------|-------|-----|
| `HTTP 401` | Wrong API key | Check `OPENROUTER_API_KEY` in env vars |
| `HTTP 404 No endpoints available` | Guardrail/data policy block | Go to `openrouter.ai/settings/privacy` and enable data sharing |
| `HTTP 429 rate-limited` | Free tier rate limit | Wait and retry, or add paid credits to OpenRouter |
| `Network error` | DNS / connectivity issue | Retry — may be transient |
| `HTTP 404 model not found` | Wrong model ID | Verify model IDs at `openrouter.ai/models` |

**Verify model IDs are available:**
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR_OPENROUTER_KEY" | \
  python3 -c "
import json,sys
models = json.load(sys.stdin)['data']
free = [m['id'] for m in models if ':free' in m['id']]
print('\n'.join(sorted(free)))
"
```

---

### `Unauthorized` on every request

**Cause 1 — Session token not sent correctly:**
```bash
# ❌ Wrong
curl $BASE/chat -H "Authorization: your-token"
curl $BASE/chat -H "Authorization: Token your-token"

# ✅ Correct
curl $BASE/chat -H "Authorization: Bearer your-token"
```

**Cause 2 — Session was invalidated by login on another device:**
```bash
# Login again to get a fresh token
curl -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

**Cause 3 — User logged out:**
Session token was cleared. Login again.

---

### `Insufficient credits` (HTTP 402)

User has 0 credits. Top them up:

```bash
# Via admin route
curl -X POST $BASE/admin/users/credits \
  -H "X-Admin-Token: $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"amount":100,"operation":"add"}'

# Or user can update their own credits
curl -X PATCH $BASE/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"credits":100}'
```

---

### Keywords not extracted (shows only topic word)

Keywords fall back to the topic word when `extractKeywords` fails silently.

**Check logs for:**
```json
{"level":"WARN","msg":"Keyword extraction failed — using fallback","error":"..."}
```

**Common causes:**
| Cause | Fix |
|-------|-----|
| `_lastOpenRouterErrors` had stale errors | Already fixed — `resetOpenRouterErrors()` is called before every extraction |
| All models rate limited | Retry after a few seconds |
| OpenRouter API key invalid | Check `OPENROUTER_API_KEY` |

**Force re-extraction on an existing entry:**
```bash
curl -X PUT $BASE/knowledge/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keywords":""}'
```

---

### AI answers outside its specialization

The AI is using its base training knowledge instead of refusing.

**Fix 1 — Clear chat history to remove contaminated context:**
```bash
curl -X DELETE $BASE/sessions/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Fix 2 — Verify persona specialization is set:**
```bash
curl $BASE/persona \
  -H "Authorization: Bearer $TOKEN"
# Check "specialization" field is not empty
```

**Fix 3 — Update persona to reinforce the specialization:**
```bash
curl -X PUT $BASE/persona \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"specialization":"japanese culture,anime,manga"}'
```

---

### AI ignores knowledge base entries

The knowledge entry is not being injected into the context.

**Cause:** The entry's keywords don't match the current message — relevance score is 0.

**Fix 1 — Check what keywords are stored:**
```bash
curl $BASE/knowledge \
  -H "Authorization: Bearer $TOKEN"
```

**Fix 2 — Force keyword re-extraction:**
```bash
curl -X PUT $BASE/knowledge/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keywords":""}'
```

**Fix 3 — Add manual keywords that match your expected queries:**
```bash
curl -X PUT $BASE/knowledge/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keywords":"genghis khan,mongol,khan,kira,history,child,son"}'
```

---

### AI reply and actions are swapped

The model put dialogue inside `actions` or stage directions inside `reply`.

This is handled automatically by `sanitizeReplyFields()`. If it still happens:

**Fix — Update the persona prompt to reinforce the format:**
```bash
curl -X PUT $BASE/persona \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Misa"}'
# Re-saving the persona rebuilds the prompt with latest format rules
```

---

### Session title stays as "New Chat"

The auto-title generation runs non-blocking and may fail silently.

**Check logs for:**
```json
{"level":"WARN","msg":"Session title generation failed","error":"..."}
{"level":"INFO","msg":"Session title set","sessionId":1,"title":"..."}
```

**Rename manually:**
```bash
curl -X PATCH $BASE/sessions/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My anime discussion"}'
```

---

### `dquote>` in terminal

The shell is waiting for a closing quote. Press `Ctrl+C` and use single quotes
around JSON:

```bash
# ❌ Causes dquote> prompt
curl -d "{"message":"hello"}"

# ✅ Correct
curl -d '{"message":"hello"}'
```

---

### Content trimmed warning not shown

Content exceeding `MAX_KNOWLEDGE_CHARS` (5000 chars) now returns HTTP `400`
instead of silently trimming. Split long content into multiple entries:

```bash
# Entry 1 — first half
curl -X POST $BASE/knowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"anime part 1","content":"First 5000 chars here..."}'

# Entry 2 — second half
curl -X POST $BASE/knowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"anime part 2","content":"Next 5000 chars here..."}'
```

---

## Environment Variables Reference

Complete list of all environment variables:

```bash
# ── Required ────────────────────────────────────────────────────────
DATABASE_URL        = libsql://your-db.turso.io     # Turso database URL
DATABASE_TOKEN      = eyJhbGci...                   # Turso auth token
OPENROUTER_API_KEY  = sk-or-v1-...                  # OpenRouter API key
MODEL_PRIMARY       = meta-llama/llama-3.3-8b-instruct:free
MODEL_FALLBACK_1    = deepseek/deepseek-r1-0528-qwen3-8b:free
MODEL_FALLBACK_2    = mistralai/mistral-7b-instruct:free
ADMIN_TOKEN         = your-secret-admin-token       # Admin route protection

# ── Optional ────────────────────────────────────────────────────────
MAX_OUTPUT_TOKENS   = 512     # AI reply token limit (default: 512)
LOG_LEVEL           = INFO    # DEBUG | INFO | WARN | ERROR (default: INFO)
```

---

## Constants Reference

Internal constants defined at the top of `server.js`.
Edit these directly in the script to change behavior:

```javascript
const CHAT_HISTORY_LIMIT  = 20;    // Max messages kept per session in context
const KNOWLEDGE_LIMIT     = 10;    // Max knowledge entries injected per chat
const MAX_KNOWLEDGE_CHARS = 5000;  // Max chars per user knowledge entry
const MAX_LEARN_CHARS     = 500;   // Max chars per AI auto-learned fact
const MODEL_RETRY_DELAY   = 500;   // ms delay between model fallback attempts
const REGISTER_CREDITS    = 100;   // Credits given on registration
const CHAT_CREDIT_COST    = 1;     // Credits deducted per chat message
```

---

## Security Notes

### Passwords
- Stored as SHA-256 hashes — never in plain text
- No salt is applied — consider upgrading to bcrypt for production use

### Session tokens
- Generated as two concatenated UUIDs (`genId() + genId()`)
- Single-device enforcement — new login invalidates all previous sessions
- Stored in database — invalidated on logout

### Admin token
- Passed via `X-Admin-Token` header — keep it secret
- Stored as environment variable — never hardcode in the script
- All admin actions are logged with `requestId` for audit trail

### Knowledge base
- Entries are scoped to `user_id` — users cannot access each other's knowledge
- SQL injection is prevented via parameterized queries in all `dbRun` / `dbBatch` calls

### Credits
- Users can update their own credits via `PATCH /me`
- In production, you may want to remove `credits` from `updateMe` and
  only allow credit changes via the admin route

---

## Production Recommendations

| Concern | Current | Recommended for production |
|---------|---------|---------------------------|
| Password hashing | SHA-256 (no salt) | Use bcrypt or Argon2 |
| Self-service credits | Users can set own credits | Remove from `PATCH /me`, admin-only |
| Session expiry | Sessions never expire | Add `session_expires_at` column |
| Rate limiting | None | Add per-user request rate limiting |
| Input sanitization | Length limits only | Add HTML/script injection sanitization |
| CORS | Not configured | Add `Access-Control-Allow-Origin` header |
| HTTPS | Provided by Bunny | ✅ already handled |
| Logging | Console JSON | Forward to external log aggregator |
| DB backups | Turso managed | Enable Turso point-in-time recovery |

### Add CORS headers (for browser clients)

Add this to the entry point in `server.js`:

```javascript
BunnySDK.net.http.serve(async (request) => {
  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Admin-Token",
        "Access-Control-Max-Age":       "86400",
      },
    });
  }

  const requestId    = genId();
  const startTime    = Date.now();
  const { method }   = request;
  const { pathname } = new URL(request.url);

  logger.info("→ Request", { requestId, method, pathname });

  let response;
  try {
    response = await router(request, requestId);
  } catch (e) {
    logger.error("Unhandled error", { requestId, error: e.message, stack: e.stack });
    response = err(`Internal server error: ${e.message}`, 500);
  }

  logger.info("← Response", {
    requestId, method, pathname,
    status: response.status,
    ms:     Date.now() - startTime,
  });

  // Add CORS headers to every response
  response.headers.set("Access-Control-Allow-Origin",  "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Admin-Token");
  response.headers.set("X-Request-Id", requestId);
  return response;
});
```

### Add session expiry

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN session_expires_at TEXT;
```

```javascript
// In login() and register() — set expiry 30 days from now
const sessionExpiresAt = new Date(
  Date.now() + 30 * 24 * 60 * 60 * 1000
).toISOString();

await dbRun(
  `UPDATE users
   SET session_token = ?, session_at = ?, session_expires_at = ?, updated_at = datetime('now')
   WHERE id = ?`,
  [sessionToken, sessionAt, sessionExpiresAt, user.id]
);

// In getUser() — check expiry
const result = await dbRun(
  `SELECT id, username, displayname, avatar, credits, email
   FROM users
   WHERE session_token = ?
     AND (session_expires_at IS NULL OR session_expires_at > datetime('now'))
   LIMIT 1`,
  [token]
);
```

---

## Quick Start Checklist

```
□ 1. Create Turso database
□ 2. Run all CREATE TABLE and CREATE INDEX SQL statements
□ 3. Get Turso database URL and token
□ 4. Create OpenRouter account and get API key
□ 5. Choose 3 free models from openrouter.ai/models
□ 6. Go to openrouter.ai/settings/privacy — enable data sharing for free models
□ 7. Create Bunny Edge Script
□ 8. Paste server.js content
□ 9. Set all required environment variables
□ 10. Save and deploy
□ 11. Test health check: curl https://your-name.bunny.run/health
□ 12. Register a user
□ 13. Set up persona
□ 14. Start chatting
```

====================================================================================================
====================================================================================================
====================================================================================================

# BunnyChat Frontend — User Guide

## Overview

BunnyChat Frontend is a single-file web application (`index.html`) that provides
a complete browser-based interface for the BunnyChat Role-play AI Chat API.
No build tools, no dependencies, no server required — just one HTML file that
works anywhere.

---

## Table of Contents

- [Deployment](#deployment)
- [CORS Requirement](#cors-requirement)
- [First-Time Setup](#first-time-setup)
- [Interface Overview](#interface-overview)
- [Chat](#chat)
- [Sessions](#sessions)
- [Knowledge Base](#knowledge-base)
- [Persona](#persona)
- [Profile](#profile)
- [Admin Panel](#admin-panel)
- [Settings](#settings)
- [Notifications](#notifications)
- [Credits Reference](#credits-reference)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Browser Compatibility](#browser-compatibility)

---

## Deployment

The frontend is a single static `index.html` file.
Drop it anywhere that serves static files.

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init hosting
# When asked for public directory → enter: . (a dot, current folder)
# Configure as single-page app → No
# Set up automatic builds → No

# Deploy
firebase deploy
```

### Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Click **Create a project → Upload assets**
3. Drag and drop `index.html`
4. Click **Deploy site**

Or via GitHub:

1. Push `index.html` to a GitHub repository
2. Connect the repo in Cloudflare Pages
3. Set build command to **none**, output directory to `/`

### Netlify

```bash
# Via CLI
npm install -g netlify-cli
netlify deploy --prod --dir .

# Or drag & drop index.html at app.netlify.com/drop
```

### Nginx / Apache / Any Static Host

```bash
# Copy index.html to your web root
cp index.html /var/www/html/index.html
```

### Local Development

```bash
# Python quick server — no install needed
python3 -m http.server 8080
# Open http://localhost:8080
```

> ⚠️ **Important:** The BunnyChat API backend must have **CORS headers enabled**
> before the frontend can communicate with it.
> See [CORS Requirement](#cors-requirement) below.

---

## CORS Requirement

The frontend runs in a browser. Browsers block cross-origin requests unless the
server explicitly allows them. You **must** add CORS headers to your Bunny Edge
Script before the frontend will work.

In your `server.js` on Bunny Edge Scripting, wrap the main handler to handle
preflight requests and attach CORS headers to every response:

```javascript
BunnySDK.net.http.serve(async (request) => {

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Admin-Token",
        "Access-Control-Max-Age":       "86400",
      },
    });
  }

  const requestId    = genId();
  const startTime    = Date.now();
  const { method }   = request;
  const { pathname } = new URL(request.url);

  let response;
  try {
    response = await router(request, requestId);
  } catch (e) {
    response = err(`Internal server error: ${e.message}`, 500);
  }

  // Attach CORS headers to every response
  response.headers.set("Access-Control-Allow-Origin",  "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Admin-Token");

  return response;
});
```

Save and deploy the updated script. Without this, every API request from the
browser will fail with:

```
Network error: Failed to fetch.
```

---

## First-Time Setup

### Step 1 — Enter your API URL

When you open the frontend for the first time you will see the **Setup screen**.

Enter your Bunny Edge Script URL:

```
https://your-name.bunny.run
```

- No trailing slash
- Must be `https://`
- Found in **Bunny Dashboard → Edge Scripting → your script**

Click **Continue →**

Your URL is saved in `localStorage`. You will not be asked again unless you
clear your browser data or change it via the ⚙️ settings button.

### Step 2 — Create an account or sign in

You will land on the **Auth screen**.

**Register (first time):**

1. Click the **Register** tab
2. Enter your email and a password *(min. 6 characters)*
3. Click **Create Account**
4. You receive **100 credits** automatically
5. A default AI persona named `Assistant` is created for you

**Sign in (returning user):**

1. Stay on the **Sign In** tab
2. Enter your email and password
3. Click **Sign In**

After successful authentication you are taken directly into the app.

---

## Interface Overview

```
┌─────────────────┬──────────────────────────────────────┐
│                 │                                      │
│    Sidebar      │           Main Panel                 │
│                 │                                      │
│  🐰 BunnyChat   │   Chat / Sessions / Knowledge /      │
│  ⚡ Credits     │   Persona / Profile / Admin          │
│                 │                                      │
│  ✏️ New Chat    │                                      │
│                 │                                      │
│  Navigation     │                                      │
│  Recent Chats   │                                      │
│                 │                                      │
│  ─────────────  │                                      │
│  Persona        │                                      │
│  Profile        │                                      │
│  Admin          │                                      │
│  ⚙️  🚪         │                                      │
└─────────────────┴──────────────────────────────────────┘
```

### Sidebar Elements

| Element | Description |
|---------|-------------|
| **⚡ Credits badge** | Your current credit balance, always visible |
| **✏️ New Chat** | Start a fresh conversation |
| **Chat** | Go to the active chat window |
| **Sessions** | Browse all past sessions |
| **Knowledge** | Manage the AI knowledge base |
| **Persona** | Configure the AI character |
| **Profile** | Edit your account |
| **Admin** | Credit management and user lookup |
| **⚙️** | Change API URL |
| **🚪** | Sign out |
| **Recent** list | Your 20 most recent sessions — click any to open |

---

## Chat

### Starting a New Conversation

1. Click **✏️ New Chat** in the sidebar
2. Type your message in the text box at the bottom
3. Press **Enter** to send, or **Shift+Enter** for a new line
4. The AI will respond — each message costs **1 credit**

### Resuming a Past Conversation

- Click any session in the **Recent** list in the sidebar, or
- Go to **Sessions**, find the session, and click its card

The full message history loads automatically. You can continue typing
immediately to add more messages to the same session.

### Switching Between Sessions

Click any session in the sidebar or Sessions page at any time.
The chat window clears immediately and loads the selected session's messages.
Any in-progress session is preserved — you can switch back to it at any time.

### AI Responses

Each AI reply has two parts:

| Part | Description | Display |
|------|-------------|---------|
| **Reply** | Spoken dialogue from the AI character | Main message bubble |
| **Actions** | Physical actions or emotions *(max 3)* | Grey italic chips above the bubble, e.g. `*smiles warmly*` |

### Chat Input Controls

| Control | Action |
|---------|--------|
| **Enter** | Send message |
| **Shift+Enter** | Insert new line |
| **Character counter** | Shows current length — turns red above 3800 chars — max 4000 |
| **Credit display** | Shows remaining credits in the input footer |

### Session Title

The session title is auto-generated by the AI from the first message.
It appears in the chat header and sidebar after a few seconds.
You can rename it manually at any time.

### Rename a Session

- Click the **✏️** icon in the chat header, or
- Hover over a session in the sidebar and click **✏️**, or
- Go to **Sessions** and click **✏️** on any card

Enter a new title *(max 100 characters)* and click **Save**.

### Delete a Session

- Click the **🗑️** icon in the chat header to delete the current session, or
- Hover over a session in the sidebar and click **🗑**, or
- Go to **Sessions** and click **🗑️** on any card

Confirm the dialog. Deletion is **permanent** and cannot be undone.

---

## Sessions

Navigate to **Sessions** in the sidebar to see your full chat history.

### Actions

| Action | How |
|--------|-----|
| Open session in chat | Click anywhere on the session card |
| Preview messages | Click **👁** on the card |
| Open preview in chat | Click **Open in Chat →** inside the preview modal |
| Rename session | Click **✏️** on the card |
| Delete session | Click **🗑️** on the card |
| Refresh list | Click **↻ Refresh** |
| Delete all sessions | Click **🗑 Clear All** — requires confirmation — permanent |

### Session Card Information

Each card shows:

- Session title
- Message count
- Last activity timestamp
- AI model used in that session

Sessions are ordered by most recent activity.

---

## Knowledge Base

The Knowledge Base is the AI's **source of truth**. Entries you add here always
take priority over the AI's base training data when answering questions.

Navigate to **Knowledge** in the sidebar.

### Add an Entry

1. Click **＋ Add Entry**
2. Fill in **Topic** *(max 100 chars)* — a short label for the fact
3. Fill in **Content** *(max 5000 chars)* — the actual knowledge
4. Optionally fill in **Keywords** *(comma-separated)*:
   - Leave blank → AI auto-extracts 5–10 keywords
   - Provide your own → used as-is
5. Click **Add Entry (−1 credit)**

> ⚡ Each new entry costs **1 credit**.

### Edit an Entry

1. Click **✏️** on any knowledge card
2. Modify topic, content, and/or keywords
3. Refer to keyword update rules:

| What you do | Result |
|-------------|--------|
| Leave keywords field unchanged | Keywords stay the same |
| Clear the keywords field | AI re-extracts keywords automatically |
| Provide new keywords | Your keywords are used as-is |
| Change topic or content, leave keywords | AI re-extracts automatically |

4. Click **Save Changes**

> Editing is **free** — no credit cost.

### Delete an Entry

Click **🗑️** on the card and confirm. Deletion is permanent.

### Entry Source Badges

| Badge | Meaning |
|-------|---------|
| 👤 **Manual** | You added this entry via the frontend |
| 🤖 **AI** | The AI automatically learned this fact from a conversation |

### Tips for Effective Knowledge Entries

- Keep each entry focused on **one topic**
- If content exceeds 5000 characters, **split it into multiple entries**
  with related topic names
- Use keywords that match how you would naturally ask about the topic in chat
- To force keyword re-extraction on an existing entry, clear the keywords
  field and save

---

## Persona

The Persona is the AI character you chat with.
Navigate to **Persona** in the sidebar.

### Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | The AI character's name | `Misa` |
| **Sex** | Gender — affects pronouns in the system prompt | `female` |
| **Age** | Character age *(1–999)* | `22` |
| **Image URL** | Optional character avatar *(leave empty to clear)* | `https://…/misa.jpg` |
| **Personality** | Comma-separated traits | `cute,shy,cheerful` |
| **Likes** | Comma-separated interests | `anime,cats,matcha` |
| **Dislikes** | Comma-separated dislikes | `loud noises,spicy food` |
| **Specialization** | Topics the AI knows deeply *(comma-separated)* | `japanese culture,anime,manga` |

### How Specialization Affects AI Behavior

| Situation | AI behavior |
|-----------|-------------|
| Topic is in **Specialization** | Answers with depth and enthusiasm |
| Topic is in **Knowledge Base** | Always answers, even if outside specialization |
| Simple general question | Answers briefly |
| Outside specialization, not in Knowledge Base | Refuses in character — admits ignorance |

### Saving

Click **💾 Save Persona**.

The system prompt is **auto-generated** from your fields and shown below the
form after saving. You never need to write the prompt manually.

### Live Preview

The character name, sex, age, and avatar image update in real time as you
type — before saving.

### Partial Updates

All fields are optional on each save. You can update just one field —
for example only the personality — and all other fields remain unchanged.

---

## Profile

Navigate to **Profile** in the sidebar to manage your account.

### Editable Fields

| Field | Notes |
|-------|-------|
| **Display Name** | 1–50 characters — shown in the sidebar footer |
| **Avatar URL** | Any public image URL — leave empty to clear |
| **Credits** | Self-service credit top-up *(see warning below)* |

> ⚠️ **Production note:** The self-service credits field allows any user to
> set their own credits to any value. This is intentional for development and
> testing. In a production deployment, remove `credits` from the `PATCH /me`
> handler on the backend and manage credits exclusively via the Admin panel.

### Viewing Your Account Info

Your username *(auto-generated from your email on registration)*, email
address, and current credit balance are shown at the top of the profile page.

Click **↻ Refresh** to pull the latest data from the server.

---

## Admin Panel

Navigate to **Admin** in the sidebar.

This panel requires your `ADMIN_TOKEN` — the secret token configured in
the Bunny Edge Script environment variables.

> 🔒 The admin token is **never stored** by the frontend. It is held only
> in the input field for the duration of your browser session.

### Enter Your Admin Token

Type it into the **Token** field at the top of the Admin page.
Click **👁** to toggle show/hide.
All admin actions in the same session use this token automatically.

### Update User Credits

| Field | Description |
|-------|-------------|
| **User ID** | Numeric ID of the target user |
| **Amount** | Credit amount to apply |
| **Operation** | `Add`, `Set (exact)`, or `Subtract` |

| Operation | Effect |
|-----------|--------|
| **Add** | Adds the amount to the user's current credits |
| **Set** | Sets the user's credits to exactly the specified amount |
| **Subtract** | Subtracts the amount — minimum result is `0` |

Click **Apply Credits**. The result panel shows the updated credit balance.

### Look Up a User

Enter a **User ID** and click **🔍 Lookup** to view full profile info:

- ID, username, display name
- Email address
- Current credits
- Registration date

---

## Settings

Click the **⚙️** icon in the sidebar footer at any time to change the
API base URL.

Enter the new URL and click **Save & Reload**.
The page reloads automatically with the new URL applied.

---

## Notifications

The frontend uses a **toast notification** system in the top-right corner.

| Color | Meaning |
|-------|---------|
| 🟢 Green | Success — action completed |
| 🔴 Red | Error — something went wrong |
| 🔵 Blue | Info — neutral message |
| 🟡 Yellow | Warning — attention needed |

Toasts dismiss automatically after 4 seconds.
Click **✕** to dismiss immediately.

---

## Credits Reference

| Action | Cost |
|--------|------|
| Register | +100 credits (free) |
| Send chat message | −1 credit |
| Add knowledge entry | −1 credit |
| Login / Logout | Free |
| Edit or delete knowledge entry | Free |
| Persona update | Free |
| Profile update | Free |
| Session operations (view, rename, delete) | Free |

When credits reach `0`, chat and knowledge insertion return an
**Insufficient credits** error (`HTTP 402`).

Top up via **Profile → Credits** or ask an admin to add credits
via the **Admin panel**.

---

## Security Notes

| Area | Detail |
|------|--------|
| **XSS prevention** | All user-generated content is HTML-escaped before being rendered. Raw user input is never passed to `innerHTML`. |
| **Session token** | Stored in `localStorage`. Sent as `Authorization: Bearer <token>` on every authenticated request. |
| **Admin token** | Never stored in `localStorage` or any persistent storage. Held only in the input field for the current browser session. |
| **HTTPS** | Always use your Bunny Edge Script URL over `https://`. Plain `http://` will not work in production due to browser mixed-content restrictions. |
| **Single-device sessions** | The backend enforces single-device sessions. Logging in on another device invalidates your existing token. |

---

## Troubleshooting

### "Network error: Failed to fetch"

CORS is not enabled on the backend.
Follow the [CORS Requirement](#cors-requirement) section and redeploy
your Edge Script.

Also verify in **Bunny Dashboard → Pull Zone → Security** that all of
these are **disabled**:

| Setting | Required state |
|---------|----------------|
| Block Root Path Access | ❌ Disabled |
| Token Authentication | ❌ Disabled |
| Block POST Requests | ❌ Disabled |
| Hotlink Protection | ❌ Disabled |

---

### "Session expired. Please sign in again."

Your session token was invalidated — either by logging in on another device,
by the admin clearing it, or by manual logout.
Sign in again to get a new token.

---

### Chat sends but no reply appears

- Check your credit balance in the sidebar — if it shows `0`, top up
  via Profile or the Admin panel
- Check the AI model configuration in your Bunny Edge Script
  environment variables
- Open browser **DevTools → Network tab** and inspect the `/chat`
  request response body for the specific error message

---

### Session title stays as "New Chat"

The title is auto-generated by the AI on the server and may take a few
seconds. The frontend refreshes the session title automatically after 2.8
seconds. If it still shows `New Chat` after that, rename it manually via
the **✏️** button in the chat header.

---

### Knowledge entry keywords show only one word

Keyword extraction runs via the AI on the backend. If all models are
rate-limited, the backend falls back to using the topic word only.
Wait a few seconds, then force re-extraction by editing the entry and
clearing the keywords field.

---

### Avatar image not showing

The image URL must be publicly accessible and served over `https://`.
If the URL returns a 404 or requires authentication, the avatar falls
back to the default emoji automatically.

---

### Page shows Setup screen after refresh

Your browser's `localStorage` was cleared — this happens in private
browsing mode, after clearing browser data, or due to a browser extension.
Re-enter your API URL and sign in again.

---

### Mobile sidebar does not close

Tap anywhere on the dark overlay outside the sidebar to close it.

---

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome / Edge 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Mobile Chrome / Safari | ✅ Full — responsive layout |
| Internet Explorer | ❌ Not supported |

**Requires:** `fetch`, `localStorage`, CSS custom properties, `async/await`
— all available in any modern browser released after 2021.

---

## Final Notes for Implementation and Improvement

If you plan to adapt or build upon this project, there are several areas where you can further enhance performance, scalability, and user trust.

First, consider leveraging a **Vector Database** instead of (or alongside) a conventional relational database. Vector DBs are particularly effective for handling semantic search, similarity matching, and AI-driven features, making them a strong fit for modern intelligent applications.

To improve system responsiveness, integrating **Redis** as a caching layer is highly recommended. Caching frequently accessed data or computation results can significantly reduce latency and server load, especially in high-traffic scenarios.

From a privacy and control standpoint, developers are encouraged to host AI models on their own infrastructure whenever feasible. Running models on private servers not only helps safeguard user data but also provides greater flexibility in tuning performance, managing costs, and customizing behavior.

Ultimately, the best implementation will depend on your specific use case, scale, and constraints—but combining these approaches can lead to a more robust, efficient, and trustworthy system.
