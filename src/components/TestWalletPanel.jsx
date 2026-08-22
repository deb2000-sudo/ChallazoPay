import { useState } from 'react'
import { downloadWalletsJson, walletsToJson } from '../lib/testWallets'

export default function TestWalletPanel({ wallets, onDismiss }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!wallets || wallets.length === 0) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(walletsToJson(wallets))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Generated Test Wallets</h2>
        <p>
          {wallets.length} throwaway wallets created in your browser and written into the team
          fields above. Save the keys now — they are not stored anywhere and vanish on reload.
        </p>
      </div>

      <p className="warning">
        Testnet only. Never send real funds to these addresses or reuse these keys anywhere that
        holds value.
      </p>

      <div className="action-row wallet-actions">
        <button className="btn primary" onClick={() => downloadWalletsJson(wallets)}>
          Download JSON
        </button>
        <button className="btn secondary" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
        <button className="btn secondary" onClick={() => setRevealed((current) => !current)}>
          {revealed ? 'Hide keys' : 'Reveal keys'}
        </button>
        <button className="btn secondary" onClick={onDismiss}>
          Dismiss
        </button>
      </div>

      <div className="wallet-table">
        {wallets.map((wallet) => (
          <div className="wallet-row" key={wallet.address}>
            <span className="wallet-index">#{wallet.index}</span>
            <div className="wallet-detail">
              <span>Address</span>
              <strong className="mono">{wallet.address}</strong>

              {revealed && (
                <>
                  <span>Private key</span>
                  <strong className="mono secret">{wallet.privateKey}</strong>
                  <span>Mnemonic</span>
                  <strong className="mono secret">{wallet.mnemonic}</strong>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
