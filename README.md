# Legal AI Backend

A modular Node.js backend for a Legal AI Assistant, optimized for the Indian Law context.

## Features
- **Legal Advice**: Answers queries in the context of Indian Law (IPC/CrPC/IEA and **BNS/BNSS/BSA**).
- **Multilingual Support**: Supports queries and responses in Indian languages.
- **Document Analysis**: Upload PDF/Images for summarization and analysis (Gemini & Sarvam AI).
- **Gemini Live**: Low-latency voice interaction via WebSockets.
- **Streaming**: Real-time response streaming for chat.
- **Notifications**: Real-time system and personal notifications.
- **Data Persistence**: Stores valid chat history in MongoDB.
- **Cloud Agnostic**: Switch between Gemini API and Google Cloud Vertex AI instantly.
- **Admin Deployment**: Deploy/Undeploy to Cloud Run directly from the Admin Panel.
- **SSL/HTTPS**: Secure communication via Nginx integration.

## Tech Stack
- Node.js & Express
- Google Gemini AI (via `@google/generative-ai`)
- Sarvam AI (Document extraction)
- MongoDB (via `mongoose`)
- Socket.io (Real-time notifications & Voice)
- Nginx (SSL & Proxy)

## Setup

1.  **Clone the repository**.
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
    - `SARVAM_API_KEY`: For document analysis.

4.  **Run the Server**:
    ```bash
    # Development mode
    npm start
    ```

## API Endpoints
See [POSTMAN_TESTS.md](./POSTMAN_TESTS.md) for a full list of endpoints and test cases.

## Project Structure
- `config/`: Database and system configuration.
- `controller/`: Request handling logic.
- `models/`: Database models.
- `router/`: API route definitions.
- `services/`: External service integration (AI, Notifications).
- `middleware/`: Auth and error handling.
- `scripts/`: Devops and SSL scripts.

---
**Maintained by: Codebase Administrator**  
*Last Updated: 2026-02-23*
