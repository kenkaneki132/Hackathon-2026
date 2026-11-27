import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './auth'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Navbar from './components/Navbar'
import PortfolioBadge from './components/PortfolioBadge'
import SimulatorOnboarding from './pages/SimulatorOnboarding'
import SimulatorDashboard from './pages/SimulatorDashboard'

function ProtectedRoute({ element }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) { loginWithRedirect(); return <LoadingScreen /> }
  return element
}

function LoadingScreen() {
  return (
    <div role="status" style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 64px)',flexDirection:'column',gap:16 }}>
      <div style={{ width:44,height:44,border:'3px solid var(--emerald-light)',borderTopColor:'var(--emerald)',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'var(--muted)',fontSize:'0.9rem' }}>Loading…</p>
    </div>
  )
}

export default function App() {
  const [profile, setProfile]       = useState(null)
  const [results, setResults]       = useState(null)
  const [simProfile, setSimProfile] = useState(null)
  const [simResults, setSimResults] = useState(null)
  const { pathname } = useLocation()
  // The landing page has its own footer; the chat page fills the screen, so neither gets this one.
  const showFooter = pathname !== '/' && pathname !== '/chat'

  return (
    <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column' }}>
      <Navbar hasProfile={!!profile} hasSimProfile={!!simProfile} />
      <main style={{ flex:1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding setProfile={setProfile} setResults={setResults} />} />
          <Route path="/dashboard" element={results ? <ProtectedRoute element={<Dashboard profile={profile} results={results} />} /> : <Navigate to="/onboarding" replace />} />
          <Route path="/chat" element={<ProtectedRoute element={<Chat profile={profile} simProfile={simProfile} />} />} />
          <Route path="/simulator" element={<SimulatorOnboarding setSimProfile={setSimProfile} setSimResults={setSimResults} />} />
          <Route path="/simulator/results" element={simResults ? <SimulatorDashboard simProfile={simProfile} simResults={simResults} /> : <Navigate to="/simulator" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showFooter && <footer className="sm-badge-row" style={{ color: 'var(--slate)' }}><PortfolioBadge /></footer>}
    </div>
  )
}
