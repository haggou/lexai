# Admin Panel Documentation

## 1. Overview
The Admin Panel is a centralized dashboard for managing the LexAI application. It includes user management, feature toggling, subscription monitoring, and system announcements. It is protected by a secondary login authentication flow.

## 2. User Guide

### Features
*   **Dashboard**: View high-level metrics like active users and system status.
*   **User Management**: View all registered users, assign roles (e.g., promote to Admin), and block/unblock access.
*   **Feature Flags**: Iinstantly enable or disable global features (e.g., "Maintenance Mode", "Beta Features").
*   **Subscription Overview**: Track revenue and user distribution across Citizen, Student, and Professional plans.
*   **Announcements**: Post system-wide notices that appear to all users.
*   **Audit Logs**: View a history of critical system actions (logins, upgrades, errors).

### How to Use
1.  **Access**: Login with an account marked as `role: 'admin'`.
2.  **Navigation**: Use the sidebar to switch between Users, Plans, Features, Notices, and Logs.
3.  **Actions**: 
    *   Click "Block" on a user row to suspend their account.
    *   Toggle switches in the "Features" tab to control app functionality live.
    *   Type a message in "Notices" and click Post to broadcast.

---

## 3. Developer Guide

### File Structure
*   **Component**: `src/components/Admin/AdminPanel.js`
*   **Context**: `src/contexts/AdminContext.js`
*   **Styles**: `src/components/Admin/AdminPanel.module.css`

### security logic
*   **Client-Side Protection**: The `AdminPanel` component performs a check against `isAdmin` from context. If false, it renders the `AdminLoginScreen`.
*   **Authentication**: The login screen expects credentials that validate against `/api/auth/login`. After successful auth, it calls `checkAdminStatus()` to verify the user has admin privileges.

### Context API (`AdminContext`)
*   `config`: Stores the fetched state (`users`, `features`, `announcements`).
*   `actions`: Methods like `toggleUserBlock`, `addAnnouncement` that hit the API and update local state optimistically.

---

## 4. Backend Reference

### API Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Fetch full admin config (users, features, etc). Requires `x-user-id` header. |
| `PATCH` | `/api/admin/users/:id/block` | Toggle block status for a user. |
| `PATCH` | `/api/admin/users/:id/role` | Update a user's role (e.g., user -> admin). |
| `PATCH` | `/api/admin/features/:key` | Enable/Disable a specific feature flag. |
| `POST` | `/api/admin/announcements` | Create a new system announcement. |
| `DELETE` | `/api/admin/announcements/:id` | Remove an announcement. |

### Configuration Object Structure
```json
{
  "users": [{ "id": "...", "username": "...", "role": "admin", "blocked": false, "plan": "student" }],
  "features": { "maintenanceMode": false, "betaAccess": true },
  "announcements": [{ "id": "1", "text": "System maintenance at midnight." }]
}
```
