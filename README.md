# The British Vanity — AI Chatbot Backend

Standalone Express + TypeScript service for the AI shopping assistant.

This project runs **independently** from the e-commerce monorepo at `../the-british-vanity`.

## Features

- Chat API with text and image support
- OpenRouter (chat + vision)
- OpenAI embeddings (with OpenRouter fallback)
- Qdrant vector search (RAG)
- MongoDB product search fallback
- Policy answers via e-commerce API (placeholder)

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Default port: **5001**

## API routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/chat` | Text or text+image chat |
| POST | `/api/chat/image` | Image-required chat |
| POST | `/api/qdrant/create-collection` | Create Qdrant collection |
| POST | `/api/qdrant/index-products` | Index products into Qdrant |
| POST | `/api/qdrant/search` | Semantic product search |
| GET | `/health` | Health check |

## Environment

See `.env.example`. Uses the **same MongoDB** and **Qdrant** instance as the e-commerce backend.

## Related projects

| Project | Path | Port |
|---------|------|------|
| E-commerce | `../the-british-vanity` | 5000 (API), 3000 (frontend) |
| Chatbot | `./` | 5001 |

## Deploy

This repo is ready to be pushed to its own GitHub repository and deployed separately.
