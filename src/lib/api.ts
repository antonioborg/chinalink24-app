export type ApiRole = "admin" | "staff" | "warehouse" | "customs" | "client";

const headers = (role: ApiRole, customerId?: string) => ({
  "Content-Type": "application/json",
  "x-cl24-role": role,
  ...(customerId ? { "x-cl24-customer-id": customerId } : {})
});

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { role: ApiRole; customerId?: string }
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...headers(options.role, options.customerId),
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
