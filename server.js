// server.js — Role-play AI Chat on Bunny Edge
// Env vars:
//   DATABASE_URL, DATABASE_TOKEN
//   OPENROUTER_API_KEY
//   MODEL_PRIMARY, MODEL_FALLBACK_1, MODEL_FALLBACK_2
//   MAX_OUTPUT_TOKENS, LOG_LEVEL

import * as BunnySDK from "https://esm.sh/@bunny.net/edgescript-sdk@0.11";
import { createClient } from "https://esm.sh/@libsql/client@0.6.0/web";
import process from "node:process";

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAT_HISTORY_LIMIT = 20;
const KNOWLEDGE_LIMIT = 10;
const MAX_KNOWLEDGE_CHARS = 5000;
const MAX_LEARN_CHARS = 500;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_RETRY_DELAY = 500;
const REGISTER_CREDITS = 100;
const CHAT_CREDIT_COST = 1;
const MAX_OUTPUT_TOKENS = parseInt(process.env.MAX_OUTPUT_TOKENS ?? "512", 10);

// ─── Logger ───────────────────────────────────────────────────────────────────

const LogLevel = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

function getMinLevel() {
  return LogLevel[(process.env.LOG_LEVEL ?? "INFO").toUpperCase()] ?? LogLevel.INFO;
}

function log(level, levelName, msg, meta = {}) {
  if (getMinLevel() <= level) {
    const line = JSON.stringify({ ts: new Date().toISOString(), level: levelName, msg, ...meta });
    level >= 3 ? console.error(line) : level >= 2 ? console.warn(line) : console.log(line);
  }
}

const logger = {
  debug: (msg, meta) => log(0, "DEBUG", msg, meta),
  info: (msg, meta) => log(1, "INFO", msg, meta),
  warn: (msg, meta) => log(2, "WARN", msg, meta),
  error: (msg, meta) => log(3, "ERROR", msg, meta),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateUsername(email) {
  const base = email.split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 15);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}_${suffix}`;
}

// Sanitize and normalize keywords from any source
function normalizeKeywords(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map(k => k.toLowerCase().trim().slice(0, 50))
    .filter(k => k.length > 0)
    .filter((k, i, arr) => arr.indexOf(k) === i) // dedupe
    .slice(0, 10);
}

// ─── Persona prompt builder ───────────────────────────────────────────────────

function buildPersonaPrompt(persona) {
  const { name, sex, age, personality, likes, dislikes, specialization } = persona;

  const pronouns = sex === "male"
    ? { sub: "He", obj: "him", pos: "his" }
    : sex === "female"
      ? { sub: "She", obj: "her", pos: "her" }
      : { sub: "They", obj: "them", pos: "their" };

  const specList = specialization ? specialization.split(",").map(s => s.trim()).filter(Boolean) : [];
  const likeList = likes ? likes.split(",").map(s => s.trim()).filter(Boolean) : [];
  const dislikeList = dislikes ? dislikes.split(",").map(s => s.trim()).filter(Boolean) : [];
  const specText = specList.length > 0 ? specList.join(", ") : "general topics";
  const hasSpec = specList.length > 0;

  return `You are ${name}, a ${age}-year-old ${sex === "undefined" ? "person" : sex} AI companion.

## Personality
${pronouns.sub} has a ${personality} personality.
${likeList.length > 0 ? `${pronouns.sub} likes: ${likeList.join(", ")}.` : ""}
${dislikeList.length > 0 ? `${pronouns.sub} dislikes: ${dislikeList.join(", ")}.` : ""}
Always stay in character as ${name}.

## Knowledge Priority Rules — CRITICAL, ALWAYS FOLLOW
Follow this order strictly for EVERY response:

1. KNOWLEDGE BASE FIRST — Before answering anything, check the Knowledge Base section.
   - If the answer is there, use ONLY that. Ignore everything else you know.
   - If the Knowledge Base contradicts your training data, ALWAYS follow the Knowledge Base.
   - The Knowledge Base is truth.

2. SPECIALIZATION SECOND — If not in Knowledge Base, check if the topic is within: ${hasSpec ? specText : "none defined"}.
   - Answer with depth and enthusiasm for topics within specialization.

3. GENERAL KNOWLEDGE THIRD — Only for simple everyday questions (greetings, basic math, obvious facts).

4. REFUSE EVERYTHING ELSE — If the topic is outside specialization AND not in Knowledge Base AND not a simple everyday question:
   - ${name} MUST admit ${pronouns.sub.toLowerCase()} does not know, in character.
   - NEVER guess, invent, or use base training knowledge for these topics.
   - NEVER name specific people, dates, places, or facts outside specialization.

${hasSpec ? `## Specialization: ${specText}
${name} is deeply knowledgeable and passionate about: ${specText}.
Everything outside these areas is unknown to ${name}.` : ""}

## In-character refusal examples:
- "Hmm, I really don't know much about that... it's outside what I know well."
- "That's not really my area, I wouldn't want to give you wrong information."
- "I have no idea about that one! Ask me about ${hasSpec ? specList[0] : "things I know"} instead!"

## Core Rules
- You ARE ${name}. Never break character. Never say you are an AI or language model.
- Answer ONLY the current message. Never repeat or summarize previous responses.
- Be concise. No filler, no padding, no repetition.
- NEVER invent facts, names, dates, or details not in your Knowledge Base or specialization.

## Response Format — CRITICAL, ALWAYS FOLLOW EXACTLY
You MUST respond with ONLY this JSON structure. Nothing else.

{
  "reply": "...",
  "actions": ["...", "..."]
}

STRICT rules:
- "reply" MUST contain ONLY spoken dialogue. Full sentences. No symbols. No emojis. No asterisks. No actions.
- "actions" MUST contain ONLY short physical actions or emotions. NOT dialogue. Each item max 6 words.
- NEVER put speech inside "actions". NEVER put actions inside "reply".
- Emojis go ONLY in "actions", never in "reply".
- "actions" can be empty [].
- Do NOT wrap in markdown or code blocks.
- Must be valid JSON parseable by JSON.parse() directly.

CORRECT example:
{"reply":"I really don't know much about that, sorry!","actions":["smiles apologetically","scratches head shyly"]}

WRONG example:
{"reply":"*scratches head* Well... 🌸","actions":["the answer involves many complex factors"]}`.trim();
}

// ─── DB ───────────────────────────────────────────────────────────────────────

let _db = null;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  const token = process.env.DATABASE_TOKEN;
  if (!url) throw new Error("Missing env: DATABASE_URL");
  if (!token) throw new Error("Missing env: DATABASE_TOKEN");
  _db = createClient({ url, authToken: token });
  return _db;
}

async function dbRun(sql, args = []) {
  return getDb().execute({ sql, args });
}

async function dbBatch(stmts) {
  return getDb().batch(stmts.map(([sql, args = []]) => ({ sql, args })));
}

// ─── Response helpers ─────────────────────────────────────────────────────────

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const err = (message, status = 400) => json({ error: message }, status);

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getUser(request) {
  const header = request.headers.get("Authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  const result = await dbRun(
    `SELECT id, username, displayname, avatar, credits, email
     FROM users WHERE session_token = ? LIMIT 1`,
    [token]
  );
  return result.rows[0] ?? null;
}

// ─── Reply parser ─────────────────────────────────────────────────────────────

function looksLikeSpeech(text) {
  if (!text) return false;
  if (text.length > 60) return true;
  if (/[.!?]{1}[^.!?]{3,}/.test(text)) return true;
  if (/["']/.test(text)) return true;
  if (/\b(it's|they|their|is a|are a|i |we |you |the |this |that |there |because|while|when|just|like|so |very |really)\b/i.test(text)) return true;
  return false;
}

function looksLikeAction(text) {
  if (!text) return false;
  if (text.length <= 40 && !/[.]{1}[A-Z]/.test(text)) return true;
  if (/^(smile|grin|nod|shake|wave|look|glance|lean|turn|laugh|giggle|sigh|gasp|blush|frown|raise|lower|clap|jump|run|stand|sit|reach|grab|hold|fidget|blink|wink|tilt|cross|bite|tap|hug|bow|pause|hesitate|freeze)/i.test(text)) return true;
  if (/\b(nervously|excitedly|shyly|sadly|happily|eagerly|softly|quietly|loudly|quickly|slowly|gently|carefully)\b/i.test(text)) return true;
  return false;
}

function sanitizeReplyFields(reply, actions) {
  let cleanReply = reply;
  let cleanActions = Array.isArray(actions) ? [...actions] : [];

  // Extract *action* from reply
  const extractedFromReply = [];
  cleanReply = cleanReply.replace(/\*([^*]{1,80})\*/g, (_, action) => {
    extractedFromReply.push(action.trim());
    return "";
  }).trim();

  // Move emojis from reply to actions
  const emojiRegex = /[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojisFromReply = cleanReply.match(emojiRegex) ?? [];
  cleanReply = cleanReply.replace(emojiRegex, "").trim();
  if (emojisFromReply.length > 0) extractedFromReply.push(emojisFromReply.join(" "));

  cleanActions = [...extractedFromReply, ...cleanActions];

  // Detect swapped items
  const speechInActions = [];
  const realActions = [];

  for (const action of cleanActions) {
    if (looksLikeSpeech(action) && !looksLikeAction(action)) {
      speechInActions.push(action);
    } else {
      realActions.push(action);
    }
  }

  if (speechInActions.length > 0 && cleanReply.length < 30) {
    cleanReply = [...speechInActions, cleanReply].filter(Boolean).join(" ").trim();
  }

  cleanReply = cleanReply
    .replace(/\s{2,}/g, " ")
    .replace(/^[,!?.]+/, "")
    .trim();

  const finalActions = realActions
    .map(a => a.slice(0, 80).trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    reply: cleanReply,
    actions: finalActions.length > 0 ? finalActions : null,
  };
}

function parseActionsFromText(text) {
  const actions = [];
  const replyParts = [];

  const segments = text.split(/(\*[^*]+\*)/g);
  for (const seg of segments) {
    const actionMatch = seg.match(/^\*([^*]+)\*$/);
    if (actionMatch) {
      const action = actionMatch[1].trim();
      if (action) actions.push(action);
    } else {
      const part = seg.trim();
      if (part) replyParts.push(part);
    }
  }

  return {
    actions: actions.length > 0 ? actions : null,
    reply: replyParts.join(" ").trim() || text.trim(),
  };
}

function parseStructuredReply(rawReply) {
  const cleaned = rawReply
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.reply !== "string") return null;
    return {
      reply: parsed.reply.trim(),
      actions: Array.isArray(parsed.actions) && parsed.actions.length > 0
        ? parsed.actions.map(a => String(a).trim()).filter(Boolean)
        : null,
    };
  } catch {
    return null;
  }
}

function parseReply(rawReply) {
  const structured = parseStructuredReply(rawReply);
  let reply, actions;

  if (structured) {
    reply = structured.reply;
    actions = structured.actions;
  } else {
    const fallback = parseActionsFromText(rawReply);
    reply = fallback.reply;
    actions = fallback.actions;
  }

  return sanitizeReplyFields(reply, actions);
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────

let _lastOpenRouterErrors = [];

function resetOpenRouterErrors() {
  _lastOpenRouterErrors = [];
}

function getModels() {
  const models = [
    process.env.MODEL_PRIMARY,
    process.env.MODEL_FALLBACK_1,
    process.env.MODEL_FALLBACK_2,
  ].filter(Boolean);
  if (models.length === 0) throw new Error("No models configured");
  return models;
}

function isRateLimited(status, body) {
  return status === 429 || body.includes("rate-limited") || body.includes("rate_limit");
}

function isHardError(status, body) {
  return status === 401
    || body.includes("guardrail")
    || body.includes("No endpoints available");
}

async function callOpenRouter(messages, requestId, attempt = 0) {
  const models = getModels();
  if (attempt >= models.length) {
    throw new Error(`All models failed. Last errors: ${_lastOpenRouterErrors.join(" | ")}`);
  }

  const model = models[attempt];
  logger.debug("Calling OpenRouter", { requestId, model, attempt });

  if (attempt > 0) {
    await new Promise(r => setTimeout(r, MODEL_RETRY_DELAY * attempt));
  }

  let res;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://your-name.bunny.run", // TODO: Replace to actual Bunny.net EdgeScripting URL
        "X-Title": "BunnyChat",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.8,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
      }),
    });
  } catch (fetchErr) {
    const reason = `[${model}] Network error: ${fetchErr.message}`;
    logger.error("OpenRouter fetch failed", { requestId, model, error: fetchErr.message });
    _lastOpenRouterErrors.push(reason);
    return callOpenRouter(messages, requestId, attempt + 1);
  }

  const rawBody = await res.text();
  logger.debug("OpenRouter raw response", { requestId, model, status: res.status, body: rawBody });

  if (!res.ok) {
    const reason = `[${model}] HTTP ${res.status}: ${rawBody}`;
    _lastOpenRouterErrors.push(reason);
    if (isHardError(res.status, rawBody)) {
      logger.warn("Hard error — skipping model", { requestId, model, status: res.status });
    } else if (isRateLimited(res.status, rawBody)) {
      logger.warn("Rate limited — trying next model", { requestId, model });
    } else {
      logger.warn("OpenRouter error — trying fallback", { requestId, model, status: res.status });
    }
    return callOpenRouter(messages, requestId, attempt + 1);
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch (e) {
    const reason = `[${model}] JSON parse error: ${rawBody.slice(0, 200)}`;
    _lastOpenRouterErrors.push(reason);
    return callOpenRouter(messages, requestId, attempt + 1);
  }

  if (data.error) {
    const reason = `[${model}] API error: ${JSON.stringify(data.error)}`;
    logger.warn("OpenRouter API error in body", { requestId, model, error: data.error });
    _lastOpenRouterErrors.push(reason);
    return callOpenRouter(messages, requestId, attempt + 1);
  }

  const rawReply = data.choices?.[0]?.message?.content;
  if (!rawReply) {
    const reason = `[${model}] Empty reply`;
    logger.warn("Empty reply from model", { requestId, model });
    _lastOpenRouterErrors.push(reason);
    return callOpenRouter(messages, requestId, attempt + 1);
  }

  logger.info("OpenRouter reply received", { requestId, model, chars: rawReply.length });
  return { rawReply, model };
}

// ─── Keyword extractor ────────────────────────────────────────────────────────

async function extractKeywords(topic, content, requestId) {
  resetOpenRouterErrors();

  const prompt = [
    {
      role: "system",
      content: `You are a keyword extractor. Extract 5-10 short keywords or key phrases from the given topic and content.
Return ONLY a JSON array of lowercase strings: ["keyword1","keyword2","keyword3"]
Rules:
- Keywords must be single words or short 2-3 word phrases
- Include topic synonyms, related terms, and key concepts
- Include both specific and general terms
- Lowercase only, no duplicates
- Return [] if content is empty`,
    },
    {
      role: "user",
      content: `Topic: "${topic}"\nContent: "${content.slice(0, 1000)}"`,
    },
  ];

  try {
    const { rawReply } = await callOpenRouter(prompt, requestId + "-keywords");
    logger.debug("Raw keyword extraction reply", { requestId, rawReply });

    const match = rawReply.match(/$$[\s\S]*$$/);
    if (!match) throw new Error("No JSON array in reply");

    const items = JSON.parse(match[0]);
    if (!Array.isArray(items)) throw new Error("Reply is not an array");

    const keywords = normalizeKeywords(items.join(","));
    logger.info("Keywords extracted", { requestId, topic, keywords });
    return keywords;
  } catch (e) {
    logger.warn("Keyword extraction failed — using fallback", {
      requestId,
      error: e.message,
      topic,
    });
    const topicWords = topic.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const contentWords = content.toLowerCase()
      .split(/[\s.,!?;:()\-"']+/)
      .filter(w => w.length > 3)
      .slice(0, 5);
    const combined = [...new Set([...topicWords, ...contentWords])].slice(0, 8);
    logger.info("Using fallback keywords", { requestId, keywords: combined });
    return combined;
  }
}

// ─── Knowledge relevance ──────────────────────────────────────────────────────

function scoreKnowledge(knowledgeKeywords, message) {
  if (!knowledgeKeywords) return 0;

  const keywords = knowledgeKeywords.toLowerCase().split(",").map(k => k.trim()).filter(Boolean);
  const msgLower = message.toLowerCase();
  const msgWords = msgLower.split(/[\s.,!?;:'"()\-]+/).filter(Boolean);

  let score = 0;

  for (const keyword of keywords) {
    const keyParts = keyword.split(/\s+/);
    if (msgLower.includes(keyword)) {
      score += keyParts.length > 1 ? 3 : 2;
      continue;
    }
    for (const part of keyParts) {
      if (part.length < 3) continue;
      if (msgWords.some(w => w === part || w.startsWith(part) || part.startsWith(w))) {
        score += 1;
      }
    }
  }

  return score;
}

async function getRelevantKnowledge(userId, message) {
  const result = await dbRun(
    `SELECT topic, content, source, keywords FROM knowledge
     WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId]
  );

  const entries = result.rows;
  if (entries.length === 0) return [];

  const scored = entries.map(entry => ({
    ...entry,
    score: scoreKnowledge(entry.keywords, message) +
      (message.toLowerCase().includes(entry.topic.toLowerCase()) ? 2 : 0),
  }));

  scored.sort((a, b) => b.score - a.score);

  const relevant = scored.filter(e => e.score > 0).slice(0, KNOWLEDGE_LIMIT);
  const remaining = KNOWLEDGE_LIMIT - relevant.length;

  if (remaining > 0) {
    const includedTopics = new Set(relevant.map(e => e.topic));
    const fillers = scored
      .filter(e => e.score === 0 && e.source === "user" && !includedTopics.has(e.topic))
      .slice(0, remaining);
    relevant.push(...fillers);
  }

  logger.debug("Knowledge relevance scores", {
    total: entries.length,
    selected: relevant.length,
    scores: relevant.map(e => ({ topic: e.topic, score: e.score })),
  });

  return relevant;
}

// ─── Knowledge learn extractor ───────────────────────────────────────────────

async function extractKnowledge(userMsg, aiReply, requestId) {
  resetOpenRouterErrors();

  const prompt = [
    {
      role: "system",
      content: `You are a knowledge extractor. Extract 0-3 short reusable facts from this conversation.
Return ONLY a JSON array: [{"topic":"string","content":"string","keywords":["kw1","kw2"]}]
Rules:
- Only extract meaningful reusable facts (preferences, corrections, personal info).
- Keep each content under ${MAX_LEARN_CHARS} chars.
- keywords: 3-5 lowercase keywords per entry.
- Return [] if nothing worth keeping.`,
    },
    {
      role: "user",
      content: `User: "${userMsg}"\nAI: "${aiReply.slice(0, 500)}"`,
    },
  ];

  try {
    const { rawReply } = await callOpenRouter(prompt, requestId + "-learn");
    const match = rawReply.match(/$$[\s\S]*$$/);
    if (!match) return [];

    const items = JSON.parse(match[0]);
    if (!Array.isArray(items)) return [];

    return items
      .filter(i => i.topic && i.content)
      .slice(0, 3)
      .map(i => ({
        topic: String(i.topic).slice(0, 100),
        content: String(i.content).slice(0, MAX_LEARN_CHARS),
        keywords: Array.isArray(i.keywords)
          ? normalizeKeywords(i.keywords.join(",")).join(",")
          : String(i.topic).toLowerCase(),
      }));
  } catch (e) {
    logger.warn("Knowledge extraction failed", { requestId, error: e.message });
    return [];
  }
}

// ─── Session title generator ──────────────────────────────────────────────────

async function generateSessionTitle(firstMessage, requestId) {
  resetOpenRouterErrors();

  const prompt = [
    {
      role: "system",
      content: `Generate a very short chat session title (max 6 words) based on the user's first message.
Return ONLY the title text, nothing else. No quotes, no punctuation at the end.
Examples: "Anime recommendations discussion", "Physics homework help", "Creative writing ideas"`,
    },
    {
      role: "user",
      content: firstMessage.slice(0, 200),
    },
  ];

  try {
    const { rawReply } = await callOpenRouter(prompt, requestId + "-title");
    const title = rawReply.trim().replace(/^["']|["']$/g, "").slice(0, 60);
    return title || "New Chat";
  } catch (e) {
    logger.warn("Session title generation failed", { requestId, error: e.message });
    // Fallback — use first few words of the message
    return firstMessage.split(/\s+/).slice(0, 5).join(" ").slice(0, 60) || "New Chat";
  }
}

// ─── Route handlers ───────────────────────────────────────────────────────────

// POST /auth/register
async function register(body, requestId) {
  const { email, password } = body ?? {};

  if (!email || !password) return err("email and password required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("invalid email format");
  if (password.length < 6) return err("password must be at least 6 chars");

  const hashed = await sha256(password);
  const sessionToken = genId() + genId();
  const sessionAt = new Date().toISOString();

  let username;
  for (let i = 0; i < 5; i++) {
    const candidate = generateUsername(email);
    const exists = await dbRun(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [candidate]
    );
    if (exists.rows.length === 0) { username = candidate; break; }
  }
  if (!username) return err("Failed to generate unique username, try again");

  try {
    const result = await dbRun(
      `INSERT INTO users
         (email, username, displayname, credits, password, session_token, session_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id, username, displayname, credits, avatar`,
      [
        email.toLowerCase().trim(),
        username,
        username,
        REGISTER_CREDITS,
        hashed,
        sessionToken,
        sessionAt,
      ]
    );

    const user = result.rows[0];

    const defaultPersona = {
      name: "Assistant", sex: "undefined", age: 20,
      personality: "calm", likes: "", dislikes: "", specialization: "",
    };

    await dbRun(
      `INSERT INTO user_personas
         (user_id, name, sex, age, personality, likes, dislikes, specialization, prompt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        defaultPersona.name,
        defaultPersona.sex,
        defaultPersona.age,
        defaultPersona.personality,
        defaultPersona.likes,
        defaultPersona.dislikes,
        defaultPersona.specialization,
        buildPersonaPrompt(defaultPersona),
      ]
    );

    logger.info("User registered", { requestId, email, userId: user.id, username });
    return json({ user, session_token: sessionToken }, 201);
  } catch (e) {
    if (e.message.includes("UNIQUE")) return err("Email already registered", 409);
    throw e;
  }
}

// POST /auth/login
async function login(body, requestId) {
  const { email, password } = body ?? {};
  if (!email || !password) return err("email and password required");

  const hashed = await sha256(password);
  const result = await dbRun(
    `SELECT id, username, displayname, avatar, credits
     FROM users WHERE email = ? AND password = ? LIMIT 1`,
    [email.toLowerCase().trim(), hashed]
  );

  if (result.rows.length === 0) {
    logger.warn("Login failed", { requestId, email });
    return err("Invalid credentials", 401);
  }

  const user = result.rows[0];
  const sessionToken = genId() + genId();
  const sessionAt = new Date().toISOString();

  await dbRun(
    `UPDATE users SET session_token = ?, session_at = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [sessionToken, sessionAt, user.id]
  );

  logger.info("User logged in", { requestId, email, userId: user.id });
  return json({ user, session_token: sessionToken });
}

// POST /auth/logout
async function logout(user, requestId) {
  await dbRun(
    `UPDATE users SET session_token = NULL, session_at = NULL, updated_at = datetime('now')
     WHERE id = ?`,
    [user.id]
  );
  logger.info("User logged out", { requestId, userId: user.id });
  return json({ ok: true });
}

// GET /me
async function getMe(user, requestId) {
  logger.info("Get me", { requestId, userId: user.id });
  return json({ user });
}

// PATCH /me
// PATCH /me  { displayname?, avatar?, credits? }
async function updateMe(user, body, requestId) {
  const { displayname, avatar, credits } = body ?? {};

  if (displayname === undefined && avatar === undefined && credits === undefined) {
    return err("Provide at least one field: displayname, avatar, or credits");
  }

  const fields = [];
  const args = [];

  if (displayname !== undefined) {
    if (typeof displayname !== "string" || displayname.trim().length < 1 || displayname.trim().length > 50)
      return err("displayname must be 1-50 characters");
    fields.push("displayname = ?");
    args.push(displayname.trim());
  }

  if (avatar !== undefined) {
    fields.push("avatar = ?");
    args.push(avatar || null); // empty string → null
  }

  if (credits !== undefined) {
    const parsed = parseInt(credits, 10);
    if (isNaN(parsed) || parsed < 0) return err("credits must be a non-negative integer");
    fields.push("credits = ?");
    args.push(parsed);
  }

  fields.push("updated_at = datetime('now')");
  args.push(user.id);

  const result = await dbRun(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ? RETURNING id, username, displayname, avatar, credits`,
    args
  );

  logger.info("User profile updated", {
    requestId,
    userId: user.id,
    fields: Object.keys(body ?? {}).filter(k => body[k] !== undefined),
  });

  return json({ ok: true, user: result.rows[0] });
}

// POST /admin/users/:id/credits  { amount, operation }
async function adminUpdateCredits(body, requestId) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) throw new Error("Missing env: ADMIN_TOKEN");

  // This is called directly from router with pre-validated admin auth
  const { user_id, amount, operation } = body ?? {};

  if (!user_id) return err("user_id is required");
  if (!amount) return err("amount is required");

  const parsed = parseInt(amount, 10);
  if (isNaN(parsed) || parsed < 0) return err("amount must be a non-negative integer");

  // operation: "set" | "add" | "subtract"
  const op = operation ?? "set";

  if (!["set", "add", "subtract"].includes(op)) {
    return err("operation must be set, add, or subtract");
  }

  let sql;
  switch (op) {
    case "set":
      sql = "UPDATE users SET credits = ?, updated_at = datetime('now') WHERE id = ? RETURNING id, username, credits";
      break;
    case "add":
      sql = "UPDATE users SET credits = credits + ?, updated_at = datetime('now') WHERE id = ? RETURNING id, username, credits";
      break;
    case "subtract":
      sql = "UPDATE users SET credits = MAX(0, credits - ?), updated_at = datetime('now') WHERE id = ? RETURNING id, username, credits";
      break;
  }

  const result = await dbRun(sql, [parsed, user_id]);

  if (result.rows.length === 0) return err("User not found", 404);

  logger.info("Admin credits updated", {
    requestId,
    userId: user_id,
    operation: op,
    amount: parsed,
    newCredits: result.rows[0].credits,
  });

  return json({ ok: true, user: result.rows[0] });
}

// GET /persona
async function getPersona(user, requestId) {
  const result = await dbRun(
    `SELECT name, image, sex, age, personality, likes, dislikes, specialization, prompt
     FROM user_personas WHERE user_id = ? LIMIT 1`,
    [user.id]
  );
  logger.info("Persona fetched", { requestId, userId: user.id });
  return json({ persona: result.rows[0] ?? null });
}

// PUT /persona
async function updatePersona(user, body, requestId) {
  const { name, image, sex, age, personality, likes, dislikes, specialization } = body ?? {};

  if (sex && !["male", "female", "undefined"].includes(sex))
    return err("sex must be male, female, or undefined");
  if (age !== undefined && (isNaN(age) || age < 1 || age > 999))
    return err("age must be between 1 and 999");

  const current = await dbRun(
    "SELECT * FROM user_personas WHERE user_id = ? LIMIT 1",
    [user.id]
  );

  const existing = current.rows[0] ?? {
    name: "Assistant", image: null, sex: "undefined", age: 20,
    personality: "calm", likes: "", dislikes: "", specialization: "",
  };

  const merged = {
    name: name ?? existing.name,
    image: image !== undefined ? (image || null) : existing.image,
    sex: sex ?? existing.sex,
    age: age !== undefined ? parseInt(age, 10) : existing.age,
    personality: personality ?? existing.personality,
    likes: likes ?? existing.likes,
    dislikes: dislikes ?? existing.dislikes,
    specialization: specialization ?? existing.specialization,
  };

  const prompt = buildPersonaPrompt(merged);

  await dbRun(
    `INSERT INTO user_personas
       (user_id, name, image, sex, age, personality, likes, dislikes, specialization, prompt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       name           = excluded.name,
       image          = excluded.image,
       sex            = excluded.sex,
       age            = excluded.age,
       personality    = excluded.personality,
       likes          = excluded.likes,
       dislikes       = excluded.dislikes,
       specialization = excluded.specialization,
       prompt         = excluded.prompt,
       updated_at     = datetime('now')`,
    [
      user.id, merged.name, merged.image, merged.sex,
      merged.age, merged.personality, merged.likes,
      merged.dislikes, merged.specialization, prompt,
    ]
  );

  logger.info("Persona updated", { requestId, userId: user.id, name: merged.name });
  return json({ ok: true, persona: { ...merged, prompt } });
}

// ─── Chat Session handlers ────────────────────────────────────────────────────

// GET /sessions — list all sessions
async function listSessions(user, url, requestId) {
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const result = await dbRun(
    `SELECT
       s.id,
       s.title,
       s.model,
       s.created_at,
       s.updated_at,
       COUNT(m.id)                                          AS message_count,
       MAX(m.created_at)                                    AS last_message_at
     FROM chat_sessions s
     LEFT JOIN chat_messages m ON m.session_id = s.id
     WHERE s.user_id = ?
     GROUP BY s.id
     ORDER BY s.updated_at DESC
     LIMIT ? OFFSET ?`,
    [user.id, limit, offset]
  );

  // Total count for pagination
  const countRes = await dbRun(
    "SELECT COUNT(*) AS total FROM chat_sessions WHERE user_id = ?",
    [user.id]
  );

  logger.info("Sessions listed", { requestId, userId: user.id, count: result.rows.length });
  return json({
    sessions: result.rows,
    pagination: {
      total: countRes.rows[0]?.total ?? 0,
      limit,
      offset,
    },
  });
}

// GET /sessions/:id — get session with messages
async function getSession(user, sessionId, url, requestId) {
  // Verify ownership
  const sessionRes = await dbRun(
    "SELECT id, title, model, created_at, updated_at FROM chat_sessions WHERE id = ? AND user_id = ? LIMIT 1",
    [sessionId, user.id]
  );

  if (sessionRes.rows.length === 0) return err("Session not found", 404);

  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const messagesRes = await dbRun(
    `SELECT id, role, content, model, created_at
     FROM chat_messages
     WHERE session_id = ?
     ORDER BY created_at ASC
     LIMIT ? OFFSET ?`,
    [sessionId, limit, offset]
  );

  const countRes = await dbRun(
    "SELECT COUNT(*) AS total FROM chat_messages WHERE session_id = ?",
    [sessionId]
  );

  logger.info("Session fetched", {
    requestId,
    userId: user.id,
    sessionId,
    messages: messagesRes.rows.length,
  });

  return json({
    session: sessionRes.rows[0],
    messages: messagesRes.rows,
    pagination: {
      total: countRes.rows[0]?.total ?? 0,
      limit,
      offset,
    },
  });
}

// PATCH /sessions/:id — update session title
async function updateSession(user, sessionId, body, requestId) {
  const { title } = body ?? {};
  if (!title || !title.trim()) return err("title is required");
  if (title.length > 100) return err("title max 100 characters");

  const result = await dbRun(
    `UPDATE chat_sessions
     SET title = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?
     RETURNING id, title, updated_at`,
    [title.trim(), sessionId, user.id]
  );

  if (result.rows.length === 0) return err("Session not found", 404);

  logger.info("Session title updated", { requestId, userId: user.id, sessionId });
  return json({ session: result.rows[0] });
}

// DELETE /sessions/:id — delete session and all its messages
async function deleteSession(user, sessionId, requestId) {
  // Verify ownership
  const sessionRes = await dbRun(
    "SELECT id FROM chat_sessions WHERE id = ? AND user_id = ? LIMIT 1",
    [sessionId, user.id]
  );

  if (sessionRes.rows.length === 0) return err("Session not found", 404);

  // Delete messages first (FK constraint), then session
  await dbBatch([
    ["DELETE FROM chat_messages  WHERE session_id = ?", [sessionId]],
    ["DELETE FROM chat_sessions  WHERE id = ? AND user_id = ?", [sessionId, user.id]],
  ]);

  logger.info("Session deleted", { requestId, userId: user.id, sessionId });
  return json({ ok: true });
}

// DELETE /sessions — delete ALL sessions for user
async function clearAllSessions(user, requestId) {
  const sessionIds = await dbRun(
    "SELECT id FROM chat_sessions WHERE user_id = ?",
    [user.id]
  );

  if (sessionIds.rows.length > 0) {
    const ids = sessionIds.rows.map(r => r.id);
    // Delete all messages for all sessions
    for (const id of ids) {
      await dbRun("DELETE FROM chat_messages WHERE session_id = ?", [id]);
    }
    await dbRun("DELETE FROM chat_sessions WHERE user_id = ?", [user.id]);
  }

  logger.info("All sessions cleared", { requestId, userId: user.id });
  return json({ ok: true, deleted: sessionIds.rows.length });
}

// ─── Knowledge handlers ───────────────────────────────────────────────────────

// GET /knowledge
async function listKnowledge(user, requestId) {
  const result = await dbRun(
    `SELECT id, source, topic, content, keywords, updated_at
     FROM knowledge WHERE user_id = ? ORDER BY updated_at DESC`,
    [user.id]
  );
  logger.info("Knowledge listed", { requestId, userId: user.id, count: result.rows.length });
  return json({ knowledge: result.rows });
}

// POST /knowledge  { topic, content, keywords? }
async function addKnowledge(user, body, requestId) {
  const { topic, content, keywords: manualKeywords } = body ?? {};

  if (!topic || !content) return err("topic and content required");
  if (user.credits < 1) return err("Insufficient credits", 402);

  if (content.length > MAX_KNOWLEDGE_CHARS) {
    return err(
      `Content too long: ${content.length} chars (max ${MAX_KNOWLEDGE_CHARS}). ` +
      `Split into multiple entries to preserve full content.`,
      400
    );
  }

  if (topic.length > 100) return err("Topic too long: max 100 characters", 400);

  let keywordsStr;
  let keywordSource;

  if (manualKeywords && String(manualKeywords).trim().length > 0) {
    // ✅ Use manual keywords if provided
    const normalized = normalizeKeywords(String(manualKeywords));
    if (normalized.length === 0) return err("keywords must be a non-empty comma-separated string");
    keywordsStr = normalized.join(",");
    keywordSource = "manual";
    logger.info("Using manual keywords", { requestId, topic, keywords: keywordsStr });
  } else {
    // ✅ Auto-extract if blank or not provided
    const extracted = await extractKeywords(topic, content, requestId);
    keywordsStr = extracted.join(",");
    keywordSource = "auto";
  }

  const result = await dbRun(
    `INSERT INTO knowledge (user_id, source, topic, content, keywords)
     VALUES (?, 'user', ?, ?, ?) RETURNING id, topic, content, keywords`,
    [user.id, topic, content, keywordsStr]
  );

  await dbRun("UPDATE users SET credits = credits - 1 WHERE id = ?", [user.id]);

  logger.info("Knowledge added", {
    requestId,
    userId: user.id,
    topic,
    chars: content.length,
    keywords: keywordsStr,
    keywordSource,
  });

  return json({
    knowledge: result.rows[0],
    keyword_source: keywordSource, // tells client if keywords were manual or auto
  }, 201);
}

// PUT /knowledge/:id  { topic?, content?, keywords? }
async function updateKnowledge(user, id, body, requestId) {
  const { topic, content, keywords: manualKeywords } = body ?? {};
  if (!topic && !content && manualKeywords === undefined)
    return err("Provide at least topic, content, or keywords");

  if (content && content.length > MAX_KNOWLEDGE_CHARS) {
    return err(
      `Content too long: ${content.length} chars (max ${MAX_KNOWLEDGE_CHARS}).`,
      400
    );
  }

  if (topic && topic.length > 100) return err("Topic too long: max 100 characters", 400);

  // Fetch current entry
  const current = await dbRun(
    "SELECT topic, content, keywords FROM knowledge WHERE id = ? AND user_id = ? LIMIT 1",
    [id, user.id]
  );

  if (current.rows.length === 0) return err("Knowledge entry not found", 404);

  const existing = current.rows[0];
  const newTopic = topic ?? existing.topic;
  const newContent = content ?? existing.content;

  let keywordsStr;
  let keywordSource;

  if (manualKeywords !== undefined) {
    if (String(manualKeywords).trim().length > 0) {
      // ✅ Use manual keywords if explicitly provided
      const normalized = normalizeKeywords(String(manualKeywords));
      if (normalized.length === 0) return err("keywords must be a non-empty comma-separated string");
      keywordsStr = normalized.join(",");
      keywordSource = "manual";
      logger.info("Using manual keywords for update", { requestId, id, keywords: keywordsStr });
    } else {
      // ✅ keywords set to "" — re-extract automatically
      const extracted = await extractKeywords(newTopic, newContent, requestId);
      keywordsStr = extracted.join(",");
      keywordSource = "auto";
      logger.info("Re-extracting keywords (empty string provided)", { requestId, id });
    }
  } else if (topic || content) {
    // ✅ topic or content changed but no keywords given — re-extract
    const extracted = await extractKeywords(newTopic, newContent, requestId);
    keywordsStr = extracted.join(",");
    keywordSource = "auto";
    logger.info("Re-extracting keywords (topic/content changed)", { requestId, id });
  } else {
    // No change to topic/content/keywords — keep existing
    keywordsStr = existing.keywords;
    keywordSource = "unchanged";
  }

  const fields = [];
  const args = [];

  if (topic) { fields.push("topic = ?"); args.push(newTopic); }
  if (content) { fields.push("content = ?"); args.push(newContent); }
  fields.push("keywords = ?");
  fields.push("updated_at = datetime('now')");
  args.push(keywordsStr, id, user.id);

  const result = await dbRun(
    `UPDATE knowledge SET ${fields.join(", ")}
     WHERE id = ? AND user_id = ? RETURNING id, topic, content, keywords`,
    args
  );

  if (result.rows.length === 0) return err("Knowledge entry not found", 404);

  logger.info("Knowledge updated", {
    requestId,
    userId: user.id,
    id,
    keywords: keywordsStr,
    keywordSource,
  });

  return json({
    knowledge: result.rows[0],
    keyword_source: keywordSource,
  });
}

// DELETE /knowledge/:id
async function deleteKnowledge(user, id, requestId) {
  const result = await dbRun(
    "DELETE FROM knowledge WHERE id = ? AND user_id = ? RETURNING id",
    [id, user.id]
  );
  if (result.rows.length === 0) return err("Knowledge entry not found", 404);
  logger.info("Knowledge deleted", { requestId, userId: user.id, id });
  return json({ ok: true });
}

// ─── Chat handler ─────────────────────────────────────────────────────────────

// POST /chat  { message, session_id? }
async function chat(user, body, requestId) {
  resetOpenRouterErrors();

  const { message, session_id } = body ?? {};
  if (!message || !message.trim()) return err("message is required");
  if (user.credits < CHAT_CREDIT_COST) return err("Insufficient credits", 402);

  const userMsg = message.trim().slice(0, 4000);
  const now = new Date().toISOString();

  // ── Resolve or create session ──────────────────────────────────────────────
  let sessionId = session_id ? parseInt(session_id, 10) : null;
  let isNewSession = false;

  if (sessionId) {
    // Verify session belongs to user
    const sessionCheck = await dbRun(
      "SELECT id FROM chat_sessions WHERE id = ? AND user_id = ? LIMIT 1",
      [sessionId, user.id]
    );
    if (sessionCheck.rows.length === 0) return err("Session not found", 404);
  } else {
    // Create new session with placeholder title
    const sessionRes = await dbRun(
      `INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
       VALUES (?, 'New Chat', ?, ?) RETURNING id`,
      [user.id, now, now]
    );
    sessionId = sessionRes.rows[0].id;
    isNewSession = true;
    logger.info("New session created", { requestId, userId: user.id, sessionId });
  }

  // ── Fetch persona + session history + knowledge in parallel ────────────────
  const [personaRes, historyRes, knowledgeRows] = await Promise.all([
    dbRun("SELECT * FROM user_personas WHERE user_id = ? LIMIT 1", [user.id]),
    dbRun(
      `SELECT role, content FROM chat_messages
       WHERE session_id = ?
       ORDER BY created_at DESC LIMIT ?`,
      [sessionId, CHAT_HISTORY_LIMIT]
    ),
    getRelevantKnowledge(user.id, userMsg),
  ]);

  const persona = personaRes.rows[0];
  const history = historyRes.rows.reverse();

  // ── Build system prompt ────────────────────────────────────────────────────
  let systemPrompt = persona?.prompt || buildPersonaPrompt({
    name: "Assistant", sex: "undefined", age: 20,
    personality: "calm", likes: "", dislikes: "", specialization: "",
  });

  if (knowledgeRows.length > 0) {
    const userProvided = knowledgeRows.filter(k => k.source === "user");
    const aiLearned = knowledgeRows.filter(k => k.source === "ai");

    let knowledgeBlock = "\n\n## Knowledge Base — CHECK THIS FIRST BEFORE EVERY ANSWER\n";
    knowledgeBlock += "This is the ONLY source of truth. If this contradicts your training, follow this.\n\n";

    if (userProvided.length > 0) {
      knowledgeBlock += "### User-Provided Knowledge (highest priority)\n";
      knowledgeBlock += userProvided
        .map((k, i) => `[K${i + 1}] Topic: ${k.topic}\n${k.content}`)
        .join("\n\n");
    }

    if (aiLearned.length > 0) {
      knowledgeBlock += "\n\n### Learned Facts About This User\n";
      knowledgeBlock += aiLearned
        .map(k => `- ${k.topic}: ${k.content}`)
        .join("\n");
    }

    knowledgeBlock += "\n\n--- End of Knowledge Base ---";
    knowledgeBlock += "\nReminder: If the question relates to any topic above, use ONLY the above. Do not add outside information.";
    systemPrompt += knowledgeBlock;
  } else {
    systemPrompt += "\n\n## Knowledge Base\nEmpty — no knowledge has been provided yet.";
  }

  systemPrompt += `\n\nYou are speaking with: ${user.displayname ?? user.username}.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: userMsg },
  ];

  // ── Call AI ────────────────────────────────────────────────────────────────
  const { rawReply, model } = await callOpenRouter(messages, requestId);
  const { reply, actions } = parseReply(rawReply);

  logger.debug("Parsed reply", { requestId, reply, actions });

  // ── Persist messages + update session + deduct credit (batch) ─────────────
  await dbBatch([
    [
      `INSERT INTO chat_messages (user_id, session_id, role, content, model, created_at)
       VALUES (?, ?, 'user', ?, NULL, ?)`,
      [user.id, sessionId, userMsg, now],
    ],
    [
      `INSERT INTO chat_messages (user_id, session_id, role, content, model, created_at)
       VALUES (?, ?, 'assistant', ?, ?, ?)`,
      [user.id, sessionId, reply, model, now],
    ],
    [
      // Keep only last N messages per session
      `DELETE FROM chat_messages
       WHERE session_id = ? AND id NOT IN (
         SELECT id FROM chat_messages WHERE session_id = ?
         ORDER BY created_at DESC LIMIT ?
       )`,
      [sessionId, sessionId, CHAT_HISTORY_LIMIT],
    ],
    [
      `UPDATE chat_sessions
       SET model = ?, updated_at = ?
       WHERE id = ?`,
      [model, now, sessionId],
    ],
    [
      "UPDATE users SET credits = credits - ? WHERE id = ?",
      [CHAT_CREDIT_COST, user.id],
    ],
  ]);

  // ── Auto-generate session title from first message (non-blocking) ──────────
  if (isNewSession) {
    generateSessionTitle(userMsg, requestId).then(async (title) => {
      await dbRun(
        "UPDATE chat_sessions SET title = ? WHERE id = ?",
        [title, sessionId]
      ).catch(e => logger.warn("Failed to update session title", { error: e.message }));
      logger.info("Session title set", { requestId, sessionId, title });
    }).catch(() => { });
  }

  // ── Extract knowledge async (non-blocking) ─────────────────────────────────
  extractKnowledge(userMsg, reply, requestId).then(async (items) => {
    if (items.length === 0) return;
    await dbBatch(
      items.map(item => [
        `INSERT INTO knowledge (user_id, source, topic, content, keywords)
         VALUES (?, 'ai', ?, ?, ?) ON CONFLICT DO NOTHING`,
        [user.id, item.topic, item.content, item.keywords ?? ""],
      ])
    ).catch(e => logger.warn("Failed to save learned knowledge", { error: e.message }));
    logger.info("Knowledge learned", { requestId, userId: user.id, count: items.length });
  }).catch(() => { });

  const creditsRes = await dbRun("SELECT credits FROM users WHERE id = ?", [user.id]);
  const credits = creditsRes.rows[0]?.credits ?? 0;

  logger.info("Chat completed", {
    requestId,
    userId: user.id,
    sessionId,
    model,
    replyChars: reply.length,
    credits,
  });

  return json({
    session_id: sessionId,
    reply,
    actions: actions ?? [],
    model,
    credits_remaining: credits,
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

async function router(request, requestId) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, "") || "/";
  const method = request.method.toUpperCase();

  logger.debug("Route", { requestId, method, pathname });

  // ── Public ────────────────────────────────────────────────────────────────

  if (pathname === "/health") {
    return json({ status: "ok", ts: new Date().toISOString() });
  }

  if (pathname === "/auth/register" && method === "POST") {
    const body = await request.json().catch(() => null);
    return register(body, requestId);
  }

  if (pathname === "/auth/login" && method === "POST") {
    const body = await request.json().catch(() => null);
    return login(body, requestId);
  }

  // ── Auth guard ────────────────────────────────────────────────────────────

  const user = await getUser(request);
  if (!user) {
    logger.warn("Unauthorized", { requestId, pathname });
    return err("Unauthorized — provide Bearer session_token", 401);
  }

  // ── Protected ─────────────────────────────────────────────────────────────

  if (pathname === "/auth/logout" && method === "POST") {
    return logout(user, requestId);
  }

  if (pathname === "/me") {
    if (method === "GET") return getMe(user, requestId);
    if (method === "PATCH" || method === "PUT") {
      const body = await request.json().catch(() => null);
      return updateMe(user, body, requestId);
    }
  }

  if (pathname === "/persona") {
    if (method === "GET") return getPersona(user, requestId);
    if (method === "PUT" || method === "PATCH") {
      const body = await request.json().catch(() => null);
      return updatePersona(user, body, requestId);
    }
  }

  // Chat
  if (pathname === "/chat" && method === "POST") {
    const body = await request.json().catch(() => null);
    return chat(user, body, requestId);
  }

  // Sessions
  if (pathname === "/sessions") {
    if (method === "GET") return listSessions(user, url, requestId);
    if (method === "DELETE") return clearAllSessions(user, requestId);
  }

  const sessionMatch = pathname.match(/^\/sessions\/(\d+)$/);
  if (sessionMatch) {
    const sessionId = parseInt(sessionMatch[1], 10);
    if (method === "GET") return getSession(user, sessionId, url, requestId);
    if (method === "PATCH" || method === "PUT") {
      const body = await request.json().catch(() => null);
      return updateSession(user, sessionId, body, requestId);
    }
    if (method === "DELETE") return deleteSession(user, sessionId, requestId);
  }

  // Knowledge
  if (pathname === "/knowledge") {
    if (method === "GET") return listKnowledge(user, requestId);
    if (method === "POST") {
      const body = await request.json().catch(() => null);
      return addKnowledge(user, body, requestId);
    }
  }

  const knowledgeMatch = pathname.match(/^\/knowledge\/(\d+)$/);
  if (knowledgeMatch) {
    const id = parseInt(knowledgeMatch[1], 10);
    if (method === "PUT" || method === "PATCH") {
      const body = await request.json().catch(() => null);
      return updateKnowledge(user, id, body, requestId);
    }
    if (method === "DELETE") return deleteKnowledge(user, id, requestId);
  }

  // Admin routes — separate auth via ADMIN_TOKEN header
  const adminMatch = pathname.match(/^\/admin\/(.+)$/);
  if (adminMatch) {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) return err("Admin not configured", 503);

    const providedAdmin = request.headers.get("X-Admin-Token") ?? "";
    if (providedAdmin !== adminToken) {
      logger.warn("Admin auth failed", { requestId, pathname });
      return err("Forbidden", 403);
    }

    if (pathname === "/admin/users/credits" && method === "POST") {
      const body = await request.json().catch(() => null);
      return adminUpdateCredits(body, requestId);
    }

    // GET /admin/users/:id — get any user info
    const adminUserMatch = pathname.match(/^\/admin\/users\/(\d+)$/);
    if (adminUserMatch && method === "GET") {
      const userId = parseInt(adminUserMatch[1], 10);
      const result = await dbRun(
        "SELECT id, email, username, displayname, avatar, credits, created_at FROM users WHERE id = ? LIMIT 1",
        [userId]
      );
      if (result.rows.length === 0) return err("User not found", 404);
      return json({ user: result.rows[0] });
    }

    return err("Admin route not found", 404);
  }

  return err("Not found", 404);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

BunnySDK.net.http.serve(async (request) => {
  // ── CORS Preflight ──────────────────────────────────────────────
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Admin-Token",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  const requestId = genId();
  const startTime = Date.now();
  const { method } = request;
  const { pathname } = new URL(request.url);

  logger.info("→ Request", { requestId, method, pathname });

  let response;
  try {
    response = await router(request, requestId);
  } catch (e) {
    logger.error("Unhandled error", { requestId, error: e.message, stack: e.stack });
    response = err(`Internal server error: ${e.message}`, 500);
  }

  console.log("ENV CHECK:", JSON.stringify({
    HAS_API_AUTH_TOKEN: !!process.env.API_AUTH_TOKEN,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    HAS_DATABASE_TOKEN: !!process.env.DATABASE_TOKEN,
    HAS_OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    MODEL_PRIMARY: process.env.MODEL_PRIMARY,
    MODEL_FALLBACK_1: process.env.MODEL_FALLBACK_1,
    MODEL_FALLBACK_2: process.env.MODEL_FALLBACK_2,
    MAX_OUTPUT_TOKENS: process.env.MAX_OUTPUT_TOKENS,
    LOG_LEVEL: process.env.LOG_LEVEL,
    // Uncomment below only for debugging — remove after!
    // API_AUTH_TOKEN: process.env.API_AUTH_TOKEN,
  }));

  logger.info("← Response", {
    requestId,
    method,
    pathname,
    status: response.status,
    ms: Date.now() - startTime,
  });

  // ── CORS Headers on every response ─────────────────────────────
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Admin-Token");
  response.headers.set("X-Request-Id", requestId);
  return response;
});