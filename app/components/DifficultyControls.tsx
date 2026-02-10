"use client";

import type { ChangeEvent } from "react";
import { MAX_DIFFICULTY } from "@/lib/blockchain/config";
import type { DifficultyLevel } from "@/lib/blockchain";

export function DifficultyControls({
  difficulty,
  onDifficultyButton,
  onDifficultyInput,
}: {
  difficulty: DifficultyLevel;
  onDifficultyButton: (d: number) => void;
  onDifficultyInput: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="hud-section mb-6 flex flex-wrap items-center gap-3 px-5 py-4">
      <span className="hud-readout text-xs text-[var(--hud-text-muted)]">Difficulty (leading zeros):</span>
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDifficultyButton(d)}
            className={`hud-btn px-4 py-2 text-sm ${difficulty === d ? "hud-btn-active" : ""}`}
          >
            {d}
          </button>
        ))}
      </div>
      <span className="text-[var(--hud-text-muted)]">|</span>
      <label className="flex items-center gap-2 text-[var(--hud-text-muted)]">
        <span className="text-xs uppercase">5–10:</span>
        <input
          type="number"
          min={5}
          max={MAX_DIFFICULTY}
          value={difficulty >= 5 ? difficulty : ""}
          onChange={onDifficultyInput}
          placeholder="5–10"
          className="hud-input w-16 px-3 py-2 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </label>
      <span className="text-xs text-[var(--hud-text-muted)]">(higher = slower)</span>
    </section>
  );
}

