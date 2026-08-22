import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import AdminConsole from './components/AdminConsole'
import { clearSession, loadSession, saveSession } from './lib/session'

// Exported separately so tests can mount it inside a MemoryRouter.
export function AppRoutes() {
  const [session, setSession] = useState(loadSession)

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/" replace />
          ) : (
            <LoginScreen onSignIn={(email) => setSession(saveSession(email))} />
          )
        }
      />

      <Route
        path="/"
        element={
          session ? (
            <AdminConsole
              adminEmail={session.email}
              onSignOut={() => {
                clearSession()
                setSession(null)
              }}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
