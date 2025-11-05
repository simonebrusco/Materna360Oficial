export async function safeFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8000
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(input, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}
