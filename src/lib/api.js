async function request(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) { const error = new Error(body.error || 'Unable to complete this request.'); error.cooldownSeconds = body.cooldownSeconds; throw error }
  return body
}

export const startRegistration = (payload) => request('/api/registration/start', { method: 'POST', body: JSON.stringify(payload) })
export const verifyRegistration = (code) => request('/api/registration/verify', { method: 'POST', body: JSON.stringify({ code }) })
export const resendRegistrationCode = () => request('/api/registration/resend', { method: 'POST', body: '{}' })
