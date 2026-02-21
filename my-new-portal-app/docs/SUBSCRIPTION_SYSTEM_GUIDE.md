# Subscription & Payment Documentation

## 1. Overview
The Subscription System manages user access tiers (Citizen, Student, Professional). It integrates with Razorpay for payment processing and uses a React Context to gate features within the application dynamically.

## 2. User Guide

### Plans
1.  **Citizen (Free)**: Basic access, standard AI model (Gemini Flash), limited daily queries.
2.  **Student (₹199/mo)**: Unlimited chat, access to Gemini Pro, basic drafting tools.
3.  **Professional (₹999/mo)**: Full access, Gemini Ultra, advanced drafting, priority support.

### How to Upgrade
1.  Navigate to the **Pricing** page.
2.  Click "Subscribe Now" on your desired plan.
3.  A **Razorpay** checkout modal will appear.
4.  Complete the payment. Upon success, your account is instantly upgraded.

---

## 3. Developer Guide

### File Structure
*   **Context**: `src/contexts/SubscriptionContext.js`
*   **Page**: `src/components/Pages/PricingPage.js`
*   **Integration**: Uses `razorpay` script loaded dynamically.

### Logic
*   **Gating**: The `SubscriptionContext` exposes `checkPermission(feature)` and `getModelAccess()`.
*   **Example Usage**:
    ```javascript
    const { checkPermission } = useSubscription();
    if (checkPermission('drafting')) { /* Show Editor */ }
    ```
*   **Razorpay Flow**:
    1.  Frontend requests order creation (mocked/API).
    2.  Razorpay Modal opens with Order ID.
    3.  User pays.
    4.  `handler` callback receives `payment_id`, `signature`.
    5.  Frontend calls backend verification endpoint (or optimistically upgrades for demo).

---

## 4. Backend Reference

### API Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/subscription/status/:userId` | Get current plan details for a user. |
| `POST` | `/api/subscription/create-order` | Create Razorpay Order ID. Body: `{ amount }`. |
| `POST` | `/api/subscription/verify` | Verify payment signature and update DB. Body: `{ payment_id, order_id, signature, userId, planId }`. |
| `POST` | `/api/subscription/upgrade` | Manually/Directly switch plan (used for Free tier). |

### Plan Constants
```javascript
// Stored in Context and Backend
const PLANS = {
    CITIZEN: { id: 'citizen', price: 0 },
    STUDENT: { id: 'student', price: 199 },
    PROFESSIONAL: { id: 'professional', price: 999 }
};
```
