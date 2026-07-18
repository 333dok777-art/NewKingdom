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
    const error = new Error(`Could not reach the registration service at ${target}. Check VITE_API_BASE_URL and the backend CORS configuration.`, { cause })
    error.code = 'network_error'
    error.status = 0
    throw error
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = body.error || `Registration service returned ${response.status} ${response.statusText}.`
    const error = new Error(message)
    error.status = response.status
    error.code = body.code || 'request_failed'
    error.requestId = body.requestId || response.headers.get('X-Request-Id')
    error.cooldownSeconds = body.cooldownSeconds
    error.retryAfterSeconds = body.retryAfterSeconds
    throw error
  }
  return body
}

export const startRegistration = (payload) => request('/api/registration/start', { method: 'POST', body: JSON.stringify(payload) })
export const verifyRegistration = (code) => request('/api/registration/verify', { method: 'POST', body: JSON.stringify({ code }) })
export const resendRegistrationCode = () => request('/api/registration/resend', { method: 'POST', body: '{}' })

export function registrationErrorMessage(error, language) {
  const english = language === 'en'
  if (error.code === 'rate_limited') return english ? `Too many attempts from this connection. Please wait ${error.retryAfterSeconds || 900} seconds and try again.` : `Забагато спроб із цього з’єднання. Зачекайте ${error.retryAfterSeconds || 900} секунд і спробуйте ще раз.`
  if (error.code === 'invalid_registration') return english ? 'Please check all registration fields and try again.' : 'Перевірте всі поля реєстрації та спробуйте ще раз.'
  if (error.code === 'registration_conflict') return english ? 'This username or email cannot be used for a new registration.' : 'Це ім’я користувача або email не можна використати для нової реєстрації.'
  if (error.code === 'email_not_configured') return english ? 'Email delivery is temporarily unavailable.' : 'Надсилання електронної пошти тимчасово недоступне.'
  const reference = error.requestId ? ` (${english ? 'reference' : 'код'}: ${error.requestId})` : ''
  return `${error.message}${reference}`
}
