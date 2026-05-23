# Bun + Hono + Knex.js Boilerplate

A production-grade backend boilerplate combining Bun, Hono, and Knex.js with manual dependency composition, layered architecture, and 12-factor compliance.

## Why this stack?

**Bun** is a fast all-in-one JavaScript runtime — bundler, test runner, package manager, and TypeScript support out of the box.

**Hono** is a lightweight, performant web framework with first-class Bun support.

**Knex.js** is a flexible SQL query builder that gives you full control over your SQL while providing a clean programmatic API.

## Features

- [Bun](https://bun.sh/) runtime
- [Hono](https://hono.dev/) web framework
- [Knex.js](https://knexjs.org/) SQL query builder
- [Better-Auth](https://www.better-auth.com/) authentication (email/password)
- [Zod](https://zod.dev/) schema validation
- Manual dependency composition via `src/composer.ts` (no DI framework, no decorators, no `reflect-metadata`)
- Repository pattern with structured error logging
- Domain-driven folder structure (`src/modules/{auth,post,comment,health}`)
- [Biome](https://biomejs.dev/) linting + [ESLint](https://eslint.org/) with `import/order` for import grouping
- OpenAPI / Swagger UI
- [Pino](https://getpino.io/) structured logging with per-request IDs
- Request logging middleware (method, path, status, duration, requestId)
- Rate limiting on `/auth/sign-in/email` (5 req/min — configurable)
- CORS with whitelisted origins + secure headers (CSP)
- Pagination on list endpoints (`?page=1&limit=20`)
- Database connection check at startup
- Graceful shutdown (SIGTERM/SIGINT)

## Getting started

### Prerequisites

- [Bun](https://bun.sh/docs/installation)
- [Docker](https://docs.docker.com/get-docker/) (for Postgres)

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd bun-hono-knex-boilerplate

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Start Postgres
docker compose up -d

# Run database migration
bun run db:migrate

# (Optional) Seed sample data — 2 users, 6 posts, 12 comments
bun run db:seed
# alice@example.com / bob@example.com  (password: password123)

# Start development server
bun run dev
```

The server will start at `http://localhost:3000`.

### Available scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run build` | Compile TypeScript to `./dist` |
| `bun run start:prod` | Run compiled build (assumes `build` already ran) |
| `bun run start` | Build then run (convenience) |
| `bun run db:migrate` | Create database tables |
| `bun run db:seed` | Seed sample data (2 users, 6 posts, 12 comments) |
| `bun run test` | Run all tests |
| `bun run test:coverage` | Run all tests with coverage report |
| `bun run openapi` | Generate OpenAPI spec to `./docs/openapi.json` |
| `bun run lint` | Lint source files (Biome + ESLint with `--fix`) |
| `bun run format` | Format source files with Biome |
| `bun run check` | Check source files (Biome + ESLint) |

### API endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health/api` | GET | No | Health check |
| `/api/health/db` | GET | No | Database connection check |
| `/api/auth/*` | POST/GET | No | Authentication (sign-up, sign-in, etc.) |
| `/api/post` | GET | Yes | List posts (paginated: `?page=1&limit=20`) |
| `/api/post` | POST | Yes | Create a post |
| `/api/post/:id` | GET | Yes | Get a post by ID (includes comments) |
| `/api/post/:id` | PATCH | Yes | Update a post |
| `/api/comment` | GET | Yes | List comments (paginated: `?page=1&limit=20`) |
| `/api/comment` | POST | Yes | Create a comment |
| `/api/comment/:id` | GET | Yes | Get a comment by ID |
| `/api/comment/:id` | PATCH | Yes | Update a comment |
| `/docs` | GET | No | Swagger UI |

**Pagination response shape:**
```json
{
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

## Authentication

Uses [Better-Auth](https://www.better-auth.com/) with cookie-based session auth.

- Session expires in **7 days**, no sliding refresh
- Rate limited: `POST /api/auth/sign-in/email` (5 requests per minute)
- CSRF check disabled for development (`disableCSRFCheck: true`) — **remove in production**

### Sign up / Sign in

```bash
# Sign up
http POST http://localhost:3000/api/auth/sign-up/email \
  email=test@example.com password=mypassword name="Test User"

# Sign in (saves cookie with --session=user)
http POST http://localhost:3000/api/auth/sign-in/email \
  email=test@example.com password=mypassword --session=user

# Create a post (uses saved cookie)
http POST http://localhost:3000/api/post \
  title="My Post" content="Hello world" --session=user
```

### Environment variables

```
API_PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:15432/boilerplate_db
BETTER_AUTH_SECRET=change-me-in-production
TRUSTED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=20
```

- `DATABASE_URL` is **required** in production (`NODE_ENV=production`)
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` control rate limiting (defaults: 60s / 20)
- `TRUSTED_ORIGINS` supports comma-separated list for CORS whitelist

## Architecture

### Dependency composition

No DI framework, no decorators, no `reflect-metadata`. All wiring is done explicitly in `src/composer.ts`:

```typescript
const postRepository = new PostRepository();
const commentRepository = new CommentRepository();

export const postService = new PostService(postRepository);
export const commentService = new CommentService(commentRepository);
export const healthService = new HealthService();
```

Routes import service instances from `composer.ts` instead of `Container.get()`.

Repository classes import `db` and `logger` at the module level — no constructor injection needed for singletons.

### Middleware stack (in order)

| Middleware | File | Purpose |
|-----------|------|---------|
| `trimTrailingSlash` | `hono/trailing-slash` | Normalize trailing slashes |
| `requestId` | `src/shared/middleware/requestId.ts` | Generate/propagate `X-Request-Id` header |
| `requestLogger` | `src/shared/middleware/requestLogger.ts` | Log method, path, status, duration, requestId |
| `secureHeaders` | `hono/secure-headers` | CSP, XSS protection, etc. |
| `cors` | `hono/cors` | Whitelist via `TRUSTED_ORIGINS` config |

### Rate limiting

Applied to `POST /api/auth/sign-in/email` in `src/modules/auth/auth.routes.ts`.

In-memory store with automatic cleanup. Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` env vars (defaults: 60s / 5 for auth, 60s / 20 global).

### Project structure

```
src/
├── modules/                  # Domain-driven modules
│   ├── auth/                 # Authentication module
│   │   ├── auth.config.ts    # Better-Auth configuration
│   │   ├── auth.types.ts     # Auth type helpers
│   │   ├── auth.routes.ts    # Auth route passthrough + rate limiter
│   │   └── __tests__/
│   ├── post/                 # Post module
│   │   ├── post.routes.ts    # Post CRUD routes
│   │   ├── post.service.ts   # Post business logic
│   │   ├── post.repository.ts# Post DB queries with error logging
│   │   ├── post.types.ts     # Post types + Zod schemas
│   │   └── __tests__/
│   ├── comment/              # Comment module
│   │   ├── comment.routes.ts
│   │   ├── comment.service.ts
│   │   ├── comment.repository.ts
│   │   ├── comment.types.ts
│   │   └── __tests__/
│   ├── health/               # Health module
│   │   ├── health.routes.ts
│   │   ├── health.service.ts
│   │   └── __tests__/
│   └── index.ts              # Module router + session/auth middleware
├── shared/                   # Shared infrastructure
│   ├── middleware/            # Global middleware
│   │   ├── requestId.ts
│   │   ├── requestLogger.ts
│   │   └── rateLimiter.ts
│   ├── database.ts           # Knex instance + pg pool
│   ├── logger.ts             # Pino logger
│   └── error/                # Error handling
├── infra/
│   └── db/                   # Database
│       ├── knex.ts           # Knex configuration
│       └── migrate.ts        # Migration script
├── composer.ts               # Manual dependency composition
├── config.ts                 # Zod env var validation
├── index.ts                  # Entry point (server start + DB check)
└── server.ts                 # Hono app setup (middleware, routes, error handler)
tests/
├── helpers/
│   ├── auth.ts               # signUpAndGetCookie(), authHeaders()
│   └── cleanup.ts            # Test data cleanup
└── services/
    └── database.test.ts
docs/
└── openapi.json              # OpenAPI spec
.github/
└── workflows/
    └── ci.yml                # GitHub Actions CI
```

## 12-Factor App compliance

| Factor | Status | Implementation |
|--------|--------|----------------|
| **I. Codebase** | ✅ | Single Git repo, one-to-one with the app |
| **II. Dependencies** | ✅ | All deps in `package.json` + `bun.lock` for reproducible installs |
| **III. Config** | ✅ | All config via `process.env` parsed through Zod (`src/config.ts`) |
| **IV. Backing Services** | ✅ | `DATABASE_URL` as env var — swap Postgres without code changes |
| **V. Build / Release / Run** | ✅ | `build` → `start:prod` separated; `postinstall` only builds |
| **VI. Processes** | ✅ | Stateless (sessions stored in DB via Better-Auth) |
| **VII. Port Binding** | ✅ | `bun.serve()` binds to `API_PORT` — no external web server needed |
| **VIII. Concurrency** | ⚠️ | Process model not documented; Knex pool (min:2, max:10) is the only knob |
| **IX. Disposability** | ✅ | Graceful shutdown closes HTTP server + destroys Knex/pg pool on `SIGTERM`/`SIGINT` |
| **X. Dev/Prod Parity** | ✅ | `pino-pretty` only in non-production; `NODE_ENV` defaults to `development` |
| **XI. Logs** | ✅ | Pino writes JSON to stdout — no file logging |
| **XII. Admin Processes** | ✅ | `db:migrate` runs as a one-off process, separate from the web app |

## CI

Automated via GitHub Actions (`.github/workflows/ci.yml`):
1. Lint (Biome + ESLint)
2. Build (TypeScript compilation)
3. Database migration
4. Test with coverage

Runs on every push/PR to `main` with a PostgreSQL service container.

## Observability (docker-compose)

The stack ships application logs from the `boilerplate-app` container into ClickHouse via Vector.dev, with a HyperDX UI for exploration.

### Services

| Service | Image | Purpose |
|---------|-------|---------|
| `clickstack` | `clickhouse/clickstack-all-in-one` | ClickHouse database + HyperDX UI + OTel collector |
| `clickhouse-init` | `curlimages/curl` | One-shot init — creates `default.app_logs` table on startup |
| `vector` | `timberio/vector:0.55.0-alpine` | Reads Docker logs, parses Pino JSON, sinks to ClickHouse |

### Log flow

```
boilerplate-app (Pino JSON → stdout)
  → Docker daemon
  → Vector (docker_logs source)
  → VRL remap (level conversion, timestamp parsing)
  → ClickHouse sink (default.app_logs table)
```

### Usage

```bash
# Start all services (Postgres + ClickStack + Vector)
docker compose up -d

# Vector depends on clickhouse-init, which waits for ClickStack
# and creates the app_logs table automatically

# View logs in HyperDX UI
open http://localhost:8080

# (First visit: create a HyperDX user account)
```

### Vector config

`vector/vector.toml` defines:

- **Source**: `docker_logs` — reads logs from the `boilerplate-app` container via Docker socket (`/var/run/docker.sock`)
- **Transform**: remap — converts Pino numeric levels (`30`→`info`, `40`→`warn`, etc.) and extracts structured fields (`method`, `path`, `status`, `duration`, `request_id`)
- **Sink**: `clickhouse` — writes to `http://clickstack:8123`, table `default.app_logs`, gzip compressed, batches of 1000 events

### Table schema

```sql
CREATE TABLE default.app_logs (
    timestamp       DateTime64(3) NOT NULL,
    level           LowCardinality(String) NOT NULL,
    message         String NOT NULL,
    request_id      Nullable(String),
    method          Nullable(String),
    path            Nullable(String),
    status          Nullable(Int64),
    duration        Nullable(Float64),
    err             Nullable(String),
    container_name  String NOT NULL,
    stream          String NOT NULL
) ENGINE = MergeTree()
ORDER BY (toStartOfHour(timestamp), container_name)
TTL toDateTime(timestamp) + INTERVAL 30 DAY
```

Defined in `clickhouse/init-table.sql` — auto-created on `docker compose up`.

## License

MIT
