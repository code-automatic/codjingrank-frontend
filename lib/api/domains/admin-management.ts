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
  assertBoolean,
} from "../guards";
export type ManagementKind = "users" | "community" | "audit";
export type ManagementRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  role?: string;
  isActive?: boolean;
  content?: string;
};
export type ManagementPage = {
  items: ManagementRow[];
  total: number;
  page: number;
  size: number;
};
export const statsLabels = {
  users: "Tài khoản",
  activeUsers: "Đang hoạt động",
  packages: "Gói bài",
  publishedProblems: "Bài đã xuất bản",
  submissions: "Lượt nộp",
  acceptedSubmissions: "Lượt Accepted",
  usersWithSolutions: "Người đã giải bài",
  forumPosts: "Bài viết",
} as const;
export function createAdminManagement(request: Requester) {
  return {
    async stats(options?: RequestOptions) {
      const raw = assertRecord(
        await request("/api/v1/admin/stats", { signal: options?.signal }),
        "stats",
      );
      return Object.fromEntries(
        Object.keys(statsLabels).map((key) => [
          key,
          assertInt(raw[key], `stats.${key}`, 0),
        ]),
      ) as Record<keyof typeof statsLabels, number>;
    },
    async management(
      kind: ManagementKind,
      query: {
        page: number;
        size: number;
        q?: string;
        role?: string;
        status?: string;
        actorEmail?: string;
        action?: string;
      },
      options?: RequestOptions,
    ): Promise<ManagementPage> {
      const paths = {
        users: "users",
        community: "forum/posts",
        audit: "audit-logs",
      };
      if (!(kind in paths)) throw new ApiError(400, "VALIDATION_ERROR");
      const raw = assertRecord(
        await request(buildApiPath(`/api/v1/admin/${paths[kind]}`, query), {
          signal: options?.signal,
        }),
        "management",
      );
      return {
        page: assertInt(raw.page, "page", 1),
        size: assertInt(raw.size, "size", 1),
        total: assertInt(raw.total, "total", 0),
        items: assertArray(raw.items, "items").map((value) => {
          const row = assertRecord(value, "item");
          const common = {
            id: assertUuid(row.id, "id"),
            createdAt: assertString(row.createdAt, "createdAt"),
          };
          if (kind === "users")
            return {
              ...common,
              title: assertString(row.email, "email"),
              description:
                typeof row.fullName === "string"
                  ? row.fullName
                  : typeof row.username === "string"
                    ? row.username
                    : "Chưa có tên",
              status: row.isActive ? "Đang hoạt động" : "Đã khóa",
              role: assertString(row.role, "role"),
              isActive: assertBoolean(row.isActive, "isActive"),
            };
          if (kind === "community")
            return {
              ...common,
              title: assertString(row.title, "title"),
              description: assertString(row.postType, "postType"),
              status: assertString(row.status, "status"),
              content: typeof row.contentMd === "string" ? row.contentMd : "",
            };
          return {
            ...common,
            title: assertString(row.action, "action"),
            description:
              typeof row.actorEmail === "string" ? row.actorEmail : "Hệ thống",
            status:
              typeof row.resourceType === "string" ? row.resourceType : "—",
            content: typeof row.resourceId === "string" ? row.resourceId : "",
          };
        }),
      };
    },
    async updateUser(id: string, payload: { role: string; isActive: boolean }) {
      if (!["student", "teacher", "admin"].includes(payload.role))
        throw new ApiError(400, "VALIDATION_ERROR");
      await request(`/api/v1/admin/users/${assertUuid(id, "id")}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    async moderate(id: string, status: string) {
      if (!["published", "hidden", "deleted"].includes(status))
        throw new ApiError(400, "VALIDATION_ERROR");
      await request(`/api/v1/admin/forum/posts/${assertUuid(id, "id")}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  };
}
