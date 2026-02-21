# Legal Assistant & Chat Portal Documentation

## 1. Overview
The Legal Assistant is the core interface of the LexAI Portal. It provides users with an AI-powered chat interface to draft legal documents, compare contracts, and seek legal advice. It supports multiple AI models (Gemini Pro, Flash, Ultra) based on the user's subscription plan.

## 2. User Guide

### Features
*   **Multi-Model Chat**: Switch between 'Gemini 1.5 Pro' (Reasoning), 'Flash' (Speed), and 'Ultra' (Deep Analysis).
*   **Mobile-First Design**: Fully responsive layout with auto-closing sidebars, touch-friendly inputs, and horizontal scrolling suggestions for mobile users.
*   **Drafting Mode**: Automatically detects requests like "Draft an NDA" and opens a dedicated Live Editor canvas (optimized for mobile & desktop).
*   **Voice Input**: Speak your query using the microphone button.
*   **Document Context**: Upload PDF/text files to have the AI analyze them.
*   **History Management**: View, load, and delete previous conversation sessions. Sidebar behaves as a drawer on mobile.
*   **Advanced Export**: Save generated drafts as **PDF** or formatted **DOCX** files directly from the editor.

### How to Use
1.  **Select a Model**: Use the top-right dropdown (accessible on mobile) to choose your AI model.
2.  **Chat**: Type your query or use Voice.
3.  **Mobile Navigation**:
    *   **Sidebar**: Open via the top-left menu button. Auto-closes when you select a chat or start a new case.
    *   **Suggestions**: Swipe horizontally to view prompt suggestions on small screens.
4.  **Drafting**: Ask for a contract. The Editor opens automatically. On mobile, it covers the screen for focused editing. Use the 'Close' button to return to chat.
5.  **Export**: In the Editor, use "Save PDF" or "Save DOCX" buttons.

---

## 3. Developer Guide

### File Structure
*   **Component**: `src/components/LegalPortalPage/LegalAssistantPage.js`
*   **Styles**: `src/components/LegalPortalPage/LegalAssistantPage.css` (Mobile-first CSS with media queries)
*   **Context**: Uses `SubscriptionContext` for permission gating.

### Key Components
*   `LegalAssistantPage`: Main container. Manages chat state, UI layout, and responsive logic (sidebar toggle ref).
*   `apiService`: Internal object handling API calls.
*   `scrollToBottom`: Custom logic with `messagesEndRef` to ensure chat view stays updated.

### UI/UX Improvements
*   **Horizontal Scroll**: `.suggested-grid` uses CSS Grid on desktop and Flex+ScrollSnap on mobile.
*   **Responsive Tables**: Markdown tables in chat bubbles are scrollable on small screens.
*   **Auto-Close Sidebar**: logic in `handleLoadChat` checks `window.innerWidth` to improve UX on mobile.

---

## 4. Backend Reference

### API Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/chat/stream` | Stream AI response. Body: `{ userId, chatId, message, mode, model }`. |
| `GET` | `/api/chat/history?userId=` | Retrieve all chat sessions for a user. |
| `DELETE` | `/api/chat/history/:chatId` | Permanently delete a conversation. |
| `GET` | `/api/wallet/balance` | Get current wallet balance. |

### Data Model (Expected)
```json
// Chat Object
{
  "_id": "string",
  "userId": "string",
  "userMessage": "string",
  "aiResponse": "string",
  "timestamp": "Date",
  "mode": "string"
}
```
