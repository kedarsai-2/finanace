export const USE_BACKEND =
  import.meta.env.VITE_USE_BACKEND === "1" || import.meta.env.VITE_USE_BACKEND === "true";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:8080";
