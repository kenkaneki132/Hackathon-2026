import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { AuthProvider } from './auth.jsx'
import App from './App.jsx'
import './index.css'

// GitHub Pages can't rewrite deep links to index.html, so static demo builds use hash routing.
const Router = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </Router>
    </AuthProvider>
  </React.StrictMode>
)
