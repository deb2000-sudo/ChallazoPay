# ChallazoPay

Blockchain prize payouts for edtech hackathons. Organizers add winners, fund the pool, and a smart contract sends each team their share automatically.

## Problem statement

Edtechs such as Scaler and NxtWave run 3–4 hackathons every month. Each event has prize money for winners, runners-up, and second runners-up, usually split across several teammates. Tracking wallets, ratios, and transfers by hand does not scale.

ChallazoPay makes that payout flow on-chain. Once the organizer records the winning teams and deploys the contract, funding and distribution are handled by the contract instead of ad-hoc transfers.

## How it works

1. Sign in to the admin console and connect a wallet on **Monad Testnet**.
2. Enter the three placing teams (winner, runners-up, second runners-up), member names, wallet addresses, and split ratios (default 50 / 30 / 20).
3. Deploy the `Hackpayment` contract with those teams locked in.
4. Fund the prize pool with MON.
5. Call distribute. The contract pays each member their share in one on-chain action.

The contract is single-use: after prizes are distributed, that instance is spent.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React + Vite |
| Smart contracts | Solidity (`Hackpayment`) |
| Testing | JavaScript |
| Chain | Monad Testnet |
| Deployment | Vercel |

## ABI and local contract artifact

The `Hackpayment` contract was compiled and deployed locally first. After that local deploy, the Hardhat artifact was copied into this repo as:

```
src/abi/Hackpayment.json
```

That file is the ABI plus bytecode (`_format`: `hh-sol-artifact-1`). The React app reads it to:

- deploy a new `Hackpayment` instance from the browser
- fund the prize pool
- call `distributePrizes`
- read organizer, balances, team members, and ratios

Anyone cloning the repo can open `src/abi/Hackpayment.json` to see the ABI the frontend uses. No separate contract project is required at runtime — the artifact already contains everything needed to deploy on Monad Testnet through MetaMask.

## Contract tests (run before deploy)

The Solidity contract was tested locally with 4 JavaScript cases before it was used on Monad Testnet:

| # | Case | Expected result |
| --- | --- | --- |
| 1 | Deploy with a valid organizer, 3 teams × 3 member addresses, and split ratios `50 / 30 / 20` | Deploy succeeds; `organizer`, members, and ratios match the constructor args |
| 2 | Deploy with a zero organizer, a zero team address, or a `0` split ratio | Constructor reverts (`Invalid organizer address`, invalid team address, or `Split ratio cannot be zero`) |
| 3 | Call `distributePrizes` as a non-organizer, or while the prize pool is empty | Transaction reverts (`Only organizer can call this` / `Insufficient prize pool balance`) |
| 4 | Fund the contract, then call `distributePrizes` as the organizer | All 9 members are paid by ratio; a second distribute reverts (`Prizes already distributed`) |

Those checks cover the happy path and the main revert paths. After they passed, the same artifact was wired into this admin app.

## Try it locally with MetaMask

You can run the full flow on your machine and confirm every step in MetaMask.

1. Install [MetaMask](https://metamask.io/) and create or import a wallet.
2. Get Monad Testnet MON for gas and for the prize pool.
3. Start the app:

```bash
npm install
npm run dev
```

4. Open the local URL Vite prints (usually `http://localhost:5173`).
5. Sign in to the admin console.
6. Click **Connect wallet**. The app asks MetaMask to switch to **Monad Testnet** (`chainId` 10143, RPC `https://testnet-rpc.monad.xyz/`). If the network is missing, MetaMask will add it.
7. Fill the three teams, or generate test wallets in the console to dry-run without collecting nine real addresses.
8. In MetaMask, approve **Deploy**, then **Fund**, then **Distribute**. Each action is a transaction you can open in MetaMask and on [Monadscan Testnet](https://testnet.monadscan.com).

You should see the contract address after deploy, the pool balance after funding, and member payouts after distribute. The contract is single-use: once prizes are paid, that instance is spent.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Vite server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
