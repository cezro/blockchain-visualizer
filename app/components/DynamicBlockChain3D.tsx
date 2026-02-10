"use client";

import dynamic from "next/dynamic";

export const DynamicBlockChain3D = dynamic(
  () => import("@/app/BlockChain3D").then((m) => ({ default: m.BlockChain3D })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] w-full items-center justify-center border border-[var(--hud-border)] bg-[var(--hud-bg)] text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">
        Loading 3D view…
      </div>
    ),
  }
);

