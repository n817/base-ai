import type { CurrentUser } from "../types";

const BASE_URL = "/api";

export type LibraryDoc = {
  _id: string;
  title: string;
  fileName: string;
  userId: string;
  createdAt: string;
};

export type Chat = {
  _id: string;
  title: string;
  userId: string;
  createdAt: string;
};

export type Message = {
  _id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ChatModel = {
  id: string;
  name: string;
};

export type ModelsResponse = {
  models: ChatModel[];
  defaultModel: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("auth-token") ?? "";

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message || "Invalid credentials";
    if (localStorage.getItem("auth-token")) {
      localStorage.removeItem("auth-token");
      window.location.href = "/login";
    }
    throw new Error(message);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || "Request failed");
  }

  return res.json();
}

export function getCurrentUser() {
  return request<CurrentUser>(`${BASE_URL}/users/me`);
}

export function loginUser(email: string, password: string) {
  return request<{ token: string; user: CurrentUser }>(
    `${BASE_URL}/auth/login`,
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
}

export function registerUser(name: string, email: string, password: string) {
  return request<{ user: CurrentUser }>(`${BASE_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

// Get documents
export const getDocuments = (): Promise<ApiResponse<LibraryDoc[]>> => {
  return request<LibraryDoc[]>(`${BASE_URL}/documents`);
};

// Upload document
export const uploadDocument = async (
  file: File,
): Promise<ApiResponse<LibraryDoc>> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || "Request failed");
  }

  return res.json();
};

// Get chats
export const getChats = async () => {
  return request<Chat[]>(`${BASE_URL}/chats`);
};

// Get chat
export const getChat = async (id: string) => {
  return request<{ chat: Chat; messages: Message[] }>(
    `${BASE_URL}/chats/${id}`,
  );
};

// Create chat
export const createChat = async (title: string) => {
  return request<Chat>(`${BASE_URL}/chats`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
};

// Send message; without a model the server uses its default
export const sendMessage = async (
  chatId: string,
  question: string,
  model?: string | null,
) => {
  return request<Message[]>(`${BASE_URL}/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify(model ? { question, model } : { question }),
  });
};

// Get chat models available on Nebius (fetched by the server)
export const getModels = async () => {
  return request<ModelsResponse>(`${BASE_URL}/models`);
};
