import { BrowserProvider } from 'ethers'
import { MONAD_TESTNET } from '../config/monad'

export function hasMetaMask() {
  return typeof window !== 'undefined' && Boolean(window.ethereum)
}

export async function connectWallet() {
  if (!hasMetaMask()) {
    throw new Error('MetaMask is not installed.')
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' })
  await ensureMonadNetwork()

  // Build the provider only after the chain switch. ethers caches the network on
  // first use, so a provider created beforehand would keep reporting the old chain.
  const provider = new BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  const network = await provider.getNetwork()

  return { provider, signer, address, chainId: Number(network.chainId) }
}

export async function ensureMonadNetwork() {
  const { chainIdHex } = MONAD_TESTNET

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
  } catch (error) {
    // 4902 = chain not present in the wallet yet. Anything else is a real failure.
    if (error?.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainIdHex,
            chainName: MONAD_TESTNET.chainName,
            nativeCurrency: MONAD_TESTNET.nativeCurrency,
            rpcUrls: MONAD_TESTNET.rpcUrls,
            blockExplorerUrls: MONAD_TESTNET.blockExplorerUrls,
          },
        ],
      })
      return
    }
    throw error
  }
}

/**
 * Subscribes to wallet account/chain changes and returns an unsubscribe function.
 * Without this the app keeps signing with a stale account after the user switches.
 */
export function watchWallet({ onAccountsChanged, onChainChanged }) {
  if (!hasMetaMask()) return () => {}

  const handleAccounts = (accounts) => onAccountsChanged(accounts?.[0] ?? '')
  const handleChain = (chainIdHex) => onChainChanged(Number(chainIdHex))

  window.ethereum.on('accountsChanged', handleAccounts)
  window.ethereum.on('chainChanged', handleChain)

  return () => {
    window.ethereum.removeListener('accountsChanged', handleAccounts)
    window.ethereum.removeListener('chainChanged', handleChain)
  }
}

export function shortenAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
