# 🦅 LexAI / Vidhi AI Ecosystem - Master Architecture & Feature Guide

> **"Stop guessing law. Start auditing it."**  
> An ultra-premium, cyber-lawyer ecosystem bridging the gap between legacy Indian Law (IPC/CrPC) and the new era (BNS/BNSS).

---

## 🧠 1. The Core Intelligence (Vidhi AI)
*The central AI engine powering accurate, citation-backed legal assistance.*

### A. Consumer Modules
1.  **Vidhi Cyber-Lawyer (New!)**: 
    *   A futuristic, "Dark Mode" landing page for instant document audits.
    *   **Smart Audit Hero**: Drag-and-drop contract scanning with "Laser Scan" animations.
    *   **Risk Radar**: Real-time visual risk meter (0-100%) detecting dangerous clauses.
    *   **Sachet Wallet**: "Pay-per-use" micro-transactions for audits instead of heavy subscriptions.
2.  **AI Legal Advice**: 
    *   Expert consultation on Indian Law with precise section citations.
    *   **Dual-Era Knowledge**: Trained on both Old Laws (IPC) and New Laws (BNS).
3.  **Legal Drafting Engine**: 
    *   Generates complex PDFs (Rent Agreements, Affidavits, Notices) using expert boilerplates.
    *   **Analysis Mode**: Reviews user-uploaded drafts for loopholes.
4.  **Nyaya-Tulna (Comparisons)**: 
    *   Intelligently compares "Old Laws" (e.g., IPC 420) vs "New Laws" (e.g., BNS 318).
    *   Highlight differences in punishment, procedure, and burden of proof.
5.  **Voice Agent (The Orb)**: 
    *   Real-time, hands-free voice interaction using low-latency WebSockets.
    *   Features a futuristic visualizer ("The Orb") that pulses with speech.

### B. Accuracy & Safety
1.  **Hallucination Check (Satya-Check)**: 
    *   A secondary AI layer (Auditor) verifies every citation against a ground-truth database.
    *   Flags fake laws or misquoted sections immediately.
2.  **RAG (Retrieval-Augmented Generation)**: 
    *   **Vector Search**: Uses Embeddings to search a curated Knowledge Base of Indian Acts.
    *   **Hybrid Fallback**: detailed fallback from MongoDB Atlas to In-Memory Cosine Similarity.

---

## 💻 2. The Platform (LexAI Portal)
*The user interface where professionals manage their practice.*

1.  **Wallet & Subscription System**:
    *   **Token Balance**: Real-time deduction for every AI action.
        *   *Legal Advice*: ~1 Token
        *   *Risk Audit*: ~5 Tokens
        *   *Pro Drafting*: ~10 Tokens
    *   **Tiered Access**:
        *   **Silver (Free)**: Basic access.
        *   **Gold (Student)**: Unlimited Chat, Basic Drafting.
        *   **Diamond (Professional)**: All Models (Gemini Ultra), Advanced Drafting.
        *   **Premium (Enterprise)**: Dedicated support & API access.
2.  **Secure Authentication**:
    *   Login via Password/OTP.
    *   WhatsApp/Phone Verification.
    *   Role-Based Access Control (Lawyers vs. Citizens).

---

## 🛡️ 3. The Fortress (Backend & Admin)
*The "Aegis Prime" backend ensuring scalability and security.*

1.  **Aegis Prime Admin Dashboard**:
    *   **Live Configuration**: Edit system prompts (`advice.md`, `risk.md`) without redeploying.
    *   **Dynamic AI Inference**:
        *   **Creativity Control**: Adjust "Temperature" (0-1) per feature (e.g., Drafting vs. Brainstorming).
        *   **Model Override**: Force specific models (e.g., Gemini 1.5 Pro) for critical tasks like Risk Audits.
    *   **User Management**: Manually adjust balances, ban users, or upgrade roles.
    *   **Analytics**: Real-time revenue tracking and token usage audits.
    *   **Vertex AI Switch**: Toggle between Google AI Studio (API Key) and Google Cloud Vertex AI at the click of a button.
2.  **Performance Engineering**:
    *   **Redis Caching**: Caches identical legal queries for 1 hour (<50ms response).
    *   **Rate Limiting**: Custom tiered limits (1000 req/15min) to prevent abuse.
3.  **Infrastructure**:
    *   **Dockerized**: Fully containerized for Kubernetes/AWS ECS.
    *   **Auto-Deployment**: Integrated `gcloud` deployment sequences for rapid updates.

---

## 🔔 4. Real-Time Notification Ecosystem (Lex Pulse)
*A high-frequency socket layer for instant alerts and system monitoring.*

1.  **User Channels (`user_{id}`)**:
    *   **Financial Itch**: Instant alert when wallet balance drops below ₹10.
    *   **Accuracy Itch**: "Satya-Check Completed" notification when an audit finishes.
    *   **Security**: Login alerts and new device warnings.
2.  **Admin Pulse (`admin_pulse`)**:
    *   **Live Operations Feed**: Admin Dashboard widget showing real-time system events.
    *   **Critical Events**: Visualizes 401 Unauthorized spikes, Vertex API failovers, and High-Value Transactions.
3.  **Architecture**:
    *   **Redis Adapter**: Socket.io horizontal scaling using Redis Pub/Sub.
    *   **Toast System**: Non-intrusive UI popups (`react-hot-toast`) for immediate feedback.
    *   **Notification Center**: Persistent history of all alerts with "Mark as Read" capability.

---

## 🧪 5. Quality Assurance (Testing Strategy)
*Ensuring reliability before every release.*

### A. Automated Logic Tests (`npm test`)
We use **Jest** and **Supertest** to validate business logic without incurring API costs.
*   **Auth Tests**: Verify registration, login, and token generation.
*   **Chat Tests**: Mock the Gemini API to test balance deduction logic (e.g., ensuring usage *actually* decreases the wallet).
*   **Rate Limit Tests**: Verify that spammers are blocked after N requests.

### B. Chaos / Load Testing (Manual)
*   **Disconnect DB**: The system should gracefully fail or switch to in-memory fallbacks.
*   **High Concurrency**: Simulate 100 simultaneous users (using `k6` or `Apache Bench`) to ensure the Node.js event loop doesn't block.

### C. Compliance Testing (The Satya Protocol)
*   **Citation Audit**: Randomly sample 10 generated responses daily.
*   **Manual Verify**: Check if the cited Section 318 BNS actually matches the official Gazette text.

---

## 🚀 6. Future Roadmap
*   **Court API Integration**: Real-time case status fetching from eCourts services.
*   **Judge Analytics**: Analyze past judgments of specific judges to predict case outcomes.
*   **Mobile App**: Dedicated React Native app with biometric login and offline drafting support.

---
**Maintained by: Codebase Administrator**  
*Last Updated: 2026-01-19*
