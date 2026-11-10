import {
  adaptCodeTemplate,
  adaptDailyChallenge,
  adaptLandingData,
  adaptLanguagesResponse,
  adaptPackageDetail,
  adaptPackagesPage,
  adaptProblemDetail,
  adaptProblemsPage,
  adaptSamplesResponse,
  adaptTagsResponse,
  type CodeTemplateModel,
  type DailyChallengeModel,
  type LandingModel,
  type LanguageModel,
  type PackageDetailModel,
  type PackageModel,
  type ProblemDetailModel,
  type ProblemSummaryModel,
  type SampleModel,
  type TagModel,
} from "@/lib/api/adapters/catalog";
import {
  buildApiPath,
  type RequestOptions,
  type Requester,
} from "@/lib/api/client";
import { assertSlugParam, assertUuidParam } from "@/lib/api/domains/preflight";
import type {
  ListPackagesQuery,
  ListProblemsQuery,
  PaginatedData,
} from "@/lib/api/types";

function toRequestInit(options?: RequestOptions): RequestInit {
  if (!options) return {};
  return {
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
  };
}

export function createCatalogClient(deps: {
  authRequest: Requester;
  publicRequest: Requester;
}) {
  return {
    async getLanding(options?: RequestOptions): Promise<LandingModel> {
      const raw = await deps.publicRequest<unknown>(
        "/api/v1/public/landing",
        toRequestInit(options),
      );
      return adaptLandingData(raw);
    },

    async listLanguages(options?: RequestOptions): Promise<LanguageModel[]> {
      const raw = await deps.publicRequest<unknown>(
        "/api/v1/languages",
        toRequestInit(options),
      );
      return adaptLanguagesResponse(raw, "listLanguages");
    },

    async listTags(options?: RequestOptions): Promise<TagModel[]> {
      const raw = await deps.publicRequest<unknown>(
        "/api/v1/tags",
        toRequestInit(options),
      );
      return adaptTagsResponse(raw);
    },

    async listPackages(
      query?: ListPackagesQuery,
      options?: RequestOptions,
    ): Promise<PaginatedData<PackageModel>> {
      const path = buildApiPath("/api/v1/packages", query);
      const raw = await deps.authRequest<unknown>(path, toRequestInit(options));
      return adaptPackagesPage(raw);
    },

    async getPackage(
      slug: string,
      options?: RequestOptions,
    ): Promise<PackageDetailModel> {
      const cleanSlug = assertSlugParam(slug, "slug");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/packages/${encodeURIComponent(cleanSlug)}`,
        toRequestInit(options),
      );
      return adaptPackageDetail(raw);
    },

    async getPackageLevels(
      slug: string,
      options?: RequestOptions,
    ): Promise<PackageDetailModel> {
      const cleanSlug = assertSlugParam(slug, "slug");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/packages/${encodeURIComponent(cleanSlug)}/levels`,
        toRequestInit(options),
      );
      return adaptPackageDetail(raw);
    },

    async listProblems(
      query?: ListProblemsQuery,
      options?: RequestOptions,
    ): Promise<PaginatedData<ProblemSummaryModel>> {
      const path = buildApiPath("/api/v1/problems", query);
      const raw = await deps.authRequest<unknown>(path, toRequestInit(options));
      return adaptProblemsPage(raw);
    },

    async getProblem(
      slug: string,
      options?: RequestOptions,
    ): Promise<ProblemDetailModel> {
      const cleanSlug = assertSlugParam(slug, "slug");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/problems/${encodeURIComponent(cleanSlug)}`,
        toRequestInit(options),
      );
      return adaptProblemDetail(raw);
    },

    async getProblemLanguages(
      slug: string,
      options?: RequestOptions,
    ): Promise<LanguageModel[]> {
      const cleanSlug = assertSlugParam(slug, "slug");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/problems/${encodeURIComponent(cleanSlug)}/languages`,
        toRequestInit(options),
      );
      return adaptLanguagesResponse(raw, "getProblemLanguages");
    },

    async getTemplate(
      slug: string,
      languageId: string,
      options?: RequestOptions,
    ): Promise<CodeTemplateModel> {
      const cleanSlug = assertSlugParam(slug, "slug");
      const cleanLanguageId = assertUuidParam(languageId, "languageId");
      const path = buildApiPath(
        `/api/v1/problems/${encodeURIComponent(cleanSlug)}/template`,
        { languageId: cleanLanguageId },
      );
      const raw = await deps.authRequest<unknown>(path, toRequestInit(options));
      return adaptCodeTemplate(raw);
    },

    async getSamples(
      slug: string,
      options?: RequestOptions,
    ): Promise<SampleModel[]> {
      const cleanSlug = assertSlugParam(slug, "slug");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/problems/${encodeURIComponent(cleanSlug)}/samples`,
        toRequestInit(options),
      );
      return adaptSamplesResponse(raw);
    },

    async getDailyChallenge(
      options?: RequestOptions,
    ): Promise<DailyChallengeModel> {
      const raw = await deps.authRequest<unknown>(
        "/api/v1/daily-challenge",
        toRequestInit(options),
      );
      return adaptDailyChallenge(raw);
    },
  };
}
