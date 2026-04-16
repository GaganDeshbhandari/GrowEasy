import api from "../api/axios";

const ABSOLUTE_URL_PATTERN = /^(?:[a-z]+:)?\/\//i;

export const resolveMediaUrl = (value) => {
  if (!value) return null;

  const path = String(value).trim();
  if (!path) return null;

  if (path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }

  if (ABSOLUTE_URL_PATTERN.test(path)) {
    return path;
  }

  const baseUrl = String(api.defaults.baseURL || "").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

