# Your Places — Backend Changelog

All notable changes to the backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Planned
- Migrate to `.env.example` + proper env structure
- Add comprehensive `.gitignore` and `.dockerignore`
- Add `docs/` folder with README, CHANGELOG, TEST_CHECKLIST, TODO

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
