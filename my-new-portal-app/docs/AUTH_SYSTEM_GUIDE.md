# Authentication System Documentation

## 1. Overview
The Authentication System handles user registration and login. It supports extended user profiles (professions), standard password-based login, and a specialized OTP (One Time Password) flow.

## 2. User Guide

### Features
*   **Registration**: Sign up with Username, Email, and Mobile.
*   **Profession Selection**: Categorize yourself as a Lawyer, CSC User, Lekhpal, Individual, or a custom profession.
*   **Login Modes**:
    *   **Password**: Standard secure login.
    *   **OTP**: Login using a code sent to your mobile device (simulated).
*   **Session Persistence**: Keeps you logged in across browser refreshes.

### How to Use
1.  **Register**: Fill in the required details. If your profession is "Other", specify it in the text box.
2.  **Login**: Enter your credentials. Toggle "Login with OTP" if you prefer code-based access.
3.  **OTP**: Click "Get OTP". In Dev Mode, check the browser alert/console for the status.

---

## 3. Developer Guide

### File Structure
*   **Component**: `src/components/Auth/AuthPage.js`
*   **Styles**: `src/components/Auth/AuthPage.css`

### Implementation Details
*   **Form Handling**: A single component handles both Login and Registration, toggled via state `isLogin`.
*   **Profession Logic**: The backend requires a `profession` field. If "Other" is selected in the dropdown, the value of the custom input `otherProfession` is sent as the `profession` field.
*   **OTP Logic**: Currently mocked. The `handleGenerateOtp` function sends a request, but the backend is expected to just log the OTP for now.

### Local Storage Keys
*   `lexai_userid`: The unique MongoDB/DB ID of the logged-in user.
*   `lexai_username`: Display name.

---

## 4. Backend Reference

### API Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user. Payload includes `profession`. |
| `POST` | `/api/auth/login` | Login with username/password or username/otp. Returns `userId`. |
| `POST` | `/api/auth/otp/generate` | Trigger OTP generation for a given username. |

### User Schema (Reference)
```json
{
  "username": "String",
  "email": "String",
  "mobile": "String",
  "password": "Hash",
  "profession": "String (e.g., 'Lawyer', 'Lekhpal')",
  "role": "String (default 'user')",
  "plan": "String (default 'citizen')"
}
```
