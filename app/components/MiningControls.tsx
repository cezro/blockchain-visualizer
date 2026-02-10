"use client";

import type { KeyboardEvent } from "react";

export function MiningControls({
  blockDataInput,
  setBlockDataInput,
  isMining,
  startMining,
  miningTimeMs,
  formatTime,
  autoMine,
  autoMineProgress,
  autoMineMessages,
  resetChain,
}: {
  blockDataInput: string;
  setBlockDataInput: (v: string) => void;
  isMining: boolean;
  startMining: () => void;
  miningTimeMs: number | null;
  formatTime: (ms: number) => string;
  autoMine: () => void;
  autoMineProgress: number | null;
  autoMineMessages: string[];
  resetChain: () => void;
}) {
  return (
    <section className="hud-section mb-6 flex flex-wrap items-end gap-3 px-5 py-4">
      <label className="flex flex-1 min-w-[200px] flex-col gap-1">
        <span className="hud-readout text-xs text-[var(--hud-text-muted)]">Block data</span>
        <input
          type="text"
          value={blockDataInput}
          onChange={(e) => setBlockDataInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && startMining()}
          placeholder="e.g. Alice pays Bob 10"
          className="hud-input px-4 py-2.5 text-sm"
          disabled={isMining}
        />
      </label>
      <button
        onClick={startMining}
        disabled={isMining}
        className="hud-btn flex items-center gap-2 border-[var(--hud-accent)] bg-[var(--hud-panel-hover)] px-5 py-2.5 text-sm text-[var(--hud-accent-bright)] disabled:opacity-50"
      >
        {isMining ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--hud-accent)] border-t-transparent" />
            Mining...
          </>
        ) : (
          "Mine"
        )}
      </button>
      {miningTimeMs != null && !isMining && (
        <span className="text-xs text-[var(--hud-valid)]">Mined in {formatTime(miningTimeMs)}</span>
      )}
      <button
        onClick={autoMine}
        disabled={isMining || autoMineProgress != null}
        className="hud-btn px-4 py-2.5 text-sm disabled:opacity-50"
      >
        {autoMineProgress != null
          ? `Auto-mining ${autoMineProgress}/5...`
          : "Auto-mine 5 blocks"}
      </button>
      {autoMineMessages.length > 0 && (
        <div className="flex flex-col gap-0.5 rounded border border-[var(--hud-border)] bg-[var(--hud-frame)] px-3 py-2 text-xs">
          {autoMineMessages.map((msg, i) => (
            <span
              key={i}
              className={msg.startsWith("Done") ? "font-semibold text-[var(--hud-valid)]" : "text-[var(--hud-text-muted)]"}
            >
              {msg}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={resetChain}
        className="hud-btn px-4 py-2.5 text-sm text-[var(--hud-text-muted)]"
      >
        Reset chain
      </button>
    </section>
  );
}

