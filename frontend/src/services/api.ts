import type {
  LoginPayload,
  RegisterPayload,
  Ticket,
  TicketCreatePayload,
  TicketStatus,
  TokenResponse,
  User,
} from "../types/helpdesk";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Erro na requisição (${response.status})`;
    try {
      const errorData = (await response.json()) as {
        detail?: string | Array<{ msg?: string }>;
      };
      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg;
      }
    } catch {
      // Mantém a mensagem padrão caso a resposta não seja JSON
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const api = {
  register(payload: RegisterPayload): Promise<User> {
    return request<User>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: LoginPayload): Promise<TokenResponse> {
    return request<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMe(token: string): Promise<User> {
    return request<User>("/api/v1/auth/me", { method: "GET" }, token);
  },

  createTicket(token: string, payload: TicketCreatePayload): Promise<Ticket> {
    return request<Ticket>(
      "/api/v1/tickets",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    );
  },

  listTickets(
    token: string,
    filters?: { status?: string; categoria?: string },
  ): Promise<Ticket[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.categoria) params.set("categoria", filters.categoria);

    const query = params.toString();
    const path = query ? `/api/v1/tickets?${query}` : "/api/v1/tickets";
    return request<Ticket[]>(path, { method: "GET" }, token);
  },

  getTicketByProtocolo(token: string, protocolo: string): Promise<Ticket> {
    const clean = encodeURIComponent(protocolo.trim().toUpperCase());
    return request<Ticket>(`/api/v1/tickets/${clean}`, { method: "GET" }, token);
  },

  updateTicketStatus(
    token: string,
    protocolo: string,
    status: TicketStatus,
  ): Promise<Ticket> {
    const clean = encodeURIComponent(protocolo.trim().toUpperCase());
    return request<Ticket>(
      `/api/v1/tickets/${clean}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      token,
    );
  },
};