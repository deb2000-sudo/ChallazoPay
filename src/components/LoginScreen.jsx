import { useState } from 'react'
import { verifyCredentials } from '../lib/session'

export default function LoginScreen({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim() || !password) {
      setError('Enter both an email and a password.')
      return
    }

    if (!verifyCredentials(email, password)) {
      setError('Those credentials are not recognised.')
      return
    }

    setError('')
    onSignIn(email)
  }

  return (
    <div className="login-shell">
      <form className="panel login-card" onSubmit={handleSubmit}>
        <div className="panel-header">
          <p className="eyebrow">Hackathon Prize Escrow</p>
          <h1>HackPayment Admin</h1>
          <p>Sign in to configure teams, deploy the escrow contract, and release prizes.</p>
        </div>

        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
            placeholder="admin@nxtwave.co.in"
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
            placeholder="••••••"
          />
        </label>

        {error && <p className="warning login-error">{error}</p>}

        <button className="btn primary login-submit" type="submit">
          Sign in
        </button>

        <p className="login-note">
          Demo gate only — these credentials live in the browser bundle and protect nothing.
        </p>
      </form>
    </div>
  )
}
