const TOKEN_KEY = 'salon-current-token'
const DETAILS_KEY = 'salon-last-details'

export function getSavedToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // The token can still be used from the URL.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore storage restrictions.
  }
}

export function getSavedDetails() {
  try {
    const raw = localStorage.getItem(DETAILS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveDetails(details) {
  try {
    localStorage.setItem(DETAILS_KEY, JSON.stringify(details))
  } catch {
    // Ignore storage restrictions.
  }
}
