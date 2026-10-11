const preferenceKey = 'studyflow-remember-session'

export function rememberSession(remember) {
  localStorage.setItem(preferenceKey, String(remember))
}

// Read existing Supabase sessions unchanged. New writes use the selected lifetime.
// Supabase still owns refresh, token validation, and clearing sessions on logout.
export const authStorage = {
  getItem(key) {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key)
  },
  setItem(key, value) {
    const remember = localStorage.getItem(preferenceKey) !== 'false'
    const destination = remember ? localStorage : sessionStorage
    const other = remember ? sessionStorage : localStorage
    destination.setItem(key, value)
    other.removeItem(key)
  },
  removeItem(key) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}
