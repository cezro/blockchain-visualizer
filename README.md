# Blockchain Visualizer

A web app that visualizes how blockchain works. See blocks link via hashes, mine new blocks (proof-of-work), and watch validation update in real time. Tamper with data to see the chain turn invalid. Includes a 3D view and an FUI/tactical HUD-style UI.

## What it does

- **Block chain view** – Cards for each block with index, timestamp, data, previous hash, nonce, and hash. Optional **Show full hashes**; otherwise first 10 chars + …. Visual link status: “✓ Link OK”, “✗ Content invalid”, or “✗ Link broken”.
- **Sort, filter, search** – Sort by index, timestamp, or nonce; filter by all / valid / invalid; search block data. View as list, grid, or compact.
- **Mining** – Enter block data, click **Mine** (or **Auto-mine 5 blocks**). Difficulty 1–10 (leading zeros); mining runs in batches with a spinner and reports time (e.g. “Mined in 45ms”).
- **Validation** – **Chain Valid** (green) or **Chain Invalid** (red) banner that updates when the chain or any block is edited.
- **Tampering** – Edit any block (data, timestamp, previous hash, nonce, hash) from the card view or from the 3D view. Tampered blocks get a red border; hash mismatch details show stored vs recalculated hash.
- **3D view** – Blocks as 3D boxes with hash links (green = valid, red dashed = mismatch). Click a block for details; **Edit** opens a modal to change all fields. Fullscreen toggle; **Show full hashes** applies to 3D tooltips and block popover.
- **Transaction ledger** – Simple list of block data in order.

## Tech

- **SHA-256**: `crypto-js` in the browser.
- **Block**: `calculateHash()`, `mineBlock(difficulty)`, `tryNextNonce(difficulty)` for incremental mining.
- **Blockchain**: `isChainValid()` for validation; no backend.
- **3D**: Three.js via `@react-three/fiber` and `@react-three/drei` for the 3D blockchain scene.

## How to run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/` – Next.js App Router: `page.tsx` (main UI), `layout.tsx`, `globals.css`, `BlockChain3D.tsx` (3D scene)
- `lib/blockchain/` – Core logic and types:
  - `types.ts` – `BlockData`, `DifficultyLevel`
  - `Block.ts` – Block class (hash, mining)
  - `Blockchain.ts` – Chain helpers
  - `config.ts` – Difficulty and mining config
  - `validation.ts` – `isChainValid(chain)`
  - `index.ts` – Re-exports

## Screenshot

Run the app and try **Mine**, **Edit** (cards or 3D modal), difficulty, and the **3D view** to see the chain and validation update. Add a screenshot or GIF from your own run if you like.

## Live demo

[Visualizer](https://blockchain-visualizer-five.vercel.app)
