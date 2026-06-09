const JWT_KEY = "launcher_jwt";

export function storeJwt(token: string): void {
  sessionStorage.setItem(JWT_KEY, token);
}

export function getJwt(): string | null {
  return sessionStorage.getItem(JWT_KEY);
}

export function clearJwt(): void {
  sessionStorage.removeItem(JWT_KEY);
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const jwt = getJwt();
  const headers = new Headers(init.headers);
  if (jwt) headers.set("Authorization", `Bearer ${jwt}`);
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    clearJwt();
    window.location.href = "/";
  }
  return res;
}

export async function exchangeToken(rawToken: string): Promise<string> {
  const res = await fetch("/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: rawToken }),
  });
  if (!res.ok) throw new Error("Token exchange failed");
  const data = await res.json();
  return data.access_token;
}

export async function getDashboard(): Promise<unknown> {
  const res = await apiFetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}
