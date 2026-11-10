import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import {
  createApiClient,
  ApiError,
  type ApiClient,
  type CodeTemplateModel,
  type ProblemDetailModel,
} from "@/lib/api";
import { adaptProblemDetail } from "@/lib/api/adapters/catalog";
import {
  createProblemResource,
  type ProblemState,
} from "@/features/problems/resource";
import { ProblemContent } from "@/features/problems/ProblemContent";
import { Statement } from "@/features/problems/Statement";

const spec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
);
const rawDetail =
  spec.paths["/api/v1/problems/{slug}"].get.responses[200].content[
    "application/json"
  ].example.data;
const detail = adaptProblemDetail(rawDetail);
const language1 = detail.languages[0].id;
const language2 = ["22222222", "2222", "4222", "8222", "222222222222"].join(
  "-",
);
const template: CodeTemplateModel = {
  problemId: detail.problem.id,
  languageId: language1,
  starterCode: "  print(1)\n\n",
  fileName: "main.py",
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
function setup(overrides: Partial<ApiClient["catalog"]> = {}) {
  const catalog = {
    getProblem: vi.fn().mockResolvedValue(detail),
    getTemplate: vi.fn().mockResolvedValue(template),
    ...overrides,
  } as ApiClient["catalog"];
  return { catalog, resource: createProblemResource({ catalog }, "sum-two") };
}
function withTwoLanguages(): ProblemDetailModel {
  return {
    ...detail,
    languages: [
      ...detail.languages,
      {
        ...detail.languages[0],
        id: language2,
        slug: "cpp17",
        displayLabel: "C++ (17)",
      },
    ],
  };
}

describe("problem resource against learner contract", () => {
  it("waits for detail, loads its first supported language, and preserves exact starter whitespace", async () => {
    const pending = deferred<ProblemDetailModel>();
    const { resource, catalog } = setup({
      getProblem: vi.fn(() => pending.promise),
    });
    const load = resource.load();
    expect(resource.getSnapshot().status).toBe("loading");
    expect(catalog.getTemplate).not.toHaveBeenCalled();
    pending.resolve(detail);
    await load;
    expect(resource.getSnapshot()).toMatchObject({
      status: "ready",
      languageId: language1,
      templateStatus: "ready",
      template,
    });
    expect(catalog.getTemplate).toHaveBeenCalledWith(
      "sum-two",
      language1,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it.each([
    new ApiError(403, "LEVEL_LOCKED"),
    new ApiError(404, "NOT_FOUND"),
    new ApiError(503, "UNAVAILABLE"),
  ])("does not fetch template when detail fails: %s", async (error) => {
    const { resource, catalog } = setup({
      getProblem: vi.fn().mockRejectedValue(error),
    });
    await resource.load();
    expect(resource.getSnapshot()).toMatchObject({
      status: "error",
      detail: null,
      template: null,
      error,
    });
    expect(catalog.getTemplate).not.toHaveBeenCalled();
  });

  it("fails closed even if a success body incorrectly includes locked content", async () => {
    const { resource, catalog } = setup({
      getProblem: vi.fn().mockResolvedValue({
        ...detail,
        problem: { ...detail.problem, unlocked: false },
      }),
    });
    await resource.load();
    expect(resource.getSnapshot().error).toMatchObject({
      code: "LEVEL_LOCKED",
    });
    expect(resource.getSnapshot().detail).toBeNull();
    expect(catalog.getTemplate).not.toHaveBeenCalled();
  });

  it("rejects detail for another slug and template for another problem/language", async () => {
    const wrongDetail = setup({
      getProblem: vi.fn().mockResolvedValue({
        ...detail,
        problem: { ...detail.problem, slug: "other" },
      }),
    });
    await wrongDetail.resource.load();
    expect(wrongDetail.resource.getSnapshot().error).toMatchObject({
      code: "INVALID_CONTRACT_DATA",
    });
    for (const wrong of [{ problemId: language2 }, { languageId: language2 }]) {
      const { resource } = setup({
        getTemplate: vi.fn().mockResolvedValue({ ...template, ...wrong }),
      });
      await resource.load();
      expect(resource.getSnapshot()).toMatchObject({
        templateStatus: "error",
        template: null,
        templateError: { code: "INVALID_CONTRACT_DATA" },
      });
    }
  });

  it("handles no samples, tags, languages without requesting a template", async () => {
    const { resource, catalog } = setup({
      getProblem: vi.fn().mockResolvedValue({
        ...detail,
        languages: [],
        sampleTestCases: [],
        problem: { ...detail.problem, tags: [] },
      }),
    });
    await resource.load();
    expect(resource.getSnapshot()).toMatchObject({
      status: "ready",
      templateStatus: "idle",
      languageId: "",
    });
    expect(catalog.getTemplate).not.toHaveBeenCalled();
  });

  it("aborts and ignores an old language result even when transport ignores abort", async () => {
    const old = deferred<CodeTemplateModel>();
    const getTemplate = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce({
        ...template,
        languageId: language2,
        starterCode: "int main() {}\n",
      });
    const { resource } = setup({
      getProblem: vi.fn().mockResolvedValue(withTwoLanguages()),
      getTemplate,
    });
    const loading = resource.load();
    await vi.waitFor(() => expect(getTemplate).toHaveBeenCalledTimes(1));
    await resource.selectLanguage(language2);
    expect(getTemplate.mock.calls[0][2].signal.aborted).toBe(true);
    old.resolve(template);
    await loading;
    expect(resource.getSnapshot()).toMatchObject({
      languageId: language2,
      template: { languageId: language2, starterCode: "int main() {}\n" },
    });
  });

  it("clears previous template immediately while another language loads and rejects unsupported selection", async () => {
    const next = deferred<CodeTemplateModel>();
    const getTemplate = vi
      .fn()
      .mockResolvedValueOnce(template)
      .mockReturnValueOnce(next.promise);
    const { resource } = setup({
      getProblem: vi.fn().mockResolvedValue(withTwoLanguages()),
      getTemplate,
    });
    await resource.load();
    await resource.selectLanguage("not-a-supported-uuid");
    expect(getTemplate).toHaveBeenCalledTimes(1);
    const change = resource.selectLanguage(language2);
    expect(resource.getSnapshot()).toMatchObject({
      languageId: language2,
      templateStatus: "loading",
      template: null,
    });
    next.resolve({ ...template, languageId: language2 });
    await change;
  });

  it("keeps detail and allows retry after template 422 or network/5xx", async () => {
    for (const error of [
      new ApiError(422, "LANGUAGE_NOT_SUPPORTED"),
      new ApiError(0, "NETWORK_ERROR"),
      new ApiError(503, "UNAVAILABLE"),
    ]) {
      const { resource } = setup({
        getTemplate: vi
          .fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce(template),
      });
      await resource.load();
      expect(resource.getSnapshot()).toMatchObject({
        status: "ready",
        detail,
        templateStatus: "error",
        template: null,
      });
      await resource.selectLanguage(language1);
      expect(resource.getSnapshot().templateStatus).toBe("ready");
    }
  });

  it.each([
    new ApiError(403, "LEVEL_LOCKED"),
    new ApiError(401, "UNAUTHORIZED"),
  ])("removes detail when template access is revoked: %s", async (error) => {
    const { resource } = setup({
      getTemplate: vi.fn().mockRejectedValue(error),
    });
    await resource.load();
    expect(resource.getSnapshot()).toMatchObject({
      status: "error",
      detail: null,
      template: null,
      error,
    });
  });

  it("cancels pending requests on unmount/logout so late results cannot restore data", async () => {
    const pending = deferred<ProblemDetailModel>();
    const getProblem = vi.fn<ApiClient["catalog"]["getProblem"]>(
      () => pending.promise,
    );
    const { resource, catalog } = setup({ getProblem });
    const load = resource.load();
    resource.cancel();
    expect(getProblem.mock.calls[0][1]?.signal?.aborted).toBe(true);
    pending.resolve(detail);
    await load;
    expect(resource.getSnapshot().detail).toBeNull();
    expect(catalog.getTemplate).not.toHaveBeenCalled();
  });

  it("retries detail and does not let a previous load overwrite the new load", async () => {
    const old = deferred<ProblemDetailModel>();
    const { resource } = setup({
      getProblem: vi
        .fn()
        .mockReturnValueOnce(old.promise)
        .mockResolvedValueOnce(detail),
    });
    const first = resource.load();
    await resource.load();
    old.reject(new ApiError(500, "OLD_ERROR"));
    await first;
    expect(resource.getSnapshot()).toMatchObject({
      status: "ready",
      detail,
      template,
    });
  });

  it("uses authenticated /api/v1 catalog endpoints and UUID template query with AbortSignal", async () => {
    const authRequest = vi
      .fn()
      .mockResolvedValueOnce(rawDetail)
      .mockResolvedValueOnce(template);
    const publicRequest = vi.fn();
    const resource = createProblemResource(
      createApiClient({ authRequest, publicRequest }),
      "sum-two",
    );
    await resource.load();
    expect(authRequest.mock.calls.map(([path]) => path)).toEqual([
      "/api/v1/problems/sum-two",
      `/api/v1/problems/sum-two/template?languageId=${language1}`,
    ]);
    expect(authRequest.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(publicRequest).not.toHaveBeenCalled();
  });
});

describe("problem presentation and Markdown safety", () => {
  function render(state: Partial<ProblemState> = {}) {
    return renderToStaticMarkup(
      createElement(ProblemContent, {
        state: {
          status: "ready",
          detail,
          error: null,
          languageId: language1,
          templateStatus: "ready",
          template,
          templateError: null,
          ...state,
        },
        reload() {},
        selectLanguage() {},
      }),
    );
  }
  it("renders contract title, samples, all limits, language label and exact template", () => {
    const html = render();
    for (const text of [
      "Sum two numbers",
      "1000 ms",
      "128 MB",
      "1048576 byte",
      "Ngôn ngữ lập trình",
      "main.py",
      "  print(1)\n\n",
      "1 2\n",
    ])
      expect(html).toContain(text);
    expect(html).not.toContain("wrapperCode");
  });
  it("escapes sample/code HTML and does not execute raw HTML, unsafe links or remote images in Markdown", () => {
    const html = renderToStaticMarkup(
      createElement(
        Statement,
        null,
        "# Heading\n\n**Bold** and `code`\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert%281%29)\n\n![image](https://tracker.invalid/pixel)\n\n[docs](https://example.com)\n\n```py\n<script>not executable</script>\n```",
      ),
    );
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("&lt;script&gt;not executable&lt;/script&gt;");
    expect(html).not.toMatch(/<script|<img|javascript:|onerror=/i);
    expect(html).toContain('href="https://example.com"');
    const escaped = render({
      template: { ...template, starterCode: "<script>alert(1)</script>" },
    });
    expect(escaped).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
  it("shows loading/error without stale protected content and gives an accessible retry", () => {
    const loading = render({ status: "loading" });
    expect(loading).toContain('role="status"');
    expect(loading).not.toContain(detail.problem.title);
    const locked = render({
      status: "error",
      error: new ApiError(403, "LEVEL_LOCKED"),
    });
    expect(locked).toContain("Bài tập chưa mở khóa");
    expect(locked).toContain("Thử tải lại");
    expect(locked).not.toContain(detail.statementMd);
  });
  it("covers function mode and empty fields without inventing a template", () => {
    const html = render({
      detail: {
        ...detail,
        isFunctionMode: true,
        executionMode: "function",
        functionName: "solve",
        sampleTestCases: [],
        languages: [],
      },
    });
    expect(html).toContain("Hoàn thành hàm solve.");
    expect(html).toContain("chưa có ví dụ mẫu");
    expect(html).toContain("Chưa có ngôn ngữ khả dụng");
    expect(html).not.toContain(template.starterCode);
  });
});
