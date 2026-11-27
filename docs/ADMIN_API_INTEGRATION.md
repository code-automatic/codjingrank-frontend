# Admin API integration — 27/11/2026

Backend reviewed at `ea99de3` on `main` in code-automatic/codjingrank-backend. Frontend stays on master.

## Verified source locations

- `api_gateway/cmd/main.go`: registers `admin.RegisterV1`.
- `api_gateway/internal/admin/v1.go`: authenticated admin guard, package/level/problem CRUD, publication/archive, tags/languages assignments, templates, samples and test cases.
- `api_gateway/internal/admin/v1_reference.go`: tag and runtime language catalog.
- `api_gateway/internal/admin/v1_clone.go`: clone problem.
- `docs/openapi.yaml`: full admin contract. Specification alone does not establish deployed availability.

The guard verifies role and active state against the database. Frontend does not send role impersonation headers.

## Connected screens

`/admin`: totals from admin problems, packages and languages, rather than learner-only catalog visibility.

`/admin/content`: problems/packages with server search, status filter, pagination and POST publish/archive confirmation. Create package sends slug/name/description/displayOrder; backend provisions levels.

`/admin/operations`: paginated languages/tags, with tag creation. No fabricated queue or user metrics.

Client: `lib/api/domains/admin.ts`, wired through `createApiClient` and existing authenticated transport. Admin response items are parsed separately from learner summaries because admin problems have status/levelId/statement and do not match learner difficulty DTOs.

## Remaining UI and backend boundaries

Full problem editing, level editing, runtime editing, problem-language/tag assignment, template/sample/test-case editors and cloning have backend handlers but are not exposed in this revision. Existing API handlers are not represented as missing backend support.

User administration, admin submission list, forum moderation, admin stats and daily challenge administration appear in OpenAPI but no route registration was found for them in this backend snapshot. UI must not claim these endpoints work until the deployed implementation is verified.

404/403/validation failures remain visible; no learner data or demo success is substituted for an admin response. The learner mock contract does not contain admin routes, so it reports endpoint unavailability. No production mutations were performed during implementation.

## Validation

Focused client tests cover exact admin paths, filters, pagination, title mapping, POST transitions, invalid UUID rejection, malformed responses and package payload. Live authenticated operations and backend database integration require separate acceptance against the deployed gateway.
