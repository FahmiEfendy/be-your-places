# Your Places — Backend API

## Overview

Express.js REST API for Your Places, a full-stack application that allows users to create accounts and share their favorite places. Provides authentication, user management, places CRUD, and image uploads via MongoDB Atlas as the data store.

**Container name:** `yp-be`
**Image:** `ghcr.io/fahmiefendy/be-your-places:latest`
**Port:** `5001`
**Runtime:** Node.js 20
**Public API URL:** `api-places.fahmiefendy.dev`

## Architecture

```
Client → Nginx (infra-nginx) → yp-fe:80 → /api/* proxy → yp-be:5001
                              → api-places.fahmiefendy.dev → yp-be:5001 (direct)
                                                              ↓
                                                      MongoDB Atlas (cloud)
```

## Directory Structure

```
be-your-places/
├── server.js             # Application entry point
├── controllers/          # Route handler logic
│   ├── places-controllers.js
│   └── users-controllers.js
├── models/               # Mongoose schemas
│   ├── http-error.js
│   ├── place.js
│   └── user.js
├── routes/               # Express route definitions
│   ├── places-routes.js
│   └── users-routes.js
├── middleware/            # Express middleware
│   └── check-auth.js     # JWT verification
├── utils/
│   └── logger.js         # Winston logger configuration
├── uploads/              # User-uploaded images (volume-mounted, gitignored)
├── docs/                 # Documentation
├── Dockerfile            # Production container image
└── .github/workflows/
    └── deploy.yml        # CI/CD — build & push to GHCR
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server listen port | `5001` | No |
| `NODE_ENV` | Environment (`development`, `production`) | `development` | No |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist, enforced when `NODE_ENV=production` | `http://localhost:3000,http://localhost:5173` | Yes (production) |
| `DB_USER` | MongoDB Atlas username | — | Yes* |
| `DB_PASSWORD` | MongoDB Atlas password | — | Yes* |
| `DB_NAME` | MongoDB database / Atlas app name | `your_places` | Yes* |
| `MONGODB_URI` | Full MongoDB connection URI (overrides above) | — | Yes* |
| `JWT_TOKEN_KEY` | Secret key for signing JWT tokens (min. 32 chars) | — | Yes |
| `JWT_FALLBACK_KEYS` | Comma-separated list of previous `JWT_TOKEN_KEY` values, tried in order if the primary fails verification — enables rotating `JWT_TOKEN_KEY` without invalidating tokens already issued | — | No |
| `JWT_TOKEN_EXPIRED` | JWT token expiry duration | `24h` | No |
| `GOOGLE_API_KEY` | Google Maps / Places API key for geocoding | — | Yes |
| `OPENINARY_URL` | Openinary image manager base URL | `http://main-openinary:3000` | Yes |
| `OPENINARY_API_KEY` | Openinary API key | — | Yes |
| `LOG_FORMAT` | Morgan/Winston log format | `combined` | No |

> \* Either `MONGODB_URI` **or** all three of `DB_USER`, `DB_PASSWORD`, `DB_NAME` must be provided.

> **Important:** `ALLOWED_ORIGINS` is only enforced when `NODE_ENV=production` — with any other value, CORS allows all origins. Make sure production deployments set `NODE_ENV=production` and `ALLOWED_ORIGINS` to the real frontend origin (e.g. `https://places.fahmiefendy.dev`), not the localhost placeholders in `.env.example`.

## API Endpoints

### Health
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Health check (includes DB status) | No |

### Users
| Method | Path | Description | Auth | Rate limited |
|--------|------|-------------|------|--------------|
| `GET` | `/users` | List all users | No | No |
| `POST` | `/users/signup` | Register a new user (with profile image) | No | Yes (20 / 15 min per IP) |
| `POST` | `/users/login` | Login and receive JWT | No | Yes (20 / 15 min per IP) |

### Places
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/places` | List all places | No |
| `GET` | `/places/:pid` | Get place by ID | No |
| `GET` | `/places/user/:uid` | Get all places by a specific user | No |
| `POST` | `/places` | Create a new place (with image) | Yes |
| `PATCH` | `/places/:pid` | Update place details | Yes |
| `DELETE` | `/places/:pid` | Delete a place | Yes |

## Security

- **Helmet** — sets standard security response headers (`X-Content-Type-Options`, `X-DNS-Prefetch-Control`, etc.) on every response.
- **CORS allowlist** — only origins in `ALLOWED_ORIGINS` are permitted when `NODE_ENV=production`; otherwise all origins are allowed (dev convenience).
- **Rate limiting** — `/users/login` and `/users/signup` are limited to 20 requests / 15 minutes per client IP (`express-rate-limit`) to slow down brute-force/credential-stuffing attempts.
- **`trust proxy`** — set to `1` in `server.js` so Express resolves the real client IP from the `X-Forwarded-For` header set by the Nginx reverse proxy (`infra/nginx/conf.d/yourplaces.conf`) rather than the proxy's own IP. **This is required** for the rate limiter to key by real client and to avoid it throwing on every request (see Troubleshooting).
- **Input validation & sanitization** — `express-validator` rules (`trim()`, `escape()`, `notEmpty()`, `isEmail()`, `isLength()`) on `users` and `places` routes; results are checked via `validationResult()` in each controller before touching the database.
- **JWT verification with fallback keys** — `middleware/check-auth.js` verifies against `JWT_TOKEN_KEY` first, then each key in `JWT_FALLBACK_KEYS` in order. To rotate the JWT secret with zero downtime: move the current `JWT_TOKEN_KEY` into `JWT_FALLBACK_KEYS`, set a new `JWT_TOKEN_KEY`, and deploy — tokens signed with the old key keep verifying until they expire, then drop the old key from `JWT_FALLBACK_KEYS` in a later deploy.
- **Graceful shutdown** — on `SIGTERM`/`SIGINT`, the server stops accepting new connections, lets in-flight requests finish, closes the MongoDB connection, then exits.

## Local Development

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Start development server (with hot reload)
npm run devStart

# Start production server
npm start
```

## Docker Deployment

The container is built and pushed via GitHub Actions on every push to `main`. On the homeserver:

```bash
# Start the app stack
cd /path/to/homeserver/apps/your-places
docker compose up -d

# View logs
docker logs yp-be --tail 50 -f

# Check health
curl http://api-places.fahmiefendy.dev/health
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `MongoServerError` / connection refused | Verify `MONGODB_URI` or `DB_*` credentials are correct |
| JWT errors | Check `JWT_TOKEN_KEY` is set and consistent across restarts |
| Upload failures | Verify `uploads/` directory exists and is writable inside the container |
| 502 from nginx | Check container is running: `docker ps --filter name=yp-be` |
| Health check failing | Check app logs: `docker logs yp-be` |
| Google Maps errors | Verify `GOOGLE_API_KEY` is valid and not restricted to another domain |
| `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` / login-signup fail behind the proxy | `app.set("trust proxy", 1)` is missing or was reverted — required since Nginx sets `X-Forwarded-For` on every request. Without it, `express-rate-limit` throws on `/users/login` and `/users/signup`. |
| Login/signup return `429` unexpectedly | Rate limit is 20 requests / 15 min per client IP; if many users share one IP (NAT/corporate network), consider raising `max` in `routes/users-routes.js` |
| CORS errors from the frontend | Verify `ALLOWED_ORIGINS` includes the exact frontend origin (scheme + host, e.g. `https://places.fahmiefendy.dev`) and that `NODE_ENV=production` is set — the allowlist is only enforced in production |

## Related Files

- [docker-compose.yml](../../docker-compose.yml) — Service definition
- [Dockerfile](../Dockerfile) — Container build
- [deploy.yml](../.github/workflows/deploy.yml) — CI/CD pipeline
