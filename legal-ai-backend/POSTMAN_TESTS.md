# Legal AI Backend - API Reference & Postman Guide

**Base URL**: `http://localhost:3000/api`

This guide lists **ALL** available API endpoints. Import these into Postman or use cURL to test.

## 1. Authentication Module (`/auth`)

### 1.1 Register New User
**Endpoint**: `POST /auth/register`
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "legal_eagle_01",
    "email": "eagle@law.com",
    "mobile": "9876543210",
    "whatsapp": "9876543210",
    "profession": "lawyer",
    "password": "securepassword123",
    "termsAgreed": "true"
  }'
```
*   **Profession Options**: `lawyer`, `lekhpal`, `csc user`, `individual`, `other`.

### 1.2 Login (Password)
**Endpoint**: `POST /auth/login`
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "legal_eagle_01",
    "password": "securepassword123"
  }'
```
*   **Response**: Returns `token` (JWT) and `userId`. **Save this Token** for protected routes.

### 1.3 Generate OTP (Login/Forgot Password)
**Endpoint**: `POST /auth/otp/generate`
```bash
curl -X POST http://localhost:3000/api/auth/otp/generate \
  -H "Content-Type: application/json" \
  -d '{ "username": "legal_eagle_01" }'
```
*   *Note: OTP is logged in the server terminal (Mock Mode).*

### 1.4 Login (OTP)
**Endpoint**: `POST /auth/login`
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "legal_eagle_01",
    "otp": "123456"
  }'
```

### 1.5 Reset Password
**Endpoint**: `POST /auth/password/reset`
```bash
curl -X POST http://localhost:3000/api/auth/password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "username": "legal_eagle_01",
    "otp": "123456",
    "newPassword": "newPassword789"
  }'
```

### 1.6 Logout
**Endpoint**: `POST /auth/logout`
```bash
curl -X POST http://localhost:3000/api/auth/logout
```


### 1.7 Admin Login (Dedicated)
**Endpoint**: `POST /auth/admin/login`

**Option A: Password Login**
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "password": "adminpassword"
  }'
```

**Option B: OTP Login**
1. Get OTP via `/auth/otp/generate` first.
2. Login with OTP:
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "otp": "123456"
  }'
```

### 1.8 Admin Register (One-time/Secret)
**Endpoint**: `POST /auth/admin/register`
```bash
curl -X POST http://localhost:3000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "super_admin",
    "email": "admin@hq.com",
    "password": "strongadminpass",
    "adminSecret": "YOUR_ADMIN_SECRET_FROM_ENV"
  }'
```


---

## 2. Wallet & Payment (`/wallet`)
**Auth Required**: Headers: `Authorization: Bearer <YOUR_JWT_TOKEN>`

### 2.1 Get Wallet Balance
**Endpoint**: `GET /wallet/balance`
```bash
curl -X GET http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 2.2 Create Payment Order (Razorpay)
**Endpoint**: `POST /wallet/create-order`
```bash
curl -X POST http://localhost:3000/api/wallet/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "amount": 500
  }'
```

### 2.3 Verify Payment & Recharge
**Endpoint**: `POST /wallet/verify-payment`
```bash
curl -X POST http://localhost:3000/api/wallet/verify-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "amount": 500,
    "razorpay_order_id": "order_Obs...",
    "razorpay_payment_id": "pay_Obs...",
    "razorpay_signature": "signature_here"
  }'
```

---

## 3. Subscription Module (`/subscription`)
**Auth Required** (except Plans): `Authorization: Bearer <YOUR_JWT_TOKEN>`

### 3.1 Get Subscription Plans
**Endpoint**: `GET /subscription`
```bash
curl -X GET http://localhost:3000/api/subscription
```

### 3.2 Create Subscription Order
**Endpoint**: `POST /subscription/create-order`
```bash
curl -X POST http://localhost:3000/api/subscription/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "plan": "pro" 
  }'
```
*   **Plans**: `pro`, `csc`.

### 3.3 Verify Subscription Payment
**Endpoint**: `POST /subscription/verify`
```bash
curl -X POST http://localhost:3000/api/subscription/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "plan": "pro",
    "razorpay_order_id": "...",
    "razorpay_payment_id": "...",
    "razorpay_signature": "..."
  }'
```

---

## 4. Legal AI Chat (`/api`)

### 4.1 Token Usage Stats
**Endpoint**: `GET /token/:userId`
```bash
curl -X GET http://localhost:3000/api/token/USER_ID_HERE
```

### 4.2 Standard Legal Advice / Compare / General (JSON)
**Endpoint**: `POST /chat`
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "message": "What is the meaning of life?",
    "mode": "general",
    "model": "gemini-1.5-pro",
    "language": "English"
  }'
```
*   **Modes**: `advice`, `draft`, `compare`, `general`.

### 4.3 Chat with File Upload (Multipart)
**Endpoint**: `POST /chat`
```bash
curl -X POST http://localhost:3000/api/chat \
  -F "userId=USER_ID_HERE" \
  -F "message=Analyze this contract" \
  -F "mode=draft" \
  -F "file=@/path/to/contract.pdf"
```

### 4.4 Streaming Chat
**Endpoint**: `POST /stream`
```bash
curl -N -X POST http://localhost:3000/api/stream \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "message": "Explain FIR process.",
    "mode": "advice"
  }'
```


### 4.5 Chat History
**Endpoint**: `GET /chat/history`
```bash
curl -X GET http://localhost:3000/api/chat/history \
  -H "Authorization: Bearer <TOKEN>"
```

### 4.6 Delete Specific Chat Message
**Endpoint**: `DELETE /chat/history/:id`
```bash
curl -X DELETE http://localhost:3000/api/chat/history/MESSAGE_ID_HERE \
  -H "Authorization: Bearer <TOKEN>"
```

### 4.7 Clear All Chat History
**Endpoint**: `DELETE /chat/history`
```bash
curl -X DELETE http://localhost:3000/api/chat/history \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 5. Admin Module (`/admin`)
**Auth Required**: `Authorization: Bearer <ADMIN_TOKEN>`

**Role Required**: User must have `role: admin` in DB.

### 5.1 Dashboard Stats
**Endpoint**: `GET /admin/stats`
```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 5.2 List All Users
**Endpoint**: `GET /admin/users`
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 6. User & Profile Management (`/users`)
**Auth Required**: `Authorization: Bearer <TOKEN>`

### 6.1 Get My Profile
**Endpoint**: `GET /users/profile`

### 6.2 Update My Profile
**Endpoint**: `PUT /users/profile`
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "username": "new_username",
    "mobile": "9999999999",
    "password": "newSecurePassword123"
  }'
```

### 6.3 Delete My Account
**Endpoint**: `DELETE /users/profile`

---

## 7. Admin: User Control ("Zero to Hero") (`/users/:id`)
**Auth Required**: `Authorization: Bearer <ADMIN_TOKEN>`
**Note**: Admin uses the same endpoints but with a target `userId` in the URL.

### 7.1 Get Any User Profile
**Endpoint**: `GET /users/:id`

### 7.2 Update Any User Profile (Force Update)
**Endpoint**: `PUT /users/:id`
```bash
curl -X PUT http://localhost:3000/api/users/TARGET_USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "profession": "Supreme Court Judge"
  }'
```

### 7.3 Delete Any User (Ban/Remove)
**Endpoint**: `DELETE /users/:id`

---

## 8. System & Owner Configuration (`/admin/config`)
**Auth Required**: `Authorization: Bearer <ADMIN_TOKEN>`

### 8.1 Update Subscription Plans (Dynamic Pricing)
**Endpoint**: `POST /admin/config`
```bash
curl -X POST http://localhost:3000/api/admin/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "key": "subscription_plans",
    "value": {
        "student": 199,
        "professional": 999,
        "citizen": 0,
        "enterprise": 4999
    }
  }'
```

### 8.2 Update AI Token Costs
**Endpoint**: `POST /admin/config`
```bash
curl -X POST http://localhost:3000/api/admin/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "key": "model_pricing",
    "value": {
        "gemini-ultra": 0.05,
        "gemini-1.5-flash": 0.005,
        "default": 0.01,
    },
   };
```
