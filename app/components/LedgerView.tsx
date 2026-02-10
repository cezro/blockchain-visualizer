"use client";

import type { BlockData } from "@/lib/blockchain";

export function LedgerView({ chain }: { chain: BlockData[] }) {
  return (
    <section className="hud-section p-5">
      <h2 className="hud-readout mb-4 border-b border-[var(--hud-border)] pb-2 text-xs tracking-widest text-[var(--hud-text-muted)]">
        Ledger
      </h2>
      <ul className="space-y-1.5 font-mono text-sm text-[var(--hud-text)]">
        {chain.map((b) => (
          <li key={b.index}>
            Block {b.index}: {b.data}
          </li>
        ))}
      </ul>
    </section>
  );
}

