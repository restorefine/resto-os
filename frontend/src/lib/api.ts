import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isPortal = window.location.pathname.startsWith("/portal");
      window.location.href = isPortal ? "/portal/login" : "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
