const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function apiUrl(path) {
  return `${apiBaseUrl}${path}`
}

async function request(path, options = {}) {
  const url = apiUrl(path)
  let response
  try {
    response = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options })
  } catch (cause) {
    const target = apiBaseUrl || window.location.origin
    throw new Error(`Could not reach the registration service at ${target}. Check VITE_API_BASE_URL and the backend CORS configuration.`, { cause })
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = body.error || `Registration service returned ${response.status} ${response.statusText}.`
    const error = new Error(message)
    error.cooldownSeconds = body.cooldownSeconds
    throw error
  }
  return body
}

export const startRegistration = (payload) => request('/api/registration/start', { method: 'POST', body: JSON.stringify(payload) })
export const verifyRegistration = (code) => request('/api/registration/verify', { method: 'POST', body: JSON.stringify({ code }) })
export const resendRegistrationCode = () => request('/api/registration/resend', { method: 'POST', body: '{}' })
