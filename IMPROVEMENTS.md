# CodeGuardian AI — Improvements Summary

## ✅ What Was Done

### Backend — Security & Architecture

#### 1. MongoDB Integration (Graceful Fallback)
- `Backend/src/config/database.js` — MongoDB connection with auto-fallback to in-memory
- `Backend/src/models/User.js` — Mongoose User model with proper schema validation
- `Backend/src/models/Scan.js` — Mongoose Scan model with indexed queries
- `Backend/src/models/Settings.js` — Mongoose Settings model
- `Backend/src/services/dataService.js` — Unified data layer (works with both MongoDB and memory)
- **To enable MongoDB**: Set `MONGODB_URI` in `.env`

#### 2. Security Headers (Helmet)
- All HTTP responses now include security headers (XSS protection, HSTS, etc.)

#### 3. CORS Fixed
- Was: `cors({ origin: "*" })` — allowed any domain
- Now: Restricted to `ALLOWED_ORIGINS` env variable (localhost in dev, your domain in prod)

#### 4. Rate Limiting
- `Backend/src/middleware/rateLimiter.js`
  - General API: 100 req / 15 min
  - Auth (login): 10 req / 15 min (brute force protection)
  - AI Analysis: 20 req / min (expensive endpoint)
  - OTP: 3 req / 10 min

#### 5. Input Validation (Zod)
- `Backend/src/middleware/validate.js` — Zod schemas for all routes
- Validates: login, register, OTP, analyze, fix, fix-all, profile update, forgot/reset password
- Returns structured error messages with field names

#### 6. bcrypt Rounds: 10 → 12
- More secure password hashing

#### 7. Request Logging (Morgan)
- Dev mode: colored request logs
- Production mode: combined Apache-style logs

#### 8. Global Error Handler
- Catches all unhandled errors
- Hides stack traces in production
- Handles CORS errors and payload-too-large errors

#### 9. 404 Handler
- Returns proper JSON instead of HTML for unknown routes

---

### Auth — Complete Overhaul

#### 10. Refresh Token System
- Access token: 15 minutes (was 7 days)
- Refresh token: 30 days, stored as httpOnly cookie
- Refresh tokens hashed with SHA-256 before storage
- `POST /api/auth/refresh` — issues new access token
- `POST /api/auth/logout` — clears cookie + removes token from DB

#### 11. Password Reset Flow (NEW)
- `POST /api/auth/forgot-password` — sends reset email (rate limited)
- `POST /api/auth/reset-password` — validates token, updates password
- Tokens hashed with SHA-256, expire in 1 hour
- Email enumeration protection (always returns same message)

#### 12. GET /api/auth/me
- Returns current user info from token

---

### Services

#### 13. Email Service
- Moved hardcoded SMTP user to `BREVO_SMTP_USER` env variable
- Added `sendPasswordResetEmail()` with professional HTML template
- FROM address from `EMAIL_FROM` env variable

#### 14. GitHub Service — Real Implementation
- `fetchFileContent(owner, repo, path, ref)` — fetch file from any public repo
- `getRepoInfo(owner, repo)` — get repo metadata
- `listRepoFiles(owner, repo, path, ref)` — list directory contents
- `postPRComment()` — posts real PR comments when `GITHUB_TOKEN` is set
- Falls back to console logging when token not set

---

### Frontend

#### 15. Forgot Password Page (`/forgot-password`)
- Clean UI matching existing design
- Shows success state after email sent

#### 16. Reset Password Page (`/reset-password?token=...`)
- Password strength indicator
- Confirm password validation
- Auto-redirect to login after success

#### 17. Login Page — "Forgot password?" Fixed
- Was: `<a href="#">` (dead link)
- Now: navigates to `/forgot-password`

#### 18. Logout — Real API Call
- Now calls `POST /api/auth/logout` to invalidate refresh token
- Clears httpOnly cookie server-side

#### 19. Central API Utility (`Frontend/src/app/lib/api.ts`)
- Auto-attaches Authorization header
- Auto-refreshes access token on 401 TOKEN_EXPIRED
- Queues concurrent requests during refresh
- Redirects to /login if refresh fails

---

## 🔧 To Enable MongoDB

1. Install MongoDB locally or create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Add to `Backend/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/codeguardian
   # or Atlas:
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/codeguardian
   ```
3. Restart the server — it will auto-migrate

## 🔧 To Enable Real GitHub PR Comments

1. Create a GitHub Personal Access Token with `repo` scope
2. Add to `Backend/.env`:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```

## 🚀 Running the Project

```bash
# Backend
cd Backend
npm run dev

# Frontend
cd Frontend
npm run dev
```
