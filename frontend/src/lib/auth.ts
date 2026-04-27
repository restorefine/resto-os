import api from "./api";
import { User } from "./types";

// Backend wraps every response: { data: T, message: string }
type ApiWrap<T> = { data: T; message: string };

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<ApiWrap<{ user: User }>>("/api/auth/login", {
    email,
    password,
  });
  return data.data.user;
}

export async function portalLogin(email: string, password: string): Promise<User> {
  const { data } = await api.post<ApiWrap<{ user: User }>>("/api/auth/login", {
    email,
    password,
  });
  return data.data.user;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiWrap<{ user: User }>>("/api/auth/me");
  return data.data.user;
}

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  await api.post("/api/auth/change-password", {
    old_password: oldPassword,
    new_password: newPassword,
  });
}
