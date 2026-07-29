# Your Places — Backend TODO

## 🔴 Critical


## 🟡 Medium

- [ ] **API versioning** — Prefix routes with `/v1/` for future backward compatibility
- [ ] **Pagination** — Add pagination to places and users list endpoints
- [ ] **Search & filtering** — Add query parameter support for filtering places by user, location, or keyword
- [ ] **Image optimization** — Resize/compress uploaded images with `sharp` before storing or forwarding to Openinary
- [ ] **Soft deletes** — Add `deletedAt` field instead of hard deleting records from MongoDB
- [ ] **Request ID tracing** — Add unique request IDs (e.g., `uuid`) to logs for end-to-end debugging
- [ ] **Refresh token** — Implement refresh token flow so users don't have to re-login after JWT expiry
- [ ] **Automated tests** — Add unit tests for controllers and integration tests for the API (Jest + Supertest)
- [ ] **CI test pipeline** — Run tests in GitHub Actions before building the Docker image
- [ ] **Health check enhancements** — Add uptime, memory usage, MongoDB ping, and version info to `/health`
- [ ] **Dockerfile improvements** — Use Alpine base, add `.dockerignore` exclusions, run as non-root user

## 🟢 Nice to Have

- [ ] **API documentation** — Generate OpenAPI/Swagger docs from route definitions
- [ ] **Caching** — Add Redis caching for frequently read places/users data
- [ ] **Audit logging** — Log all write operations (create, update, delete) with user ID and timestamp
- [ ] **Compression** — Enable response compression with `compression` middleware
- [ ] **File storage migration** — Move image uploads to object storage (S3/MinIO) instead of local filesystem
- [ ] **Google Maps geocoding** — Cache geocoding results to avoid hitting API quota on repeated lookups
- [ ] **Admin endpoints** — Protected admin routes for managing all users' content
