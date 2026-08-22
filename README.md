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

## Local setup

```bash
npm install
npm run dev
```

The app expects MetaMask (or a compatible wallet) pointed at Monad Testnet (`chainId` 10143, RPC `https://testnet-rpc.monad.xyz/`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Vite server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
