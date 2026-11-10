# Sprint 1 — 2026-11-07

> Ghi retention policy cho repo/GitHub history; không xóa remote repository;
> đánh dấu service, bảng, DTO và hook là legacy.

Nguồn: `docs/DECISIONS.md`, `docs/NEXT_STEPS.md`, `docs/FRONTEND_API_CONTRACT.md`.

## Nội dung trong folder

| File                                       | Mục đích                                              |
| ------------------------------------------ | ----------------------------------------------------- |
| [RETENTION_POLICY.md](RETENTION_POLICY.md) | Chính sách giữ/xóa lịch sử repo và GitHub             |
| [LEGACY_INVENTORY.md](LEGACY_INVENTORY.md) | Danh sách service, bảng, DTO, hook bị đánh dấu legacy |

## Nguyên tắc nhanh

1. **Không xóa remote repository** — chỉ archive/đánh dấu legacy.
2. Mọi flow Repository/GitHub App/OAuth/webhook/commit là **legacy**, chỉ giữ để tham khảo migration.
3. Contract mới (`/api/v1`, Package → Level → Problem, UUID) là target duy nhất cho frontend/backend v2.

Nguồn backend ở trên là đường dẫn tương đối trong repo [codjingrank-backend](https://github.com/code-automatic/codjingrank-backend), không phải file trong repo FE. Learner contract dùng để mock nằm tại [`contracts/openapi_fe.yaml`](../contracts/openapi_fe.yaml). Các mục legacy mô tả lịch sử, không chứng minh route live hiện có.
