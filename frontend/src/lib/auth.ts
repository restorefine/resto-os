import api from "./api";
import { User } from "./types";

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<{ user: User }>("/api/auth/login", {
    email,
    password,
  });
  return data.user;
}

export async function portalLogin(
  email: string,
  password: string
): Promise<User> {
  const { data } = await api.post<{ user: User }>("/api/auth/portal/login", {
    email,
    password,
  });
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>("/api/auth/me");
  return data.user;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.post("/api/auth/change-password", {
    currentPassword,
    newPassword,
  });
}
