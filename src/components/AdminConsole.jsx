import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider } from 'ethers'
import Header from './Header'
import TeamSetupForm from './TeamSetupForm'
import DeployPanel from './DeployPanel'
import TestWalletPanel from './TestWalletPanel'
import StatusBanner from './StatusBanner'
import { DEFAULT_TEAMS, MONAD_TESTNET, STORAGE_KEYS, explorerAddressUrl } from '../config/monad'
import { connectWallet, hasMetaMask, watchWallet } from '../lib/wallet'
import {
  deployHackpayment,
  distributePrizes,
  formatEther,
  fundPrizePool,
  getReadProvider,
  readContractState,
  validateTeams,
} from '../lib/contract'
import {
  TEST_WALLET_COUNT,
  applyWalletsToTeams,
  generateTestWallets,
  teamsHaveMemberData,
} from '../lib/testWallets'

function loadTeams() {
  const saved = localStorage.getItem(STORAGE_KEYS.teams)
  if (!saved) return DEFAULT_TEAMS

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) && parsed.length === DEFAULT_TEAMS.length ? parsed : DEFAULT_TEAMS
  } catch {
    return DEFAULT_TEAMS
  }
}

function describeError(error) {
  return error?.shortMessage || error?.reason || error?.message || 'Something went wrong.'
}

export default function AdminConsole({ adminEmail, onSignOut }) {
  const [teams, setTeams] = useState(loadTeams)
  const [walletAddress, setWalletAddress] = useState('')
  const [chainId, setChainId] = useState(null)
  const [signer, setSigner] = useState(null)
  const [walletProvider, setWalletProvider] = useState(null)
  const [contractAddress, setContractAddress] = useState(
    () => localStorage.getItem(STORAGE_KEYS.contract) || '',
  )
  const [fundAmount, setFundAmount] = useState('10')
  const [contractState, setContractState] = useState(null)
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [testWallets, setTestWallets] = useState([])

  const hasWallet = hasMetaMask()
  const onMonad = chainId === MONAD_TESTNET.chainId

  const fetchContractState = useCallback(
    async (address) => {
      const state = await readContractState(address, [walletProvider, getReadProvider()])
      return { ...state, balanceFormatted: formatEther(state.balance) }
    },
    [walletProvider],
  )

  /** Returns an error string on failure, or null on success. Never sets status
   *  itself, so callers can decide how a read failure combines with their own
   *  outcome instead of having it silently overwritten. */
  const refreshContractState = useCallback(
    async (address) => {
      const target = address?.trim()
      if (!target) return 'No contract address to read.'

      try {
        setContractState(await fetchContractState(target))
        return null
      } catch (error) {
        setContractState(null)
        return describeError(error)
      }
    },
    [fetchContractState],
  )

  // Restore a previously authorized session so a page refresh does not lose the
  // deployed contract's live status. Uses eth_accounts, which never prompts.
  useEffect(() => {
    if (!hasWallet) return

    let cancelled = false

    const restore = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (cancelled || accounts.length === 0) return

        const restoredProvider = new BrowserProvider(window.ethereum)
        const network = await restoredProvider.getNetwork()
        if (cancelled) return

        setWalletProvider(restoredProvider)
        setWalletAddress(accounts[0])
        setChainId(Number(network.chainId))

        if (Number(network.chainId) === MONAD_TESTNET.chainId) {
          setSigner(await restoredProvider.getSigner())
        }
      } catch {
        // Not authorized yet; the Connect button handles it.
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [hasWallet])

  // Keep signer/account in sync when the user switches wallet or network in MetaMask.
  useEffect(
    () =>
      watchWallet({
        onAccountsChanged: (account) => {
          setWalletAddress(account)
          setContractState(null)
          if (!account) {
            setSigner(null)
            setWalletProvider(null)
            setStatus({ kind: 'info', text: 'Wallet disconnected.' })
            return
          }
          const nextProvider = new BrowserProvider(window.ethereum)
          setWalletProvider(nextProvider)
          nextProvider
            .getSigner()
            .then(setSigner)
            .catch(() => setSigner(null))
          setStatus({ kind: 'info', text: `Switched to ${account}.` })
        },
        onChainChanged: (nextChainId) => {
          setChainId(nextChainId)
          const nextProvider = new BrowserProvider(window.ethereum)
          setWalletProvider(nextProvider)
          nextProvider
            .getSigner()
            .then(setSigner)
            .catch(() => setSigner(null))
          if (nextChainId !== MONAD_TESTNET.chainId) {
            setStatus({
              kind: 'error',
              text: `Wrong network (chain ${nextChainId}). Switch back to ${MONAD_TESTNET.chainName}.`,
            })
          } else {
            setStatus({ kind: 'success', text: `Back on ${MONAD_TESTNET.chainName}.` })
          }
        },
      }),
    [],
  )

  // Reloads on-chain status whenever the target contract, provider, or network
  // changes. The cancel flag stops a slow earlier read from clobbering a newer one.
  useEffect(() => {
    const address = contractAddress.trim()
    let cancelled = false

    const load = async () => {
      if (!address) {
        if (!cancelled) setContractState(null)
        return
      }

      try {
        const next = await fetchContractState(address)
        if (!cancelled) setContractState(next)
      } catch (error) {
        if (cancelled) return
        setContractState(null)
        setStatus({ kind: 'error', text: describeError(error) })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [contractAddress, fetchContractState])

  async function handleConnect() {
    try {
      setConnecting(true)
      setStatus(null)
      const connection = await connectWallet()
      setWalletProvider(connection.provider)
      setSigner(connection.signer)
      setWalletAddress(connection.address)
      setChainId(connection.chainId)
      setStatus({ kind: 'success', text: `Wallet connected on ${MONAD_TESTNET.chainName}.` })
    } catch (error) {
      setStatus({ kind: 'error', text: describeError(error) })
    } finally {
      setConnecting(false)
    }
  }

  function handleTeamChange(teamIndex, field, value) {
    setTeams((current) =>
      current.map((team, index) => (index === teamIndex ? { ...team, [field]: value } : team)),
    )
  }

  function handleMemberChange(teamIndex, memberIndex, field, value) {
    setTeams((current) =>
      current.map((team, index) => {
        if (index !== teamIndex) return team
        return {
          ...team,
          members: team.members.map((member, idx) =>
            idx === memberIndex ? { ...member, [field]: value } : member,
          ),
        }
      }),
    )
  }

  function handleGenerateWallets() {
    if (
      teamsHaveMemberData(teams) &&
      !window.confirm(
        `Replace all member names and addresses with ${TEST_WALLET_COUNT} freshly generated test wallets?`,
      )
    ) {
      return
    }

    try {
      const wallets = generateTestWallets()
      setTeams((current) => applyWalletsToTeams(current, wallets))
      setTestWallets(wallets)
      setStatus({
        kind: 'success',
        text: `Generated ${wallets.length} test wallets. Save the keys before reloading.`,
      })
    } catch (error) {
      setStatus({ kind: 'error', text: describeError(error) })
    }
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams))
    if (contractAddress) {
      localStorage.setItem(STORAGE_KEYS.contract, contractAddress.trim())
    }
    setStatus({ kind: 'success', text: 'Team setup saved locally.' })
  }

  function requireReadyWallet() {
    if (!signer || !walletAddress) {
      setStatus({ kind: 'error', text: 'Connect MetaMask before continuing.' })
      return false
    }
    if (!onMonad) {
      setStatus({
        kind: 'error',
        text: `Switch MetaMask to ${MONAD_TESTNET.chainName} (chain ${MONAD_TESTNET.chainId}) first.`,
      })
      return false
    }
    return true
  }

  async function handleDeploy() {
    if (!requireReadyWallet()) return

    const errors = validateTeams(teams)
    if (errors.length > 0) {
      setStatus({ kind: 'error', text: errors.join(' ') })
      return
    }

    try {
      setBusy(true)
      setStatus({ kind: 'info', text: 'Deploying Hackpayment contract...' })
      const contract = await deployHackpayment(signer, walletAddress, teams)
      const address = await contract.getAddress()

      setContractAddress(address)
      localStorage.setItem(STORAGE_KEYS.contract, address)
      localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams))

      const readError = await refreshContractState(address)
      setStatus({
        kind: readError ? 'error' : 'success',
        text: readError
          ? `Deployed at ${address}, but reading its status failed: ${readError}`
          : `Deployed at ${address}`,
        txHash: contract.deploymentTransaction()?.hash,
      })
    } catch (error) {
      setStatus({ kind: 'error', text: describeError(error) })
    } finally {
      setBusy(false)
    }
  }

  async function handleFund() {
    if (!requireReadyWallet() || !contractAddress) return

    try {
      setBusy(true)
      setStatus({ kind: 'info', text: 'Funding prize pool...' })
      const hash = await fundPrizePool(signer, contractAddress.trim(), fundAmount)
      const readError = await refreshContractState(contractAddress)
      setStatus({
        kind: readError ? 'error' : 'success',
        text: readError
          ? `Prize pool funded, but reading contract status failed: ${readError}`
          : 'Prize pool funded.',
        txHash: hash,
      })
    } catch (error) {
      setStatus({ kind: 'error', text: describeError(error) })
    } finally {
      setBusy(false)
    }
  }

  async function handleDistribute() {
    if (!requireReadyWallet() || !contractAddress) return

    const confirmed = window.confirm(
      'Distribute prizes now? This pays all 9 members and can only be done once.',
    )
    if (!confirmed) return

    try {
      setBusy(true)
      setStatus({ kind: 'info', text: 'Distributing prizes...' })
      const hash = await distributePrizes(signer, contractAddress.trim())
      const readError = await refreshContractState(contractAddress)
      setStatus({
        kind: readError ? 'error' : 'success',
        text: readError
          ? `Prizes distributed, but reading contract status failed: ${readError}`
          : 'Prizes distributed.',
        txHash: hash,
      })
    } catch (error) {
      setStatus({ kind: 'error', text: describeError(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <StatusBanner status={status} onDismiss={() => setStatus(null)} />

      <Header
        walletAddress={walletAddress}
        chainId={chainId}
        onConnect={handleConnect}
        connecting={connecting}
        hasWallet={hasWallet}
        adminEmail={adminEmail}
        onSignOut={onSignOut}
      />

      {!hasWallet && (
        <p className="warning">
          MetaMask (or another injected Ethereum wallet) is required to use this app.
        </p>
      )}

      {walletAddress && !onMonad && (
        <p className="warning">
          MetaMask is on chain {chainId ?? '?'}. Switch to {MONAD_TESTNET.chainName} (chain{' '}
          {MONAD_TESTNET.chainId}) before deploying, funding, or distributing.
        </p>
      )}

      <TeamSetupForm
        teams={teams}
        onTeamChange={handleTeamChange}
        onMemberChange={handleMemberChange}
        onGenerateWallets={handleGenerateWallets}
        disabled={busy}
      />

      <TestWalletPanel wallets={testWallets} onDismiss={() => setTestWallets([])} />

      <DeployPanel
        walletAddress={walletAddress}
        onMonad={onMonad}
        contractAddress={contractAddress}
        setContractAddress={setContractAddress}
        fundAmount={fundAmount}
        setFundAmount={setFundAmount}
        onDeploy={handleDeploy}
        onFund={handleFund}
        onDistribute={handleDistribute}
        onRefresh={async () => {
          const readError = await refreshContractState(contractAddress)
          setStatus(
            readError
              ? { kind: 'error', text: readError }
              : { kind: 'success', text: 'Contract status refreshed.' },
          )
        }}
        onSaveDraft={saveDraft}
        teams={teams}
        contractState={contractState}
        busy={busy}
      />

      <footer className="footer">
        <span>
          {MONAD_TESTNET.chainName} &middot; chain {MONAD_TESTNET.chainId}
        </span>
        {contractAddress && (
          <a href={explorerAddressUrl(contractAddress.trim())} target="_blank" rel="noreferrer">
            {contractAddress.trim()}
          </a>
        )}
      </footer>
    </div>
  )
}
