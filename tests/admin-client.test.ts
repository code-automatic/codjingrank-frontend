import { describe, expect, it, vi } from "vitest";
import { createAdminClient } from "../lib/api/domains/admin";

const id = "11111111-1111-4111-8111-111111111111";
describe("admin API client", () => {
  it("uses admin pagination and maps problem title without learner-only fields", async () => {
    const request = vi
      .fn()
      .mockResolvedValue({
        items: [{ id, slug: "sum-two", title: "Sum", status: "draft" }],
        total: 1,
        page: 2,
        size: 10,
      });
    const result = await createAdminClient(request).list("problems", {
      page: 2,
      size: 10,
      status: "draft",
      q: "sum",
    });
    expect(request.mock.calls[0][0]).toBe(
      "/api/v1/admin/problems?page=2&size=10&status=draft&q=sum",
    );
    expect(result.items[0]).toEqual({
      id,
      slug: "sum-two",
      name: "Sum",
      status: "draft",
    });
  });
  it("keeps status writes behind POST and rejects invalid IDs", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const admin = createAdminClient(request);
    await admin.transition("packages", id, "publish");
    expect(request).toHaveBeenCalledWith(
      `/api/v1/admin/packages/${id}/publish`,
      { method: "POST" },
    );
    await expect(
      admin.transition("problems", "../bad", "archive"),
    ).rejects.toThrow();
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("does not treat malformed responses as empty data", async () => {
    await expect(
      createAdminClient(
        vi.fn().mockResolvedValue({ items: [], total: "8", page: 1, size: 10 }),
      ).list("tags"),
    ).rejects.toThrow();
  });
  it("sends only explicit package payload", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const payload = {
      name: "Arrays",
      slug: "arrays",
      description: null,
      displayOrder: 0,
    };
    await createAdminClient(request).createPackage(payload);
    expect(request).toHaveBeenCalledWith("/api/v1/admin/packages", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });
});
