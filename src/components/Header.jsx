import { shortenAddress } from '../lib/wallet'
import { MONAD_TESTNET } from '../config/monad'

export default function Header({
  walletAddress,
  chainId,
  onConnect,
  connecting,
  hasWallet,
  adminEmail,
  onSignOut,
}) {
  const onMonad = chainId === MONAD_TESTNET.chainId

  return (
    <header className="header">
      <div>
        <p className="eyebrow">Hackathon Prize Escrow</p>
        <h1>HackPayment Admin</h1>
        <p className="subtitle">
          Configure teams, deploy the contract on Monad Testnet, fund the prize pool, and
          distribute rewards.
        </p>
      </div>

      <div className="header-actions">
        {adminEmail && (
          <div className="admin-chip">
            <div>
              <span>Signed in as</span>
              <strong>{adminEmail}</strong>
            </div>
            <button type="button" className="btn ghost" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        )}

        {walletAddress ? (
          <div className="wallet-chip">
            <span className={`status-dot ${onMonad ? 'online' : 'offline'}`} />
            <div>
              <strong>Wallet connected for your Organization</strong>
              <p>
                <span className="mono">{shortenAddress(walletAddress)}</span>
                {' · '}
                {onMonad ? MONAD_TESTNET.chainName : `Wrong network (${chainId ?? '?'})`}
              </p>
            </div>
          </div>
        ) : (
          <button
            className="btn primary"
            onClick={onConnect}
            disabled={connecting || !hasWallet}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </header>
  )
}
