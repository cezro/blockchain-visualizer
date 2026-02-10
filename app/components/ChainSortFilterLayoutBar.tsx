"use client";

export function ChainSortFilterLayoutBar({
  sortBy,
  setSortBy,
  filterBy,
  setFilterBy,
  filterQuery,
  setFilterQuery,
  chainLayout,
  setChainLayout,
}: {
  sortBy: "index" | "timestamp" | "nonce";
  setSortBy: (v: "index" | "timestamp" | "nonce") => void;
  filterBy: "all" | "valid" | "invalid";
  setFilterBy: (v: "all" | "valid" | "invalid") => void;
  filterQuery: string;
  setFilterQuery: (v: string) => void;
  chainLayout: "list" | "grid" | "compact";
  setChainLayout: (v: "list" | "grid" | "compact") => void;
}) {
  return (
    <section className="hud-panel mb-4 flex flex-wrap items-center gap-4 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="hud-readout text-xs text-[var(--hud-text-muted)]">Sort:</span>
        <div className="flex gap-1">
          {(["index", "timestamp", "nonce"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSortBy(s)}
              className={`hud-btn px-2.5 py-1 text-xs ${sortBy === s ? "hud-btn-active" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <span className="text-[var(--hud-border)]">|</span>
      <div className="flex items-center gap-2">
        <span className="hud-readout text-xs text-[var(--hud-text-muted)]">Filter:</span>
        <div className="flex gap-1">
          {(["all", "valid", "invalid"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterBy(f)}
              className={`hud-btn px-2.5 py-1 text-xs ${filterBy === f ? "hud-btn-active" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <input
        type="text"
        placeholder="Search block data..."
        value={filterQuery}
        onChange={(e) => setFilterQuery(e.target.value)}
        className="hud-input min-w-40 flex-1 px-2 py-1 text-xs"
      />
      <span className="text-[var(--hud-border)]">|</span>
      <div className="flex items-center gap-2">
        <span className="hud-readout text-xs text-[var(--hud-text-muted)]">View:</span>
        <div className="flex gap-1">
          {(["list", "grid", "compact"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setChainLayout(l)}
              className={`hud-btn px-2.5 py-1 text-xs ${chainLayout === l ? "hud-btn-active" : ""}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

