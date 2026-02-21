# Legal AI Backend

A modular Node.js backend for a Legal AI Assistant, optimized for Indian Law context.

## Features
- **Legal Advice**: answers queries in the context of Indian Law.
- **Multilingual Support**: Supports queries and responses in Indian languages.
- **Document Analysis**: Upload PDF/Images for summarization and analysis.
- **Streaming**: Real-time response streaming.
- **Data Persistence**: Stores valid chat history in MongoDB.
- **Cloud Agnostic**: Switch between Gemini API and Google Cloud Vertex AI instantly.
- **Admin Deployment**: Deploy/Undeploy to Cloud Run directly from the Admin Panel.

## Tech Stack
- Node.js & Express
- Google Gemini AI (via `@google/generative-ai`)
- MongoDB (via `mongodb` driver)
- Multer (File uploads)

## Setup

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in your keys.
    ```bash
    cp .env.example .env
    ```
    - `GEMINI_API_KEY`: Get this from Google AI Studio.
    - `MONGODB_URI`: Connection string for your MongoDB instance.

4.  **Run the Server**:
    ```bash
    # Development mode
    npm start
    ```

## API Endpoints

### `POST /api/chat`
Standard chat endpoint.
- **Body**:
  - `message`: (string) User query.
  - `model`: (string) details e.g., "gemini-1.5-pro".
  - `language`: (string) Output language.
  - `file`: (Multipart) Optional file upload.

### `POST /api/chat/stream`
Streaming chat endpoint.
- **Body**:
  - `message`: (string) User query.
  - `model`: (string) "gemini-1.5-pro".
  - `mode`: (string) "advice", "draft", or "compare".

## Project Structure
- `config/`: Database configuration.
- `controller/`: Request handling logic.
- `models/`: Database models.
- `router/`: API route definitions.
- `services/`: External service integration (AI).
