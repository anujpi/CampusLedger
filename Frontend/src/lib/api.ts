const BASE_URL = "http://localhost:8080";

let token: string | null = localStorage.getItem("token");let onUnauthorized: (() => void) | null = null;

export function setToken(t: string | null) {
  token = t;
  if (t) {
    localStorage.setItem("token", t);
  } else {
    localStorage.removeItem("token");
  }
}

export function getToken() {
  return token;
}

export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn;
}

export async function api<T = unknown>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: isFormData ? options.body as FormData : options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text();
    let message = `Request failed (${res.status})`;
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
