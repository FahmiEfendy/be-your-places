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
| `DB_USER` | MongoDB Atlas username | — | Yes* |
| `DB_PASSWORD` | MongoDB Atlas password | — | Yes* |
| `DB_NAME` | MongoDB database / Atlas app name | `your_places` | Yes* |
| `MONGODB_URI` | Full MongoDB connection URI (overrides above) | — | Yes* |
| `JWT_TOKEN_KEY` | Secret key for signing JWT tokens (min. 32 chars) | — | Yes |
| `JWT_TOKEN_EXPIRED` | JWT token expiry duration | `24h` | No |
| `GOOGLE_API_KEY` | Google Maps / Places API key for geocoding | — | Yes |
| `OPENINARY_URL` | Openinary image manager base URL | `http://main-openinary:3000` | Yes |
| `OPENINARY_API_KEY` | Openinary API key | — | Yes |
| `LOG_FORMAT` | Morgan/Winston log format | `combined` | No |

> \* Either `MONGODB_URI` **or** all three of `DB_USER`, `DB_PASSWORD`, `DB_NAME` must be provided.

## API Endpoints

### Health
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Health check (includes DB status) | No |

### Users
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/users` | List all users | No |
| `POST` | `/users/signup` | Register a new user (with profile image) | No |
| `POST` | `/users/login` | Login and receive JWT | No |

### Places
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/places` | List all places | No |
| `GET` | `/places/:pid` | Get place by ID | No |
| `GET` | `/places/user/:uid` | Get all places by a specific user | No |
| `POST` | `/places` | Create a new place (with image) | Yes |
| `PATCH` | `/places/:pid` | Update place details | Yes |
| `DELETE` | `/places/:pid` | Delete a place | Yes |

### Products
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/products` | List all products | No |
| `GET` | `/products/recommendation` | Get recommended products | No |
| `GET` | `/products/:productId` | Get product by ID | No |
| `POST` | `/products` | Create a new product | Yes |
| `PATCH` | `/products/:productId` | Update product | Yes |
| `DELETE` | `/products/:productId` | Delete product | Yes |

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

## Related Files

- [docker-compose.yml](../../docker-compose.yml) — Service definition
- [Dockerfile](../Dockerfile) — Container build
- [deploy.yml](../.github/workflows/deploy.yml) — CI/CD pipeline
