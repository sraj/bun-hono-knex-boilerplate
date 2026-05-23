# Project Context — bun-hono-knex-boilerplate

## Stack
- Bun 1.3+, Hono 4.x, Knex.js 3.x, Better-Auth 1.2, Zod 3.25 (v4 subpath), Pino, pg
- Tests: Bun test runner, co-located in `__tests__/`
- Lint: Biome (all rules) + ESLint (`import/order` with `newlines-between: always`)

## Architecture
- No DI framework — manual composition in `src/composer.ts` wires services with their repositories
- Domain modules in `src/modules/{auth,post,comment,health}/` — each has routes, service, types, repository
- All classes are plain (no decorators, no `reflect-metadata`, no `experimentalDecorators`)
- Repositories wrap Knex queries with try-catch + structured logging
- Services accept repositories via constructor; composer instantiates both
- Routes import service instances from `composer.ts` (not `Container.get()`)
- Shared infra: `src/shared/database.ts` (Knex instance + pg pool), `src/shared/logger.ts` (Pino)
- `src/shared/config.ts`: Zod env var validation (DATABASE_URL required in production)
- `src/server.ts`: global middleware (request ID, request logger, secure headers, CORS, trailing slash)
- `src/index.ts`: Bun serve + graceful shutdown (SIGTERM/SIGINT) + DB connection check at startup

## Auth
- Cookie-based session auth via Better-Auth
- Session expires in 7 days, NO sliding refresh (`disableSessionRefresh: true`)
- Rate limited: POST /api/auth/sign-in/email (5 req/min)
- CSRF check disabled (`disableCSRFCheck: true` — remove before production)
- For SPA frontend: either enable SameSite cookie + CSRF check, or switch to Bearer token header
- `getUserFromContext()` / `getSessionFromContext()` throw `AuthError` if missing
- Session middleware in `src/modules/index.ts` calls `auth.api.getSession({ headers })` then sets `c.set('user')`/`c.set('session')`

## Pagination
- GET /api/post and GET /api/comment accept `?page=1&limit=20` (max 100)
- Response: `{ data: [...], total: number, page: number, limit: number }`

## Error Handling
- `routingErrorHandler.ts`: catches ZodError, BetterAuthAPIError, HTTPException, AuthError, generic Error
- Always returns `{ message: string }` shape (+ `fieldErrors`/`formErrors` for validation errors)
- Repositories log DB errors and re-throw; routes throw HTTPException

## Key Conventions
- `import type` is safe everywhere (no decorator metadata needed — TypeDI removed)
- Zod imports from `zod/v4` (ZodError is a different class from Zod v3 — routingErrorHandler must import from the correct path)
- Seeded users: `alice@example.com` / `bob@example.com`, password `password123`

## Scripts
- `bun run dev` — watch mode
- `bun run build` — tsc
- `bun run start:prod` — run compiled JS
- `bun run db:migrate` — create tables
- `bun run db:seed` — insert sample data
- `bun run test` / `bun run test:coverage`
- `bun run lint` / `bun run ci`
- `bun run check` — Biome + ESLint

## CI
- `.github/workflows/ci.yml`: lint → build → migrate → test+coverage with PostgreSQL service container
- Requires `DATABASE_URL` and `BETTER_AUTH_SECRET` env vars

## Observability (docker-compose)
- **ClickStack** (`clickhouse/clickstack-all-in-one`): bundles ClickHouse + HyperDX UI + OTel collector
  - ClickHouse HTTP: `localhost:8123`, HyperDX UI: `localhost:8080`
  - Persisted volumes: `clickstack-db`, `clickstack-ch-data`, `clickstack-ch-logs`
- **clickhouse-init** (`curlimages/curl`): one-shot init container that creates `default.app_logs` table via SQL file
- **Vector** (`timberio/vector:0.55.0-alpine`): reads Docker logs via socket → parses Pino JSON → sinks to ClickHouse
  - Config at `vector/vector.toml`
  - Mounts `/var/run/docker.sock:ro` for Docker log access
  - Depends on `clickhouse-init` completing successfully (table exists)
- **Log flow**: `boilerplate-app` container (Pino JSON stdout) → Docker daemon → Vector (`docker_logs` source) → VRL remap (level mapping, timestamp parsing) → ClickHouse sink (`default.app_logs` table)
- **Table schema**: `clickhouse/init-table.sql` — MergeTree engine, TTL 30 days, ordered by `(toStartOfHour(timestamp), container_name)`

## Production Readiness Checklist (remaining)
- [ ] Remove `disableCSRFCheck: true` + configure SameSite/CSRF for SPA
- [ ] Add Sentry or error tracker in routingErrorHandler
- [ ] Dockerfile + docker-compose for production deployment
- [ ] Pre-commit hooks (Husky + lint-staged)
- [ ] API versioning (`/api/v1/...`)
- [ ] Database migration tests
- [ ] Admin endpoints
- [ ] OpenTelemetry / distributed tracing
