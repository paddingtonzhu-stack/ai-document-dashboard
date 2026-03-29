# AI Document Dashboard

Upload a PDF or TXT document and receive an AI-generated summary and key points. All results are stored in a local SQLite database and browsable via a history view.

---

## Project Structure

```
ai-document-dashboard/
├── backend/
│   ├── db/
│   │   └── database.js       # SQLite connection & schema
│   ├── routes/
│   │   └── documents.js      # Express routes
│   ├── services/
│   │   ├── aiService.js      # Summarization logic (mock — swap for real AI)
│   │   └── documentService.js# Database CRUD helpers
│   ├── uploads/              # Temp upload directory (auto-created)
│   ├── server.js             # Express entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── views/
    │   │   ├── Upload.vue    # Page 1: file upload + results
    │   │   └── History.vue   # Page 2: past documents
    │   ├── services/
    │   │   └── api.js        # Fetch wrappers for backend
    │   ├── router/
    │   │   └── index.js      # Vue Router config
    │   ├── App.vue           # Root layout + global styles
    │   └── main.js
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v8 or later

---

## Getting Started

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 3. Run the backend

```bash
cd backend
npm start
# or for auto-reload during development:
npm run dev
```

The API server starts at **http://localhost:3001**.

### 4. Run the frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

The app is available at **http://localhost:5173**.

---

## API Reference

| Method | Endpoint        | Description                              |
|--------|-----------------|------------------------------------------|
| POST   | `/api/upload`   | Upload a PDF/TXT file; returns summary   |
| POST   | `/api/summarize`| Summarize raw text in request body       |
| GET    | `/api/history`  | List all previously processed documents  |

### POST /api/upload

**Content-Type:** `multipart/form-data`  
**Field:** `document` (file — PDF or TXT, max 10 MB)

**Response:**
```json
{
  "id": 1,
  "filename": "report.pdf",
  "summary": "...",
  "keyPoints": ["...", "..."],
  "created_at": "2024-03-01 12:00:00"
}
```

### POST /api/summarize

**Content-Type:** `application/json`  
**Body:** `{ "text": "...", "filename": "optional-name.txt" }`

### GET /api/history

Returns an array of document objects (same shape as upload response).

---

## Swapping in Real AI

Open `backend/services/aiService.js` and replace the `summarize` function body with a call to your preferred provider (OpenAI, Anthropic, etc.):

```js
// Example with OpenAI
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function summarize(text) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Summarize the document and list 5 key points as JSON: { summary, keyPoints }' },
      { role: 'user', content: text },
    ],
  });
  return JSON.parse(response.choices[0].message.content);
}
```

> Remember to make the route handler in `routes/documents.js` `async` and `await summarize(text)`.

---

## Notes

- The SQLite database file (`data.db`) is created automatically in the `backend/` directory on first run.
- Uploaded files are deleted from disk after text extraction; only the extracted text is persisted.
