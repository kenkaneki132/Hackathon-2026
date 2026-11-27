// Auth wrapper: real Auth0 when configured, otherwise a local "guest" session so the app
// works as a static demo (GitHub Pages) without an identity provider.
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

export const AUTH_ENABLED = Boolean(domain && clientId) && import.meta.env.VITE_DEMO_MODE !== 'true'

const GUEST = Object.freeze({
  isGuest: true,
  isAuthenticated: true,
  isLoading: false,
  user: { name: 'Guest', given_name: 'Guest' },
  loginWithRedirect: async () => {},
  logout: () => {},
  getAccessTokenSilently: async () => null,
})

// AUTH_ENABLED is a build-time constant, so the hook call order never changes between renders.
export function useAuth() {
  return AUTH_ENABLED ? useAuth0() : GUEST
}

export function AuthProvider({ children }) {
  if (!AUTH_ENABLED) return children
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin, audience }}
    >
      {children}
    </Auth0Provider>
  )
}
