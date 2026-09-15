import type { Content, Page, PublicPage, Template, Theme } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/**
 * Thrown for any non-2xx response. `body` carries the parsed JSON as-is
 * (e.g. Laravel's 422 validation shape, or a 404 `{ message }`) since the
 * API is the source of truth for validation — this client does none.
 */
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return body as T;
}

export function getPage(): Promise<Page> {
  return request<Page>("/page");
}

export function updatePageContent(content: Content): Promise<Page> {
  return request<Page>("/page/content", {
    method: "PUT",
    body: JSON.stringify(content),
  });
}

export function updatePageTheme(theme: Theme): Promise<Page> {
  return request<Page>("/page/theme", {
    method: "PUT",
    body: JSON.stringify(theme),
  });
}

export function getTemplates(): Promise<Template[]> {
  return request<Template[]>("/templates");
}

export function getPublicPage(slug: string): Promise<PublicPage> {
  return request<PublicPage>(`/p/${encodeURIComponent(slug)}`);
}

export function applyTemplate(templateId: string): Promise<Page> {
  return request<Page>(
    `/page/apply-template/${encodeURIComponent(templateId)}`,
    {
      method: "POST",
    },
  );
}
