export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// In production (Vercel), API is served from /api route
// In development, use the backend server URL
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 
  (import.meta.env.PROD ? "/api" : "http://localhost:4000");

type RequestOptions = RequestInit & {
  json?: unknown;
};

export async function request<T>(path: string, options: RequestOptions = {}) {
  const url = `${API_BASE}${path}`;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.json ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.json ? JSON.stringify(options.json) : options.body,
  });

  const parseBody = async () => {
    try {
      return await response.json();
    } catch (e) {
      return null;
    }
  };

  if (!response.ok) {
    const payload = await parseBody();
    const message =
      (payload as any)?.error ??
      response.statusText ??
      "Request failed. Please try again.";
    throw new ApiError(message, response.status, payload);
  }

  return (await parseBody()) as T;
}
