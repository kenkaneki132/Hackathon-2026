// API client. Talks to the FastAPI backend when available; otherwise falls back to the
// in-browser engine (localEngine.js) so the app keeps working offline / on static hosting.
import * as local from './localEngine.js'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

async function authFetch(url, options = {}, getToken = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (getToken) {
    try {
      const token = await getToken({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })
      if (token) headers.Authorization = `Bearer ${token}`
    } catch { /* not logged in — proceed without token */ }
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const err = new Error(`API error ${res.status}`)
    err.status = res.status
    throw err
  }
  return res
}

// Use the backend unless in demo mode; if the backend is unreachable (network error, 404 from a
// static host, or 5xx), transparently fall back to the local engine.
export async function withFallback(remote, fallback, { demo = DEMO_MODE } = {}) {
  if (demo) return fallback()
  try {
    return await remote()
  } catch (e) {
    const unreachable = e instanceof TypeError || e.status === 404 || e.status >= 500
    if (unreachable) return fallback()
    throw e
  }
}

export function analyzeProfile(profile, getToken = null) {
  return withFallback(
    async () => (await authFetch(`${BASE}/analyze`, { method: 'POST', body: JSON.stringify(profile) }, getToken)).json(),
    () => local.analyzeProfile(profile),
  )
}

export function sendChat(message, profile = null, getToken = null) {
  return withFallback(
    async () => (await authFetch(`${BASE}/chat`, { method: 'POST', body: JSON.stringify({ message, profile }) }, getToken)).json(),
    () => ({ response: local.fallbackChat(message), source: 'local' }),
  )
}

// Returns an audio Blob from ElevenLabs, or null when unavailable (caller uses browser speech).
export async function textToSpeech(text, getToken) {
  if (DEMO_MODE) return null
  try {
    return await (await authFetch(`${BASE}/tts`, { method: 'POST', body: JSON.stringify({ text }) }, getToken)).blob()
  } catch {
    return null
  }
}

export function getFloodRisk(zipCode, getToken = null) {
  return withFallback(
    async () => (await authFetch(`${BASE}/flood-risk/${zipCode}`, {}, getToken)).json(),
    () => {
      const risk = local.getFloodRisk(zipCode)
      return { zip_code: zipCode, risk_level: risk, tip: local.FLOOD_TIPS[risk] || '' }
    },
  )
}

export async function getMe(getToken) {
  return (await authFetch(`${BASE}/me`, {}, getToken)).json()
}

export function simulateProfile(profile, getToken = null) {
  return withFallback(
    async () => (await authFetch(`${BASE}/simulate`, { method: 'POST', body: JSON.stringify(profile) }, getToken)).json(),
    () => local.simulateProfile(profile),
  )
}

export function sendSimChat(message, profile = null, getToken = null) {
  return withFallback(
    async () => (await authFetch(`${BASE}/simulate/chat`, { method: 'POST', body: JSON.stringify({ message, profile }) }, getToken)).json(),
    () => ({ response: local.fallbackChat(message), source: 'local' }),
  )
}
