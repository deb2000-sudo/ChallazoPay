import { useState } from 'react'
import { verifyCredentials } from '../lib/session'
import { MONAD_TESTNET } from '../config/monad'

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
      <section className="login-hero">
        <p className="eyebrow">Hackathon Prize Escrow</p>

        <h1 className="hero-title">
          HackPayment
          <span className="hero-title-accent">Admin</span>
        </h1>

        <p className="hero-tagline">
          Make your payments in <strong>MON</strong> for the hackathon you organised.
        </p>

        <p className="hero-sub">
          Lock the prize pool in a smart contract, split it across your winning teams by ratio,
          and pay all nine members in a single on-chain transaction.
        </p>

        <ul className="hero-points">
          <li>
            <span className="hero-point-mark">1</span>
            Configure three teams and their prize split
          </li>
          <li>
            <span className="hero-point-mark">2</span>
            Deploy the escrow and fund it with MON
          </li>
          <li>
            <span className="hero-point-mark">3</span>
            Release every prize at once, exactly once
          </li>
        </ul>

        <p className="hero-chain">
          <span className="status-dot online" />
          Running on {MONAD_TESTNET.chainName} &middot; chain {MONAD_TESTNET.chainId}
        </p>
      </section>

      <form className="panel login-card" onSubmit={handleSubmit}>
        <div className="panel-header">
          <h2>Organiser sign in</h2>
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
