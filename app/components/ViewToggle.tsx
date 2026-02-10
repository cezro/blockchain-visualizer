"use client";

export function ViewToggle({
  view,
  setView,
  showFullHashes,
  setShowFullHashes,
}: {
  view: "chain" | "ledger" | "3d";
  setView: (v: "chain" | "ledger" | "3d") => void;
  showFullHashes: boolean;
  setShowFullHashes: (v: boolean) => void;
}) {
  return (
    <section className="hud-section mb-4 flex flex-wrap items-center gap-4 px-5 py-3">
      <div className="flex gap-1">
        <button
          onClick={() => setView("chain")}
          className={`hud-btn px-3 py-1.5 text-xs ${view === "chain" ? "hud-btn-active" : ""}`}
        >
          Block chain
        </button>
        <button
          onClick={() => setView("ledger")}
          className={`hud-btn px-3 py-1.5 text-xs ${view === "ledger" ? "hud-btn-active" : ""}`}
        >
          Transaction ledger
        </button>
        <button
          onClick={() => setView("3d")}
          className={`hud-btn px-3 py-1.5 text-xs ${view === "3d" ? "hud-btn-active" : ""}`}
        >
          3D view
        </button>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">
        <input
          type="checkbox"
          checked={showFullHashes}
          onChange={(e) => setShowFullHashes(e.target.checked)}
          className="border-[var(--hud-border)] bg-[var(--hud-frame)] text-[var(--hud-accent)] focus:ring-[var(--hud-accent)]"
        />
        Show full hashes
      </label>
    </section>
  );
}

