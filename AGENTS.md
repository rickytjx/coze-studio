# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Go API server (DDD-style). Typical flow: `api/` (transport) → `application/` (use-cases) → `domain/` (business), with integrations in `infra/`. Shared helpers live in `pkg/`.
- `frontend/`: React 18 + TypeScript monorepo managed by Rush + PNPM. Main app: `frontend/apps/coze-studio/`. Reusable modules live in `frontend/packages/` (common naming patterns include `*-adapter` and `*-base`).
- `docker/`: local stacks via `docker-compose*.yml` plus env templates (`docker/.env.example`, `docker/.env.debug.example`).
- `idl/`: Thrift IDL contracts used for codegen; update IDL first and regenerate (avoid editing generated outputs).
- `scripts/`, `helm/`, `docs/`: build/setup helpers, deployment charts, and documentation.

## Build, Test, and Development Commands
- `make web`: bring up the full web stack via Docker Compose (default local entrypoint).
- `make debug`: start middleware + build/run backend in debug mode.
- `make fe`: build frontend and copy bundles into backend static assets.
- `make server`: build/run the Go binary (expects middleware already running).
- Frontend deps: `rush install` (or `rush update`) from repo root (versions pinned in `rush.json`).
- Frontend app: `cd frontend/apps/coze-studio && rushx dev|build|lint|test|test:cov`.

## Coding Style & Naming Conventions
- Go: format with `gofmt`/`goimports`; keep domain logic in `backend/domain` and external I/O in `backend/infra`.
- TypeScript/React: Prettier formatting (2 spaces, single quotes, semicolons); components use `PascalCase`, hooks use `useX`, tests use `*.test.ts(x)` or `__tests__/`.
- Prefer small, focused changes; avoid cross-layer imports and circular dependencies.

## Testing Guidelines
- Backend: `cd backend && go test ./...` (tests are `*_test.go`).
- Frontend: `rush test` for the monorepo or `rushx test` in the package you touched.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `<type>(optional scope): <description>` (e.g., `fix(api): handle nil token`).
- Run `rush lint`/`rush test` (and relevant `make` targets) before opening a PR; `rush install` installs git hooks (commitlint + lint-staged).
- PRs should link an issue, describe behavior changes, and include screenshots for UI changes.

## Security & Configuration
- Never commit secrets; keep API keys in local `docker/.env*`.
- Report vulnerabilities via `opensource-studio@coze.cn` instead of public issues.
