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

type FetchJsonOptions = RequestInit & {
  retries?: number
  retryDelayMs?: number
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function readJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export async function fetchJsonWithRetry<T = any>(path: string, options: FetchJsonOptions = {}) {
  const { retries = 1, retryDelayMs = 2500, ...fetchOptions } = options
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(apiUrl(path), fetchOptions)

      if (!response.ok) {
        const payload = await readJsonResponse(response)

        if ([502, 503, 504].includes(response.status) && attempt < retries) {
          await sleep(retryDelayMs)
          continue
        }

        throw new Error(payload?.error?.message || payload?.message || `Request failed with status ${response.status}`)
      }

      return (await readJsonResponse(response)) as T
    } catch (error) {
      lastError = error

      if (attempt < retries) {
        await sleep(retryDelayMs)
        continue
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed")
}
