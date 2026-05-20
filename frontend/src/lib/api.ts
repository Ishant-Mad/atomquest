const DEFAULT_API_BASE_URL = "https://backend-atomquest.onrender.com"
const LOCAL_API_BASE_URL = "http://localhost:5001"

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
  const fallbackUrl = process.env.NODE_ENV === "development" ? LOCAL_API_BASE_URL : DEFAULT_API_BASE_URL
  return configuredUrl || fallbackUrl
}

export function apiUrl(path: string) {
  return new URL(path, getApiBaseUrl()).toString()
}
