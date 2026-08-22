import { explorerTxUrl } from '../config/monad'

const ICONS = {
  success: '✓',
  error: '!',
  info: '…',
}

export default function StatusBanner({ status, onDismiss }) {
  if (!status?.text) return null

  const kind = status.kind || 'info'

  return (
    <div className="status-dock">
      <div className={`status-banner ${kind}`} role="status" aria-live="polite">
        <span className="status-icon" aria-hidden="true">
          {ICONS[kind] ?? ICONS.info}
        </span>

        <span className="status-text">{status.text}</span>

        <span className="status-links">
          {status.txHash && (
            <a href={explorerTxUrl(status.txHash)} target="_blank" rel="noreferrer">
              View transaction
            </a>
          )}
          <button
            type="button"
            className="status-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </span>
      </div>
    </div>
  )
}
