# Blockchain Visualizer

A web app that visualizes how blockchain works. See blocks link via hashes, mine new blocks (proof-of-work), and watch validation update in real time. Tamper with data to see the chain turn invalid.

## What it does

- **Block chain view** – Each block is shown as a card with:
  - Block number, timestamp, data, previous hash (first 10 chars + …), nonce, hash (first 10 chars + …)
  - Visual link indicator: “Link OK” when previous hash matches the prior block’s hash
- **Mining** – Enter block data, click **Mine**, see “Mining…” and a spinner, then the new block and mining time (e.g. “Mined in 45ms”).
- **Validation** – A clear **Chain Valid** (green) or **Chain Invalid** (red) banner that updates when blocks are added or edited.
- **Difficulty** – Choose 1–4 (number of leading zeros required in the hash).
- **Tampering** – **Edit** on a block changes its data without re-mining; the chain becomes invalid and the tampered block gets a red border.
- **Auto-mine** – **Auto-mine 5 blocks** adds five blocks in sequence with progress.
- **Transaction ledger** – Switch to a simple list of all block data in order.

## Tech

- **SHA-256**: `crypto-js` in the browser.
- **Block**: `calculateHash()`, `mineBlock(difficulty)`, `tryNextNonce(difficulty)` for incremental mining.
- **Blockchain**: `isChainValid()` for validation; no backend.

## How to run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/` – Next.js app router: `page.tsx` (main UI), `layout.tsx`, `globals.css`
- `lib/blockchain/` – Core logic and types:
  - `types.ts` – `BlockData`, `DifficultyLevel`
  - `Block.ts` – Block class (hash, mining)
  - `Blockchain.ts` – Chain and validation
  - `validation.ts` – `isChainValid(chain)`
  - `index.ts` – Re-exports

## Screenshot

Run the app and use **Mine**, **Edit**, and the difficulty selector to see the chain and validation change. (Add a screenshot or GIF here from your own run if you like.)

## Optional: live demo

You can deploy to [Vercel](https://vercel.com), [Netlify](https://netlify.com), or GitHub Pages and add the URL here.
