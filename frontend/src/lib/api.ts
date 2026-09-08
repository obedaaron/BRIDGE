export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Render services can take longer than 30 seconds to wake after inactivity.
const REQUEST_TIMEOUT_MS = 60_000;

async function request(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError("BRIDGE is taking too long to respond. The server may be waking up—please try again.", 504);
    if (error instanceof TypeError) throw new ApiError("BRIDGE could not connect to the server. Check your connection and try again.", 0);
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function readResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!contentType.includes("application/json")) {
    const destination = API_URL === window.location.origin
      ? "the BRIDGE website instead of the API"
      : "a non-API response";
    throw new ApiError(`BRIDGE could not reach the API (received ${destination}). Please try again shortly.`, res.status);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError("BRIDGE received an invalid response from the API. Please try again shortly.", res.status);
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const res = await request(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await readResponse(res);
  if (!res.ok) throw new ApiError(data.error || "Request failed", res.status);
  return data;
}
export async function apiUpload(path: string, formData: FormData) {
  const token = localStorage.getItem("token");
  const res = await request(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await readResponse(res);
  if (!res.ok) throw new ApiError(data.error || "Upload failed", res.status);
  return data;
}
