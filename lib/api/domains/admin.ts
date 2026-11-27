import {
  ApiError,
  buildApiPath,
  type Requester,
  type RequestOptions,
} from "../client";
import {
  assertArray,
  assertInt,
  assertRecord,
  assertString,
  assertUuid,
} from "../guards";
import { createAdminManagement } from "./admin-management";

export type AdminResource = "problems" | "packages" | "languages" | "tags";
export type AdminItem = {
  id: string;
  slug: string;
  name: string;
  status?: string;
  isActive?: boolean;
};
export type AdminPage = {
  items: AdminItem[];
  total: number;
  page: number;
  size: number;
};
export function createAdminClient(request: Requester) {
  const base = "/api/v1/admin";
  function resourcePath(resource: AdminResource) {
    if (!["problems", "packages", "languages", "tags"].includes(resource))
      throw new ApiError(400, "VALIDATION_ERROR");
    return `${base}/${resource}`;
  }
  return {
    ...createAdminManagement(request),
    async list(
      resource: AdminResource,
      query: { page?: number; size?: number; q?: string; status?: string } = {},
      options?: RequestOptions,
    ): Promise<AdminPage> {
      const raw = assertRecord(
        await request<unknown>(buildApiPath(resourcePath(resource), query), {
          signal: options?.signal,
        }),
        "adminPage",
      );
      return {
        total: assertInt(raw.total, "adminPage.total", 0),
        page: assertInt(raw.page, "adminPage.page", 1),
        size: assertInt(raw.size, "adminPage.size", 1),
        items: assertArray(raw.items, "adminPage.items").map((value) => {
          const item = assertRecord(value, "adminItem");
          return {
            id: assertUuid(item.id, "adminItem.id"),
            slug: assertString(item.slug, "adminItem.slug"),
            name: assertString(
              resource === "problems" ? item.title : item.name,
              "adminItem.name",
            ),
            ...(typeof item.status === "string" ? { status: item.status } : {}),
            ...(typeof item.isActive === "boolean"
              ? { isActive: item.isActive }
              : {}),
          };
        }),
      };
    },
    async transition(
      resource: "problems" | "packages",
      id: string,
      action: "publish" | "archive",
    ) {
      if (
        !["problems", "packages"].includes(resource) ||
        !["publish", "archive"].includes(action)
      )
        throw new ApiError(400, "VALIDATION_ERROR");
      await request(
        `${resourcePath(resource)}/${assertUuid(id, "id")}/${action}`,
        { method: "POST" },
      );
    },
    async createPackage(payload: {
      slug: string;
      name: string;
      description: string | null;
      displayOrder: number;
    }) {
      await request(`${base}/packages`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async createTag(payload: { slug: string; name: string }) {
      await request(`${base}/tags`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}
