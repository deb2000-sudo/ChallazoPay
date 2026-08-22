import { ADMIN_CREDENTIALS, SESSION_STORAGE_KEY } from '../config/auth'

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export function verifyCredentials(email, password) {
  return (
    normalizeEmail(email) === ADMIN_CREDENTIALS.email &&
    String(password ?? '') === ADMIN_CREDENTIALS.password
  )
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    // Re-check the stored email so an edited localStorage entry cannot mint a session.
    return normalizeEmail(parsed?.email) === ADMIN_CREDENTIALS.email ? parsed : null
  } catch {
    return null
  }
}

export function saveSession(email) {
  const session = { email: normalizeEmail(email), signedInAt: new Date().toISOString() }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
