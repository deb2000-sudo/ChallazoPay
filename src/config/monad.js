const CHAIN_ID = 10143

export const MONAD_TESTNET = {
  chainId: CHAIN_ID,
  // Derived, never hand-written: the literal '0x27AF' used previously is 10159,
  // which made wallet_switchEthereumChain / wallet_addEthereumChain fail.
  chainIdHex: `0x${CHAIN_ID.toString(16).toUpperCase()}`,
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz/'],
  blockExplorerUrls: ['https://testnet.monadscan.com'],
}

export const TEAM_LABELS = ['Winner Team', 'Runners Up Team', '2nd Runners Up Team']

export const DEFAULT_RATIOS = [50, 30, 20]

export const MEMBERS_PER_TEAM = 3

export const DEFAULT_TEAMS = TEAM_LABELS.map((name, index) => ({
  name,
  ratio: DEFAULT_RATIOS[index],
  members: Array.from({ length: MEMBERS_PER_TEAM }, () => ({ name: '', address: '' })),
}))

export const STORAGE_KEYS = {
  teams: 'hackpayment_teams',
  contract: 'hackpayment_contract_address',
}

export function explorerAddressUrl(address) {
  return `${MONAD_TESTNET.blockExplorerUrls[0]}/address/${address}`
}

export function explorerTxUrl(hash) {
  return `${MONAD_TESTNET.blockExplorerUrls[0]}/tx/${hash}`
}
