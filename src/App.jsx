import { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import AdminConsole from './components/AdminConsole'
import { clearSession, loadSession, saveSession } from './lib/session'

export default function App() {
  const [session, setSession] = useState(loadSession)

  if (!session) {
    return <LoginScreen onSignIn={(email) => setSession(saveSession(email))} />
  }

  return (
    <AdminConsole
      adminEmail={session.email}
      onSignOut={() => {
        clearSession()
        setSession(null)
      }}
    />
  )
}
