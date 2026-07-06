# Your Places — Backend Test Checklist

Run through this checklist after every deployment or significant code change.

---

## 1. Pre-Deployment

- [ ] **Container is built and pushed to GHCR**
  ```bash
  docker pull ghcr.io/fahmiefendy/be-your-places:latest
  ```
  **Expected:** Image pulls successfully

- [ ] **Environment variables are configured**
  ```bash
  cat apps/your-places/be-your-places/.env
  ```
  **Expected:** All required variables (`MONGODB_URI` or `DB_*`, `JWT_TOKEN_KEY`, `GOOGLE_API_KEY`, `OPENINARY_URL`, `OPENINARY_API_KEY`) are set

- [ ] **Container starts without errors**
  ```bash
  docker compose up -d yp-be
  docker logs yp-be --tail 20
  ```
  **Expected:** `Server is running on port 5001` and `Successfully connected to database!`

---

## 2. Health & Connectivity

- [ ] **Health check endpoint responds**
  ```bash
  curl -s http://api-places.fahmiefendy.dev/health | jq .
  ```
  **Expected:** `{ "status": "UP", "database": "connected", "timestamp": "..." }`

- [ ] **Database connection is active**
  ```bash
  docker exec yp-be wget -q -O - http://localhost:5001/health
  ```
  **Expected:** Same as above, confirms internal connectivity

- [ ] **Container is on the proxy network**
  ```bash
  docker network inspect proxy --format '{{range .Containers}}{{.Name}} {{end}}' | grep yp-be
  ```
  **Expected:** `yp-be` appears in the list

---

## 3. Authentication

- [ ] **Register a new user**
  ```bash
  curl -s -X POST http://api-places.fahmiefendy.dev/users/signup \
    -H "Content-Type: application/json" \
    -d '{"name": "Test User", "email": "test@example.com", "password": "TestPass123!"}' | jq .
  ```
  **Expected:** 201 with user data and JWT token (no password in response)

- [ ] **Login with valid credentials**
  ```bash
  curl -s -X POST http://api-places.fahmiefendy.dev/users/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "TestPass123!"}' | jq .
  ```
  **Expected:** 200 with JWT token

- [ ] **Reject invalid credentials**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X POST http://api-places.fahmiefendy.dev/users/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrongpassword"}'
  ```
  **Expected:** `401` or `403`

- [ ] **Reject duplicate registration**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X POST http://api-places.fahmiefendy.dev/users/signup \
    -H "Content-Type: application/json" \
    -d '{"name": "Test User", "email": "test@example.com", "password": "TestPass123!"}'
  ```
  **Expected:** `422` (email already exists)

---

## 4. Users

- [ ] **List all users**
  ```bash
  curl -s http://api-places.fahmiefendy.dev/users | jq .
  ```
  **Expected:** 200 with array of users (no passwords exposed)

---

## 5. Places CRUD

- [ ] **Create a place** (requires JWT)
  ```bash
  curl -s -X POST http://api-places.fahmiefendy.dev/places \
    -H "Authorization: Bearer <JWT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"title": "Eiffel Tower", "description": "Famous landmark in Paris", "address": "Champ de Mars, Paris, France"}' | jq .
  ```
  **Expected:** 201 with created place data including coordinates

- [ ] **List all places**
  ```bash
  curl -s http://api-places.fahmiefendy.dev/places | jq .
  ```
  **Expected:** 200 with array of places

- [ ] **Get place by ID**
  ```bash
  curl -s http://api-places.fahmiefendy.dev/places/<PLACE_ID> | jq .
  ```
  **Expected:** 200 with single place object

- [ ] **Get places by user**
  ```bash
  curl -s http://api-places.fahmiefendy.dev/places/user/<USER_ID> | jq .
  ```
  **Expected:** 200 with array of places for that user

- [ ] **Update a place** (requires JWT, must be owner)
  ```bash
  curl -s -X PATCH http://api-places.fahmiefendy.dev/places/<PLACE_ID> \
    -H "Authorization: Bearer <JWT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"title": "Eiffel Tower Updated", "description": "Updated description"}' | jq .
  ```
  **Expected:** 200 with updated place data

- [ ] **Reject update by non-owner** (requires JWT of a different user)
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X PATCH \
    http://api-places.fahmiefendy.dev/places/<PLACE_ID> \
    -H "Authorization: Bearer <OTHER_USER_JWT>"
  ```
  **Expected:** `401` or `403`

- [ ] **Delete a place** (requires JWT, must be owner)
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    http://api-places.fahmiefendy.dev/places/<PLACE_ID> \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```
  **Expected:** `200`

---

## 6. Error Handling

- [ ] **Unauthorized request is rejected**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X POST http://api-places.fahmiefendy.dev/places \
    -H "Content-Type: application/json" \
    -d '{"title": "Test"}'
  ```
  **Expected:** `401` or `403`

- [ ] **Invalid place ID returns appropriate error**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://api-places.fahmiefendy.dev/places/nonexistent-id
  ```
  **Expected:** `404` or `500`

- [ ] **Missing required fields return validation error**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X POST http://api-places.fahmiefendy.dev/users/signup \
    -H "Content-Type: application/json" \
    -d '{}'
  ```
  **Expected:** `422`

---

## 7. Rollback

- [ ] **Previous image can be restored**
  ```bash
  # Pull a known good version
  docker compose pull yp-be
  docker compose up -d yp-be
  docker logs yp-be --tail 10
  ```
  **Expected:** Container starts with previous version, health check passes
