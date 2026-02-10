"use client";

import dynamic from "next/dynamic";
import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Block, isChainValid } from "@/lib/blockchain";
import type { BlockData, DifficultyLevel } from "@/lib/blockchain";
import { HASH_PREVIEW_LEN, MAX_DIFFICULTY, MINING_BATCH_SIZE } from "@/lib/blockchain/config";

const BlockChain3D = dynamic(() => import("@/app/BlockChain3D").then((m) => ({ default: m.BlockChain3D })), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center border border-[var(--hud-border)] bg-[var(--hud-bg)] text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">
      Loading 3D view…
    </div>
  ),
});

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function hashPreview(hash: string): string {
  return hash.length <= HASH_PREVIEW_LEN ? hash : `${hash.slice(0, HASH_PREVIEW_LEN)}...`;
}

/** Genesis uses fixed timestamp so server and client render the same (avoids hydration mismatch). */
function createInitialChain(difficulty: DifficultyLevel): BlockData[] {
  const genesis = new Block(0, 0, "Genesis Block", "0");
  genesis.mineBlock(difficulty);
  return [genesis.toBlockData()];
}

export default function Home() {
  const [chain, setChain] = useState<BlockData[]>(() => createInitialChain(2));
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(2);
  const [blockDataInput, setBlockDataInput] = useState("Alice pays Bob 10");
  const [isMining, setIsMining] = useState(false);
  const [miningTimeMs, setMiningTimeMs] = useState<number | null>(null);
  const [view, setView] = useState<"chain" | "ledger" | "3d">("chain");
  const [selected3DBlock, setSelected3DBlock] = useState<number | null>(null);
  const [is3DFullscreen, setIs3DFullscreen] = useState(false);
  const [showFullHashes, setShowFullHashes] = useState(false);
  const [sortBy, setSortBy] = useState<"index" | "timestamp" | "nonce">("index");
  const [filterBy, setFilterBy] = useState<"all" | "valid" | "invalid">("all");
  const [filterQuery, setFilterQuery] = useState("");
  const [chainLayout, setChainLayout] = useState<"list" | "grid" | "compact">("list");
  const [autoMineProgress, setAutoMineProgress] = useState<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const valid = isChainValid(chain);

  const filteredAndSortedChain = useMemo(() => {
    const validBlock = (b: BlockData) => Block.fromBlockData(b).calculateHash() === b.hash;
    let list = chain;
    if (filterBy === "valid") list = list.filter(validBlock);
    else if (filterBy === "invalid") list = list.filter((b) => !validBlock(b));
    const q = filterQuery.trim().toLowerCase();
    if (q) list = list.filter((b) => b.data.toLowerCase().includes(q));
    list = [...list].sort((a, b) => {
      if (sortBy === "index") return a.index - b.index;
      if (sortBy === "timestamp") return b.timestamp - a.timestamp;
      return a.nonce - b.nonce;
    });
    return list;
  }, [chain, filterBy, filterQuery, sortBy]);

  const getLatestHash = useCallback(() => {
    if (chain.length === 0) return "0";
    return chain[chain.length - 1].hash;
  }, [chain]);

  const startMining = useCallback(() => {
    const data = blockDataInput.trim() || "No data";
    const prevHash = getLatestHash();
    const block = new Block(chain.length, Date.now(), data, prevHash);
    const start = Date.now();
    setIsMining(true);
    setMiningTimeMs(null);

    const runBatch = () => {
      for (let i = 0; i < MINING_BATCH_SIZE; i++) {
        if (block.tryNextNonce(difficulty)) {
          rafIdRef.current = null;
          setChain((prev) => [...prev, block.toBlockData()]);
          setMiningTimeMs(Date.now() - start);
          setBlockDataInput("");
          setIsMining(false);
          return;
        }
      }
      rafIdRef.current = requestAnimationFrame(runBatch);
    };
    rafIdRef.current = requestAnimationFrame(runBatch);
  }, [chain.length, blockDataInput, difficulty, getLatestHash]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const handleEditBlock = useCallback((index: number, updates: Partial<Omit<BlockData, "index">>) => {
    setChain((prev) =>
      prev.map((b) =>
        b.index === index ? { ...b, ...updates } : b
      )
    );
  }, []);

  const handleDifficultyButton = useCallback((d: number) => {
    setDifficulty(d);
  }, []);

  const handleDifficultyInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setDifficulty(4);
      return;
    }
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) {
      const clamped = Math.min(MAX_DIFFICULTY, Math.max(5, n));
      setDifficulty(clamped);
    }
  }, []);

  const autoMine = useCallback(() => {
    const count = 5;
    let step = 0;
    const addNext = () => {
      if (step >= count) {
        setAutoMineProgress(null);
        return;
      }
      setChain((prev) => {
        const last = prev[prev.length - 1];
        const prevHash = last?.hash ?? "0";
        const block = new Block(
          prev.length,
          Date.now(),
          `Transaction ${prev.length}`,
          prevHash
        );
        block.mineBlock(difficulty);
        return [...prev, block.toBlockData()];
      });
      setAutoMineProgress(step + 1);
      step += 1;
      setTimeout(addNext, 0);
    };
    setAutoMineProgress(0);
    addNext();
  }, [difficulty]);

  const resetChain = useCallback(() => {
    setChain(createInitialChain(difficulty));
    setMiningTimeMs(null);
  }, [difficulty]);

  useEffect(() => {
    if (!is3DFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIs3DFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [is3DFullscreen]);

  return (
    <>
      {is3DFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--hud-bg)]">
          <div className="absolute right-4 top-4 z-10">
            <button
              type="button"
              onClick={() => setIs3DFullscreen(false)}
              title="Exit fullscreen"
              className="hud-btn p-2 text-[var(--hud-accent)] hover:bg-[var(--hud-panel-hover)]"
            >
              <Minimize2 className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="h-full w-full min-h-0">
            <BlockChain3D
              chain={chain}
              selectedIndex={selected3DBlock}
              onSelectBlock={setSelected3DBlock}
              fullscreen
            />
          </div>
        </div>
      )}
      <div className="min-h-screen bg-[var(--hud-bg)] text-[var(--hud-text)] font-(--font-geist-sans)">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="hud-section mb-6 px-5 py-4">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-[var(--hud-accent-bright)]">
            Blockchain Visualizer
          </h1>
          <p className="mt-1 text-sm text-[var(--hud-text-muted)] uppercase tracking-wider">
            Mine blocks · Validate chain · Tamper demo
          </p>
        </header>

        {/* Validation indicator - section has fixed className to avoid hydration mismatch */}
        <section className="hud-panel mb-6 px-6 py-5 text-center text-sm font-semibold uppercase tracking-wider">
          <span
            role="status"
            className={valid ? "text-[var(--hud-valid)]" : "text-[var(--hud-invalid)]"}
          >
            {valid ? "Chain Valid" : "Chain Invalid"}
          </span>
        </section>

        {/* Difficulty: 1–4 buttons + optional 5–10 input */}
        <section className="hud-section mb-6 flex flex-wrap items-center gap-3 px-5 py-4">
          <span className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Difficulty (leading zeros):</span>
          <div className="flex gap-1">
            {([1, 2, 3, 4] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDifficultyButton(d)}
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
              onChange={handleDifficultyInput}
              placeholder="5–10"
              className="hud-input w-16 px-3 py-2 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </label>
          <span className="text-xs text-[var(--hud-text-muted)]">(higher = slower)</span>
        </section>

        {/* Mining controls */}
        <section className="hud-section mb-6 flex flex-wrap items-end gap-3 px-5 py-4">
          <label className="flex flex-1 min-w-[200px] flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Block data</span>
            <input
              type="text"
              value={blockDataInput}
              onChange={(e) => setBlockDataInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startMining()}
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
          <button
            onClick={resetChain}
            className="hud-btn px-4 py-2.5 text-sm text-[var(--hud-text-muted)]"
          >
            Reset chain
          </button>
        </section>

        {/* View toggle: Chain vs Ledger + hash display */}
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

        {/* Sort, filter, and layout (chain view only) */}
        {view === "chain" && (
          <section className="hud-panel mb-4 flex flex-wrap items-center gap-4 px-4 py-3">
            <span className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Sort:</span>
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
            <span className="text-[var(--hud-border)]">|</span>
            <span className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Filter:</span>
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
            <input
              type="text"
              placeholder="Search block data..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="hud-input w-40 px-2 py-1 text-xs"
            />
            <span className="text-[var(--hud-border)]">|</span>
            <span className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">View:</span>
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
          </section>
        )}

        {view === "ledger" ? (
          <section className="hud-section p-5">
            <h2 className="mb-4 border-b border-[var(--hud-border)] pb-2 text-xs font-semibold uppercase tracking-widest text-[var(--hud-text-muted)]">
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
        ) : view === "3d" ? (
          <section className="hud-section overflow-hidden px-0 py-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--hud-border)] px-5 py-3">
              <p className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Drag to rotate · Scroll to zoom · Click block for details</p>
              <button
                type="button"
                onClick={() => setIs3DFullscreen(true)}
                title="Fullscreen"
                className="hud-btn p-1.5 text-[var(--hud-accent)]"
              >
                <Maximize2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {!is3DFullscreen && (
              <div className="p-2">
                <BlockChain3D
                  chain={chain}
                  selectedIndex={selected3DBlock}
                  onSelectBlock={setSelected3DBlock}
                />
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Block chain */}
            <div
              className={`hud-section p-5 ${
                chainLayout === "list"
                  ? "space-y-4"
                  : chainLayout === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-2"
              }`}
            >
              {filteredAndSortedChain.length === 0 ? (
              <p className="hud-panel py-8 text-center text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">
                No blocks match the current filter or search.
              </p>
            ) : (
              filteredAndSortedChain.map((block) => (
                <BlockCard
                  key={`${block.index}-${block.hash}`}
                  block={block}
                  previousHash={chain.find((b) => b.index === block.index - 1)?.hash ?? null}
                  onEdit={handleEditBlock}
                  showFullHashes={showFullHashes}
                  layout={chainLayout}
                />
              ))
            )}
            </div>

            {/* Mining placeholder */}
            {isMining && (
              <div className="hud-panel mt-6 flex items-center justify-center gap-3 border-dashed py-12">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--hud-accent)] border-t-transparent" />
                <span className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Mining block...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

function BlockCard({
  block,
  previousHash,
  onEdit,
  showFullHashes,
  layout = "list",
}: {
  block: BlockData;
  previousHash: string | null;
  onEdit: (index: number, updates: Partial<Omit<BlockData, "index">>) => void;
  showFullHashes: boolean;
  layout?: "list" | "grid" | "compact";
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(block.data);
  const [editTimestamp, setEditTimestamp] = useState(block.timestamp);
  const [editPreviousHash, setEditPreviousHash] = useState(block.previousHash);
  const [editNonce, setEditNonce] = useState(block.nonce);
  const [editHash, setEditHash] = useState(block.hash);
  const [hoveredHash, setHoveredHash] = useState<"prev" | "hash" | null>(null);
  const linkValid = previousHash === null || block.previousHash === previousHash;
  const hashMismatch = Block.fromBlockData(block).calculateHash() !== block.hash;

  const startEditing = () => {
    setEditData(block.data);
    setEditTimestamp(block.timestamp);
    setEditPreviousHash(block.previousHash);
    setEditNonce(block.nonce);
    setEditHash(block.hash);
    setEditing(true);
  };

  const saveEdit = () => {
    const ts = Number(editTimestamp);
    const nonceNum = Math.floor(Number(editNonce));
    if (!Number.isFinite(ts) || !Number.isFinite(nonceNum) || nonceNum < 0) return;
    onEdit(block.index, {
      data: editData.trim(),
      timestamp: ts,
      previousHash: editPreviousHash,
      nonce: nonceNum,
      hash: editHash,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData(block.data);
    setEditTimestamp(block.timestamp);
    setEditPreviousHash(block.previousHash);
    setEditNonce(block.nonce);
    setEditHash(block.hash);
  };

  const isCompact = layout === "compact";

  return (
    <div
      className={`hud-panel ${hashMismatch ? "hud-panel-invalid" : linkValid ? "hud-panel-valid" : ""} ${
        !linkValid && !hashMismatch ? "border-l-[var(--hud-warn)]" : ""
      } ${isCompact ? "p-3" : "p-5"}`}
    >
      <div className={`flex items-center justify-between ${isCompact ? "mb-1.5" : "mb-3"}`}>
        <span className={`font-semibold uppercase tracking-wider text-[var(--hud-accent-bright)] ${isCompact ? "text-sm" : "text-lg"}`}>
          Block {block.index}
        </span>
        {(previousHash !== null || hashMismatch) && (
          <span
            className={`flex items-center gap-1 text-xs uppercase ${
              hashMismatch ? "text-[var(--hud-invalid)]" : linkValid ? "text-[var(--hud-valid)]" : "text-[var(--hud-warn)]"
            }`}
          >
            {hashMismatch ? "✗ Content invalid" : linkValid ? "✓ Link OK" : "✗ Link broken"}
          </span>
        )}
      </div>
      {isCompact ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-[var(--hud-text-muted)]">Data:</span>
          <span className="text-[var(--hud-text)]">
            {editing ? (
              <span className="flex items-center gap-1">
                <input
                  type="text"
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="hud-input w-32 px-1.5 py-0.5"
                  autoFocus
                />
                <button onClick={saveEdit} className="text-[var(--hud-accent)] hover:underline">Save</button>
                <button onClick={cancelEdit} className="text-[var(--hud-text-muted)] hover:underline">Cancel</button>
              </span>
            ) : (
              <>
                {block.data}
                <button onClick={startEditing} className="ml-1 text-[var(--hud-text-muted)] hover:text-[var(--hud-accent)]">Edit</button>
              </>
            )}
          </span>
          <span className="text-[var(--hud-text-muted)]">Nonce:</span>
          <span className="text-[var(--hud-text)]">{block.nonce}</span>
          <span className="text-[var(--hud-text-muted)]">Hash:</span>
          <span className="text-[var(--hud-accent)]" title={block.hash}>{showFullHashes ? block.hash : hashPreview(block.hash)}</span>
        </div>
      ) : (
      <dl className="grid gap-2 font-mono text-sm">
        <div className="flex flex-wrap gap-2">
          <dt className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Timestamp:</dt>
          <dd className="flex flex-1 items-center gap-2 text-[var(--hud-text)]">
            {editing ? (
              <input
                type="number"
                value={editTimestamp}
                onChange={(e) => { const v = e.target.valueAsNumber; setEditTimestamp(Number.isFinite(v) ? v : block.timestamp); }}
                className="hud-input w-40 px-2 py-1"
              />
            ) : (
              new Date(block.timestamp).toISOString().replace("T", " ").replace("Z", " UTC")
            )}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Data:</dt>
          <dd className="flex flex-1 items-center gap-2 text-[var(--hud-text)]">
            {editing ? (
              <input
                type="text"
                value={editData}
                onChange={(e) => setEditData(e.target.value)}
                className="hud-input flex-1 min-w-0 px-2 py-1"
              />
            ) : (
              block.data
            )}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Previous hash:</dt>
          <dd className="flex flex-1 items-center gap-2 text-[var(--hud-accent)]">
            {editing ? (
              <input
                type="text"
                value={editPreviousHash}
                onChange={(e) => setEditPreviousHash(e.target.value)}
                className="hud-input flex-1 min-w-0 px-2 py-1 font-mono"
              />
            ) : (
              <span
                className="relative inline-block break-all"
                title={showFullHashes ? undefined : block.previousHash}
                onMouseEnter={() => setHoveredHash("prev")}
                onMouseLeave={() => setHoveredHash(null)}
              >
                {showFullHashes ? block.previousHash : hashPreview(block.previousHash)}
                {hoveredHash === "prev" && !showFullHashes && (
                  <span className="absolute left-0 top-full z-10 mt-1 max-w-sm break-all rounded border border-[var(--hud-border)] bg-[var(--hud-panel)] px-2 py-1.5 font-mono text-xs text-[var(--hud-text)] shadow-lg">
                    {block.previousHash}
                  </span>
                )}
              </span>
            )}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Nonce:</dt>
          <dd className="flex flex-1 items-center gap-2 text-[var(--hud-text)]">
            {editing ? (
              <input
                type="number"
                min={0}
                value={editNonce}
                onChange={(e) => { const v = e.target.valueAsNumber; setEditNonce(Number.isFinite(v) && v >= 0 ? Math.floor(v) : block.nonce); }}
                className="hud-input w-28 px-2 py-1"
              />
            ) : (
              block.nonce
            )}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Hash:</dt>
          <dd className="flex flex-1 items-center gap-2 text-[var(--hud-accent)]">
            {editing ? (
              <input
                type="text"
                value={editHash}
                onChange={(e) => setEditHash(e.target.value)}
                className="hud-input flex-1 min-w-0 px-2 py-1 font-mono"
              />
            ) : (
              <span
                className="relative inline-block break-all"
                title={showFullHashes ? undefined : block.hash}
                onMouseEnter={() => setHoveredHash("hash")}
                onMouseLeave={() => setHoveredHash(null)}
              >
                {showFullHashes ? block.hash : hashPreview(block.hash)}
                {hoveredHash === "hash" && !showFullHashes && (
                  <span className="absolute left-0 top-full z-10 mt-1 max-w-sm break-all rounded border border-[var(--hud-border)] bg-[var(--hud-panel)] px-2 py-1.5 font-mono text-xs text-[var(--hud-text)] shadow-lg">
                    {block.hash}
                  </span>
                )}
              </span>
            )}
          </dd>
        </div>
        {!editing && (
          <div className="flex gap-2 pt-1">
            <button onClick={startEditing} className="hud-btn px-3 py-1.5 text-xs">
              Edit all fields
            </button>
          </div>
        )}
        {editing && (
          <div className="flex gap-2 pt-1">
            <button onClick={saveEdit} className="hud-btn border-[var(--hud-accent)] bg-[var(--hud-panel-hover)] px-3 py-1.5 text-xs text-[var(--hud-accent-bright)]">
              Save
            </button>
            <button onClick={cancelEdit} className="hud-btn px-3 py-1.5 text-xs">
              Cancel
            </button>
          </div>
        )}
        {hashMismatch && (() => {
          const recalculatedHash = Block.fromBlockData(block).calculateHash();
          const mismatch = recalculatedHash !== block.hash;
          return (
            <div className="mt-3 border border-[var(--hud-warn)]/50 bg-[var(--hud-warn)]/10 px-3 py-2 text-sm">
              <p className="font-medium uppercase tracking-wider text-[var(--hud-warn)]">One or more fields were changed</p>
              <p className="mt-1 text-[var(--hud-text-muted)]">
                Hash is computed from index + previousHash + timestamp + data + nonce. Changing any of these, or the hash itself,
                can make the stored hash no longer match the recalculated hash.
              </p>
              <div className="mt-2 grid gap-1 font-mono text-xs">
                <span className="text-[var(--hud-text-muted)]">Stored hash:</span>{" "}
                <span className="break-all text-[var(--hud-text)]">{showFullHashes ? block.hash : hashPreview(block.hash)}</span>
                <span className="mt-1 text-[var(--hud-text-muted)]">Hash recalculated from current content:</span>{" "}
                <span className="break-all text-[var(--hud-warn)]">
                  {showFullHashes ? recalculatedHash : hashPreview(recalculatedHash)}
                </span>
                {mismatch && (
                  <span className="mt-1 block text-[var(--hud-invalid)]">Mismatch → chain invalid</span>
                )}
              </div>
            </div>
          );
        })()}
      </dl>
      )}
    </div>
  );
}
