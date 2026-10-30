# FESTOS AI - Copilot Integration Specification

This document describes the **FESTOS AI Fest Assistant** backend used by the floating student chatbot.

---

## Endpoint Details

- **Path**: `POST /api/ai/chat`
- **Content-Type**: `application/json`
- **Authentication**: Server-side configured `GEMINI_API_KEY` in environment variables or Google AI Studio Secrets.

---

## Request Format

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Can you check if there are any venue scheduling conflicts on Day 1 of TechNova?"
    }
  ],
  "festContext": {
    "festId": "fest_technova_2026",
    "fest": { "name": "TechNova 2026", "collegeName": "National Institute of Technology Karnataka Surathkal" },
    "events": [],
    "venues": [],
    "budgetItems": []
  }
}
```

### Request Fields:
- `messages` (required, array): List of chat message objects containing `role` (`"user"` | `"assistant"`) and `content` (string).
- `festContext` (optional, object): Active fest profile plus event, venue, and budget records. This context grounds model answers in planner data.

---

## Responses

### 1. Success Response (`200 OK`)
When `GEMINI_API_KEY` is configured and valid:

```json
{
  "reply": "Based on TechNova 2026's schedule, you currently have 1 critical venue collision: CodeSprint and Valorant LAN Championship have both requested the Alan Turing Computing Center. I recommend moving Valorant to Day 2 or shifting its start time to 18:30 after the hackathon wraps up.",
  "model": "gemini-3.8-flash",
  "timestamp": "2026-10-30T04:55:00.000Z"
}
```

### 2. Service Unavailable / Pending Configuration (`503 Service Unavailable`)
When `GEMINI_API_KEY` is unset or set to the default placeholder:

```json
{
  "error": "GEMINI_API_NOT_CONFIGURED",
  "status": "pending_configuration",
  "message": "Gemini AI API key is not configured in the server environment. Add GEMINI_API_KEY to your environment variables or AI Studio Secrets panel.",
  "contract": {
    "method": "POST",
    "endpoint": "/api/ai/chat",
    "expectedPayload": { ... }
  }
}
```

### 3. Invalid Request Payload (`400 Bad Request`)
```json
{
  "error": "INVALID_PAYLOAD",
  "message": "Request body must contain a non-empty \"messages\" array."
}
```

---

## Local Development & Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate `GEMINI_API_KEY`:
   ```bash
   GEMINI_API_KEY="AIzaSyYourActualGeminiApiKey"
   ```
3. Start the fullstack development server:
   ```bash
   npm run dev
   ```
4. Verify server health:
   ```bash
   curl http://localhost:3000/api/health
   ```
