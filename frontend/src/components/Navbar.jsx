import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import Icon from './Icon'

function NavLink({ to, icon, label, active, sim }) {
  return (
    <Link to={to} className={`nav-link${sim ? ' sim' : ''}${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} title={label}>
      <Icon name={icon} size={16} /><span className="nav-label">{label}</span>
    </Link>
  )
}

export default function Navbar({ hasProfile, hasSimProfile }) {
  const { pathname } = useLocation()
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user, isGuest } = useAuth()

  const navStyle = { background: 'rgba(255,255,255,0.88)', backdropFilter: 'saturate(180%) blur(12px)', WebkitBackdropFilter: 'saturate(180%) blur(12px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }
  const inner = { maxWidth: 1100, margin: '0 auto', padding: '0 1.25rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }
  const logo = { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--navy)', whiteSpace: 'nowrap' }

  return (
    <nav style={navStyle} aria-label="Main">
      <div style={inner}>
        <Link to="/" style={logo} aria-label="FinGuard AI home">
          <span className="icon-tile" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--emerald)', color: '#fff' }}>
            <Icon name="shieldCheck" size={19} strokeWidth={2} />
          </span>
          <span className="logo-text">FinGuard AI</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {hasProfile && isAuthenticated && (
            <>
              <NavLink to="/dashboard" icon="chart" label="Dashboard" active={pathname === '/dashboard'} />
              <NavLink to="/chat" icon="chat" label="AI Coach" active={pathname === '/chat'} />
            </>
          )}
          <NavLink to="/simulator" icon="bolt" label="Simulator" sim active={pathname === '/simulator'} />
          {hasSimProfile && <NavLink to="/simulator/results" icon="trending" label="Results" sim active={pathname === '/simulator/results'} />}

          {!isLoading && (
            isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
                {user?.picture
                  ? <img src={user.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--emerald-light)' }} />
                  : <div aria-hidden="true" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--emerald-light)', color: 'var(--emerald-dark)', display: 'grid', placeItems: 'center', fontSize: '0.82rem', fontWeight: 700 }}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
                }
                <span className="nav-user-name" style={{ fontSize: '0.85rem', color: 'var(--slate)', fontWeight: 500, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.given_name || user?.name?.split(' ')[0] || 'User'}
                </span>
                {!isGuest && (
                  <button className="btn btn-quiet btn-sm" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Sign out</button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => loginWithRedirect()}>Sign in</button>
                <button className="btn btn-primary btn-sm" onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>Get started</button>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  )
}
