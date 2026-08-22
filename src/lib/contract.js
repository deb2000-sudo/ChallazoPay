import {
  Contract,
  ContractFactory,
  JsonRpcProvider,
  isAddress,
  parseEther,
  formatEther,
  ZeroAddress,
} from 'ethers'
import HackpaymentArtifact from '../abi/Hackpayment.json'
import { MEMBERS_PER_TEAM, MONAD_TESTNET, TEAM_LABELS } from '../config/monad'

export { formatEther, parseEther }

const TEAM_COUNT = TEAM_LABELS.length

// A freshly mined block does not reach every node of a load-balanced public RPC
// at once. Reading right after waitForDeployment() can therefore hit a node that
// has not seen the contract yet and answer eth_call with empty data, which ethers
// surfaces as "missing revert data". Retrying briefly rides that out.
const READ_RETRY_DELAYS_MS = [400, 800, 1600, 2400]

function isPropagationLag(error) {
  if (error?.code === 'CALL_EXCEPTION' || error?.code === 'BAD_DATA') return true
  return /missing revert data|could not decode|no contract deployed/i.test(error?.message ?? '')
}

async function withReadRetry(read) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await read()
    } catch (error) {
      if (attempt >= READ_RETRY_DELAYS_MS.length || !isPropagationLag(error)) throw error
      await new Promise((resolve) => setTimeout(resolve, READ_RETRY_DELAYS_MS[attempt]))
    }
  }
}

let cachedReadProvider = null

/**
 * Read-only provider talking straight to the Monad RPC.
 *
 * Status reads deliberately do NOT go through MetaMask: the injected provider is
 * null until the user connects, is replaced on every account/chain change, and
 * fans 15 view calls out as 15 separate EIP-1193 requests. Reading over plain
 * HTTP makes the status panel work before connecting and survives wallet churn.
 */
export function getReadProvider() {
  if (!cachedReadProvider) {
    cachedReadProvider = new JsonRpcProvider(MONAD_TESTNET.rpcUrls[0], MONAD_TESTNET.chainId, {
      staticNetwork: true,
    })
  }
  return cachedReadProvider
}

export function getHackpaymentContract(address, runner) {
  return new Contract(address, HackpaymentArtifact.abi, runner)
}

export async function deployHackpayment(signer, organizer, teams) {
  const [winnerTeam, runnersUpTeam, secondRunnersUpTeam] = teams.map((team) =>
    team.members.map((member) => member.address.trim()),
  )
  const teamSplitRatios = teams.map((team) => Number(team.ratio))

  const factory = new ContractFactory(
    HackpaymentArtifact.abi,
    HackpaymentArtifact.bytecode,
    signer,
  )

  const contract = await factory.deploy(
    organizer,
    winnerTeam,
    runnersUpTeam,
    secondRunnersUpTeam,
    teamSplitRatios,
  )

  await contract.waitForDeployment()
  return contract
}

export async function fundPrizePool(signer, contractAddress, amountMon) {
  const value = parseMonAmount(amountMon)

  const tx = await signer.sendTransaction({ to: contractAddress, value })
  await tx.wait()
  return tx.hash
}

export async function distributePrizes(signer, contractAddress) {
  const contract = getHackpaymentContract(contractAddress, signer)
  const tx = await contract.distributePrizes()
  await tx.wait()
  return tx.hash
}

export async function readContractState(contractAddress, provider = getReadProvider()) {
  if (!isAddress(contractAddress)) {
    throw new Error('Enter a valid contract address.')
  }

  return withReadRetry(() => readContractStateOnce(contractAddress, provider))
}

async function readContractStateOnce(contractAddress, provider) {
  // A call to an address with no code always succeeds on the EVM and returns
  // empty data, so check for code before trusting any read.
  const code = await provider.getCode(contractAddress)
  if (code === '0x') {
    throw new Error('No contract deployed at that address on Monad Testnet.')
  }

  const contract = getHackpaymentContract(contractAddress, provider)

  const memberCalls = []
  for (let teamIndex = 0; teamIndex < TEAM_COUNT; teamIndex += 1) {
    for (let memberIndex = 0; memberIndex < MEMBERS_PER_TEAM; memberIndex += 1) {
      memberCalls.push(contract.getTeamMember(teamIndex, memberIndex))
    }
  }

  const [organizer, balance, prizesDistributed, ratio0, ratio1, ratio2, ...flatMembers] =
    await Promise.all([
      contract.organizer(),
      contract.getBalance(),
      contract.prizesDistributed(),
      contract.teamSplitRatios(0),
      contract.teamSplitRatios(1),
      contract.teamSplitRatios(2),
      ...memberCalls,
    ])

  const teamMembers = Array.from({ length: TEAM_COUNT }, (_unused, teamIndex) =>
    flatMembers.slice(teamIndex * MEMBERS_PER_TEAM, (teamIndex + 1) * MEMBERS_PER_TEAM),
  )

  return {
    organizer,
    balance,
    prizesDistributed,
    teamSplitRatios: [Number(ratio0), Number(ratio1), Number(ratio2)],
    teamMembers,
  }
}

export function parseMonAmount(amountMon) {
  const trimmed = String(amountMon ?? '').trim()
  if (!trimmed) {
    throw new Error('Enter an amount of MON to fund.')
  }

  let value
  try {
    value = parseEther(trimmed)
  } catch {
    throw new Error(`"${trimmed}" is not a valid MON amount.`)
  }

  if (value <= 0n) {
    throw new Error('Funding amount must be greater than 0.')
  }
  return value
}

export function validateTeams(teams) {
  const errors = []

  if (teams.length !== TEAM_COUNT) {
    errors.push(`Exactly ${TEAM_COUNT} teams are required.`)
    return errors
  }

  const seenAddresses = new Map()

  teams.forEach((team, teamIndex) => {
    const teamLabel = team.name?.trim() || `Team ${teamIndex + 1}`

    if (!team.name?.trim()) {
      errors.push(`Team ${teamIndex + 1} needs a name.`)
    }

    const ratio = Number(team.ratio)
    if (!Number.isFinite(ratio) || ratio <= 0) {
      errors.push(`${teamLabel} needs a ratio greater than 0.`)
    }

    if (team.members.length !== MEMBERS_PER_TEAM) {
      errors.push(`${teamLabel} needs exactly ${MEMBERS_PER_TEAM} members.`)
      return
    }

    team.members.forEach((member, memberIndex) => {
      const memberLabel = `${teamLabel} member ${memberIndex + 1}`
      const address = member.address.trim()

      if (!member.name.trim()) {
        errors.push(`${memberLabel} needs a name.`)
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        errors.push(`${memberLabel} needs a valid wallet address.`)
        return
      }

      // The constructor reverts on a zero address, so catch it before paying gas.
      if (address.toLowerCase() === ZeroAddress.toLowerCase()) {
        errors.push(`${memberLabel} cannot be the zero address.`)
        return
      }

      const key = address.toLowerCase()
      const previous = seenAddresses.get(key)
      if (previous) {
        errors.push(`${memberLabel} reuses the address already assigned to ${previous}.`)
      } else {
        seenAddresses.set(key, memberLabel)
      }
    })
  })

  return errors
}

export function estimateMemberPayouts(totalMon, teams) {
  const total = Number(totalMon)
  if (!Number.isFinite(total) || total <= 0) return []

  const ratios = teams.map((team) => Number(team.ratio))
  if (ratios.some((ratio) => !Number.isFinite(ratio) || ratio <= 0)) return []

  const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0)

  return teams.map((team, index) => {
    const teamShare = (total * ratios[index]) / ratioSum
    return {
      teamName: team.name?.trim() || `Team ${index + 1}`,
      teamShare,
      memberShare: teamShare / team.members.length,
    }
  })
}
