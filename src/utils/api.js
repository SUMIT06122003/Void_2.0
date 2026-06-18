/* global __API_BASE_URL__ */

const apiBaseUrl = String(__API_BASE_URL__ || "").replace(/\/+$/, "");
const localDevHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function shouldUseSameOriginApi() {
  if (!apiBaseUrl || typeof window === "undefined") {
    return false;
  }

  return localDevHosts.has(window.location.hostname);
}

export function apiUrl(path) {
  const endpoint = String(path || "");

  if (!apiBaseUrl || shouldUseSameOriginApi() || /^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  return `${apiBaseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}
