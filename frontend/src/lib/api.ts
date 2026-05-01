import axios from "axios";

const api = axios.create({
  // Empty baseURL: all /api/* calls are routed through the Next.js proxy
  // at /src/app/api/[...path]/route.ts which forwards to the backend and
  // re-sets cookies on the frontend domain so middleware can read them.
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_PATHS = ["/login", "/portal/login"];

api.interceptors.response.use(
  (response) => {
    console.log(`[api] ${response.config.method?.toUpperCase()} ${response.config.url} →`, response.status, response.data);
    return response;
  },
  (error) => {
    console.error(
      `[api] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status}`,
      error.response?.data ?? error.message
    );
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const { pathname } = window.location;
      const isPortal = pathname.startsWith("/portal");
      const loginPath = isPortal ? "/portal/login" : "/login";
      if (!PUBLIC_PATHS.includes(pathname)) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
