import {
  adaptAiReviewData,
  adaptLatestSubmissionData,
  adaptMySubmissionsPage,
  adaptRunData,
  adaptSubmissionData,
  adaptSubmissionTestResultsResponse,
  adaptUserStats,
  type AiReviewModel,
  type RunDataModel,
  type SubmissionModel,
  type SubmissionSummaryModel,
  type SubmissionTestMetadataModel,
  type UserStatsModel,
} from "@/lib/api/adapters/judge";
import {
  buildApiPath,
  type RequestOptions,
  type Requester,
} from "@/lib/api/client";
import {
  assertExecutePayload,
  assertUuidParam,
} from "@/lib/api/domains/preflight";
import type {
  ExecuteRequest,
  ListMySubmissionsQuery,
  PaginatedData,
} from "@/lib/api/types";

function toRequestInit(
  options?: RequestOptions,
  extra?: RequestInit,
): RequestInit {
  return {
    ...extra,
    ...(options?.signal ? { signal: options.signal } : {}),
    ...(options?.headers ? { headers: options.headers } : {}),
  };
}

export function createJudgeClient(deps: { authRequest: Requester }) {
  return {
    async runSamples(
      payload: ExecuteRequest,
      options?: RequestOptions,
    ): Promise<RunDataModel> {
      const valid = assertExecutePayload(payload);
      const raw = await deps.authRequest<unknown>(
        "/api/v1/run",
        toRequestInit(options, {
          method: "POST",
          body: JSON.stringify({
            problemId: valid.problemId,
            languageId: valid.languageId,
            code: valid.code,
          }),
        }),
      );
      return adaptRunData(raw);
    },

    async submitCode(
      payload: ExecuteRequest,
      options?: RequestOptions,
    ): Promise<SubmissionModel> {
      const valid = assertExecutePayload(payload);
      const raw = await deps.authRequest<unknown>(
        "/api/v1/submit",
        toRequestInit(options, {
          method: "POST",
          body: JSON.stringify({
            problemId: valid.problemId,
            languageId: valid.languageId,
            code: valid.code,
          }),
        }),
      );
      return adaptSubmissionData(raw);
    },

    async getSubmission(
      id: string,
      options?: RequestOptions,
    ): Promise<SubmissionModel> {
      const cleanId = assertUuidParam(id, "id");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/submissions/${encodeURIComponent(cleanId)}`,
        toRequestInit(options),
      );
      return adaptSubmissionData(raw);
    },

    async listMySubmissions(
      query?: ListMySubmissionsQuery,
      options?: RequestOptions,
    ): Promise<PaginatedData<SubmissionSummaryModel>> {
      if (query?.problemId) assertUuidParam(query.problemId, "problemId");
      if (query?.languageId) assertUuidParam(query.languageId, "languageId");
      const path = buildApiPath("/api/v1/me/submissions", query);
      const raw = await deps.authRequest<unknown>(path, toRequestInit(options));
      return adaptMySubmissionsPage(raw);
    },

    async getLatestSubmission(
      problemId: string,
      languageId?: string,
      options?: RequestOptions,
    ): Promise<SubmissionModel | null> {
      const cleanProblemId = assertUuidParam(problemId, "problemId");
      if (languageId) assertUuidParam(languageId, "languageId");
      const path = buildApiPath(
        `/api/v1/me/submissions/${encodeURIComponent(cleanProblemId)}/latest`,
        languageId ? { languageId } : undefined,
      );
      const raw = await deps.authRequest<unknown>(path, toRequestInit(options));
      return adaptLatestSubmissionData(raw);
    },

    async getSubmissionTestResults(
      id: string,
      options?: RequestOptions,
    ): Promise<SubmissionTestMetadataModel[]> {
      const cleanId = assertUuidParam(id, "id");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/submissions/${encodeURIComponent(cleanId)}/test-results`,
        toRequestInit(options),
      );
      return adaptSubmissionTestResultsResponse(raw);
    },

    async getMyStats(options?: RequestOptions): Promise<UserStatsModel> {
      const raw = await deps.authRequest<unknown>(
        "/api/v1/me/stats",
        toRequestInit(options),
      );
      return adaptUserStats(raw);
    },

    async getAiReview(
      submissionId: string,
      options?: RequestOptions,
    ): Promise<AiReviewModel | null> {
      const cleanId = assertUuidParam(submissionId, "submissionId");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/submissions/${encodeURIComponent(cleanId)}/ai-review`,
        toRequestInit(options),
      );
      return adaptAiReviewData(raw);
    },
  };
}
