# OTP recovery — 27/11/2026

Verified against backend main `29394c4`.

- Gateway aliases in `api_gateway/internal/route/route.go` forward `/api/v1/auth/forgot-password` and `/api/v1/auth/reset-password` to auth service.
- `auth_service/internal/handler/handler.go` accepts email for forgot (202 generic response) and email/otp/newPassword for reset (204).
- `RESET_TOKEN_INVALID` means incorrect, expired, consumed or attempt-limited OTP. The frontend retains the form for correction or requesting a new code.
- Backend uses six-digit OTP, one-minute issuance cooldown, configurable TTL/attempt limits. Email existence and delivery failure are not disclosed.

Frontend no longer expects a token URL. Forgot transitions to OTP/password entry with the email retained in component state only. Direct `/reset-password` accepts email and code manually. No password/code is placed in URLs or storage. Network requests have a 15-second timeout and duplicate submits are disabled.

The old `NEXT_PUBLIC_PASSWORD_RESET_ENABLED=true` opt-in is no longer required. Mock mode still disables recovery because the learner mock cannot deliver mail or change real passwords.

Production requires the new backend deployed with SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM configured. A 202 response alone does not prove mail delivery. No production recovery request or password change was performed during implementation.

Tests verify 202/204 envelope handling, exact email/otp/newPassword JSON and invalid-code preflight rejection. Local tests do not establish live SMTP readiness. The checked-in older learner OpenAPI reset-token example is superseded by this reviewed runtime OTP implementation for this flow.
