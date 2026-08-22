import { Wallet } from 'ethers'
import { MEMBERS_PER_TEAM, TEAM_LABELS } from '../config/monad'

export const TEST_WALLET_COUNT = TEAM_LABELS.length * MEMBERS_PER_TEAM

/**
 * Generates throwaway EOAs in the browser via ethers' CSPRNG. Nothing leaves the
 * page — these exist so the admin can dry-run a full deploy/fund/distribute cycle
 * on testnet without hand-collecting nine real wallet addresses.
 */
export function generateTestWallets(count = TEST_WALLET_COUNT) {
  return Array.from({ length: count }, (_unused, index) => {
    const wallet = Wallet.createRandom()
    return {
      index: index + 1,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase ?? '',
    }
  })
}

/** Fills team member name + address from a flat wallet list, team 0 first. */
export function applyWalletsToTeams(teams, wallets) {
  let cursor = 0

  return teams.map((team) => ({
    ...team,
    members: team.members.map((member) => {
      const wallet = wallets[cursor]
      cursor += 1
      if (!wallet) return member

      return { ...member, name: `Test Member ${wallet.index}`, address: wallet.address }
    }),
  }))
}

/** True when any member field already holds a value worth protecting. */
export function teamsHaveMemberData(teams) {
  return teams.some((team) =>
    team.members.some((member) => member.name.trim() || member.address.trim()),
  )
}

export function walletsToJson(wallets) {
  return JSON.stringify(wallets, null, 2)
}

export function downloadWalletsJson(wallets, filename = 'hackpayment-test-wallets.json') {
  const blob = new Blob([walletsToJson(wallets)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}
