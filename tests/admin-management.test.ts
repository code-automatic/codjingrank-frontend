import { describe, expect, it, vi } from "vitest";
import { createAdminManagement, statsLabels } from "../lib/api/domains/admin-management";
const id = "11111111-1111-4111-8111-111111111111";
describe("published admin contract", () => {
  it("reads system statistics without substituting catalog counts", async () => {
    const values = Object.fromEntries(Object.keys(statsLabels).map((key) => [key, 3]));
    const request = vi.fn().mockResolvedValue(values);
    expect(await createAdminManagement(request).stats()).toEqual(values);
    expect(request.mock.calls[0][0]).toBe("/api/v1/admin/stats");
  });
  it("maps users and forwards account filters", async () => {
    const request = vi.fn().mockResolvedValue({ items: [{ id, email: "test@example.com", fullName: null, username: "test", role: "student", isActive: false, createdAt: "2026-11-27T00:00:00Z" }], page: 1, size: 10, total: 1 });
    const result = await createAdminManagement(request).management("users", { page: 1, size: 10, q: "test" });
    expect(result.items[0].status).toBe("Đã khóa");
    expect(request.mock.calls[0][0]).toContain("/api/v1/admin/users?");
  });
  it("validates roles, IDs and moderation status before sending", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const admin = createAdminManagement(request);
    await expect(admin.updateUser(id, { role: "owner", isActive: true })).rejects.toThrow();
    await expect(admin.moderate("../bad", "hidden")).rejects.toThrow();
    await expect(admin.moderate(id, "draft")).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
    await admin.moderate(id, "hidden");
    expect(request).toHaveBeenCalledWith(`/api/v1/admin/forum/posts/${id}`, { method: "PATCH", body: '{"status":"hidden"}' });
  });
  it("rejects missing or malformed system totals", async () => {
    await expect(createAdminManagement(vi.fn().mockResolvedValue({ users: "100" })).stats()).rejects.toThrow();
  });
});
