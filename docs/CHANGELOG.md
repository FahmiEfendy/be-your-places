# Your Places — Backend Changelog

All notable changes to the backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Planned
- Add comprehensive `.gitignore` and `.dockerignore`

---

## [1.1.0] — 2026-07-29

### Added
- `helmet` middleware for production HTTP security headers
- CORS allowlist via `ALLOWED_ORIGINS` env var (comma-separated); falls back to permissive CORS outside `NODE_ENV=production`
- Rate limiting on `/users/login` and `/users/signup` (`express-rate-limit`, 20 requests / 15 min per IP)
- JWT fallback keys (`JWT_FALLBACK_KEYS`) — `check-auth.js` tries the primary `JWT_TOKEN_KEY` first, then each fallback key in order, enabling zero-downtime secret rotation
- Stricter input validation/sanitization (`express-validator`'s `trim()`/`escape()`/`notEmpty()`) on `users` and `places` routes; `login` now validates and rejects malformed input before hitting the DB
- Graceful shutdown on `SIGTERM`/`SIGINT` — stops accepting new connections, closes the MongoDB connection, then exits
- `app.set("trust proxy", 1)` — required so Express resolves the real client IP from the `X-Forwarded-For` header the Nginx reverse proxy sets, rather than the proxy's own IP

### Fixed
- **Rate limiter crash behind the reverse proxy**: without `trust proxy` configured, `express-rate-limit` threw `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` on every request through Nginx (which always sets `X-Forwarded-For`), surfacing as an unhandled rejection on `/users/login` and `/users/signup` in production. Fixed by explicitly trusting the single proxy hop (see `server.js`).
- `env.example` (non-standard filename) removed in favor of the existing `.env.example`, which now documents `ALLOWED_ORIGINS` and `JWT_FALLBACK_KEYS`.

### Changed
- `package.json` — added `express-rate-limit` and `helmet` dependencies.

---

## [1.0.0] — 2026-06-22

### Added
- Express.js REST API server on port 5001
- MongoDB Atlas integration via Mongoose with connection pooling
- JWT-based authentication (signup, login) with bcrypt password hashing
- Users endpoints: list all, signup (with profile image), login
- Places CRUD endpoints with image upload support via Multer
- Products endpoints (list, recommendation, get by ID, create, update, delete)
- Health check endpoint (`/health`) with database connectivity verification
- Winston logger for structured application logging
- Request logging middleware with error/info log levels
- CORS middleware enabled
- Global error handler with centralized error responses
- Dockerfile (Node.js 20-slim)
- GitHub Actions CI/CD pipeline — builds and pushes to GHCR on `main` branch
