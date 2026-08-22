import { estimateMemberPayouts } from '../lib/contract'
import { explorerAddressUrl } from '../config/monad'

export default function DeployPanel({
  walletAddress,
  onMonad,
  contractAddress,
  setContractAddress,
  fundAmount,
  setFundAmount,
  onDeploy,
  onFund,
  onDistribute,
  onRefresh,
  onSaveDraft,
  teams,
  contractState,
  busy,
}) {
  const estimates = estimateMemberPayouts(fundAmount, teams)

  const isOrganizer =
    Boolean(contractState) &&
    Boolean(walletAddress) &&
    contractState.organizer.toLowerCase() === walletAddress.toLowerCase()

  const hasPool = Boolean(contractState) && contractState.balance > 0n
  const alreadyDistributed = Boolean(contractState?.prizesDistributed)
  const ready = Boolean(walletAddress) && onMonad && !busy

  // Mirrors the contract's own preconditions so the reason is visible before signing.
  const distributeBlockedReason = !contractState
    ? 'Load a deployed contract to enable distribution.'
    : !isOrganizer
      ? 'Connected wallet is not the organizer. Switch to the organizer wallet to distribute.'
      : alreadyDistributed
        ? 'Prizes have already been distributed. This contract is spent.'
        : !hasPool
          ? 'Prize pool is empty. Fund the contract before distributing.'
          : ''

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <h2>2. Deploy or Load Contract</h2>
          <p>
            Deploy a new Hackpayment contract using the connected wallet as organizer, or paste an
            already deployed contract address.
          </p>
        </div>

        <div className="action-row">
          <input
            className="input mono grow"
            value={contractAddress}
            onChange={(event) => setContractAddress(event.target.value)}
            placeholder="0x deployed contract address"
          />
          <button className="btn secondary" onClick={onSaveDraft} disabled={busy}>
            Save Draft
          </button>
          <button className="btn primary" onClick={onDeploy} disabled={!ready}>
            {busy ? 'Working...' : 'Deploy Contract'}
          </button>
        </div>

        {contractAddress && (
          <p className="hint">
            <a href={explorerAddressUrl(contractAddress)} target="_blank" rel="noreferrer">
              View on MonadScan
            </a>
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>3. Fund Prize Pool</h2>
          <p>Send MON to the deployed contract address to fill the prize pool.</p>
        </div>

        <div className="action-row">
          <input
            className="input"
            type="number"
            min="0"
            step="0.0001"
            value={fundAmount}
            onChange={(event) => setFundAmount(event.target.value)}
            placeholder="Amount in MON"
          />
          <button
            className="btn primary"
            onClick={onFund}
            disabled={!ready || !contractAddress}
          >
            Fund Prize Pool
          </button>
        </div>

        {estimates.length > 0 && (
          <div className="estimate-grid">
            {estimates.map((estimate) => (
              <div className="estimate-card" key={estimate.teamName}>
                <strong>{estimate.teamName}</strong>
                <p>Team share: {estimate.teamShare.toFixed(4)} MON</p>
                <p>Each member: {estimate.memberShare.toFixed(4)} MON</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>4. Distribute Prizes</h2>
          <p>
            Only the organizer wallet can call <code>distributePrizes()</code>. This action is
            one-time and irreversible.
          </p>
        </div>

        <div className="action-row">
          <button
            className="btn danger"
            onClick={onDistribute}
            disabled={!ready || !contractAddress || Boolean(distributeBlockedReason)}
          >
            Distribute Prizes
          </button>
          <button
            className="btn secondary"
            onClick={onRefresh}
            disabled={!contractAddress || busy}
          >
            Refresh Status
          </button>
        </div>

        {distributeBlockedReason && <p className="warning">{distributeBlockedReason}</p>}
      </section>

      {contractState && (
        <section className="panel status-panel">
          <div className="panel-header">
            <h2>Contract Status</h2>
          </div>
          <div className="status-grid">
            <div>
              <span>Organizer</span>
              <strong className="mono">{contractState.organizer}</strong>
            </div>
            <div>
              <span>Prize Pool</span>
              <strong>{contractState.balanceFormatted} MON</strong>
            </div>
            <div>
              <span>Ratios</span>
              <strong>{contractState.teamSplitRatios.join(' / ')}</strong>
            </div>
            <div>
              <span>Distributed</span>
              <strong>{alreadyDistributed ? 'Yes' : 'No'}</strong>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
