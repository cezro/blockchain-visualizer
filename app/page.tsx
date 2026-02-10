"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Block, isChainValid } from "@/lib/blockchain";
import type { BlockData, DifficultyLevel } from "@/lib/blockchain";
import { HASH_PREVIEW_LEN, MAX_DIFFICULTY, MINING_BATCH_SIZE } from "@/lib/blockchain/config";

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
  const [view, setView] = useState<"chain" | "ledger">("chain");
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

  const handleEditBlock = useCallback((index: number, newData: string) => {
    setChain((prev) =>
      prev.map((b) =>
        b.index === index ? { ...b, data: newData } : b
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-(--font-geist-sans)">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-400">
            Blockchain Visualizer
          </h1>
          <p className="mt-2 text-slate-400">
            See blocks, mine new ones, and watch validation in real time.
          </p>
        </header>

        {/* Validation indicator */}
        <section
          className={`mb-8 rounded-xl border-2 px-6 py-4 text-center text-lg font-semibold ${
            valid
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/60 bg-red-500/10 text-red-400"
          }`}
        >
          {valid ? "Chain Valid" : "Chain Invalid"}
        </section>

        {/* Difficulty: 1–4 buttons + optional 5–10 input */}
        <section className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-slate-400">Difficulty (leading zeros):</span>
          <div className="flex gap-2">
            {([1, 2, 3, 4] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDifficultyButton(d)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  difficulty === d
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <span className="text-slate-500">or</span>
          <label className="flex items-center gap-2 text-slate-400">
            <span className="text-sm">5–10:</span>
            <input
              type="number"
              min={5}
              max={MAX_DIFFICULTY}
              value={difficulty >= 5 ? difficulty : ""}
              onChange={handleDifficultyInput}
              placeholder="5–10"
              className="w-16 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-center text-slate-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>
          <span className="text-xs text-slate-500">(higher = slower mining)</span>
        </section>

        {/* Mining controls */}
        <section className="mb-8 flex flex-wrap items-end gap-3">
          <label className="flex flex-1 min-w-[200px] flex-col gap-1">
            <span className="text-sm text-slate-400">Block data</span>
            <input
              type="text"
              value={blockDataInput}
              onChange={(e) => setBlockDataInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startMining()}
              placeholder="e.g. Alice pays Bob 10"
              className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={isMining}
            />
          </label>
          <button
            onClick={startMining}
            disabled={isMining}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {isMining ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mining...
              </>
            ) : (
              "Mine"
            )}
          </button>
          {miningTimeMs != null && !isMining && (
            <span className="text-sm text-emerald-400">
              Mined in {formatTime(miningTimeMs)}
            </span>
          )}
          <button
            onClick={autoMine}
            disabled={isMining || autoMineProgress != null}
            className="rounded-lg border border-slate-500 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700/50 disabled:opacity-50"
          >
            {autoMineProgress != null
              ? `Auto-mining ${autoMineProgress}/5...`
              : "Auto-mine 5 blocks"}
          </button>
          <button
            onClick={resetChain}
            className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Reset chain
          </button>
        </section>

        {/* View toggle: Chain vs Ledger + hash display */}
        <section className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setView("chain")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                view === "chain" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Block chain
            </button>
            <button
              onClick={() => setView("ledger")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                view === "ledger" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Transaction ledger
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showFullHashes}
              onChange={(e) => setShowFullHashes(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            Show full hashes
          </label>
        </section>

        {/* Sort, filter, and layout (chain view only) */}
        {view === "chain" && (
          <section className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-slate-700/60 bg-slate-800/30 px-4 py-3">
            <span className="text-sm text-slate-500">Sort:</span>
            <div className="flex gap-1">
              {(["index", "timestamp", "nonce"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSortBy(s)}
                  className={`rounded px-2.5 py-1 text-sm capitalize ${
                    sortBy === s ? "bg-slate-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-sm text-slate-500">Filter:</span>
            <div className="flex gap-1">
              {(["all", "valid", "invalid"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterBy(f)}
                  className={`rounded px-2.5 py-1 text-sm capitalize ${
                    filterBy === f ? "bg-slate-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
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
              className="w-40 rounded border border-slate-600 bg-slate-800/80 px-2 py-1 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-slate-600">|</span>
            <span className="text-sm text-slate-500">View:</span>
            <div className="flex gap-1">
              {(["list", "grid", "compact"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setChainLayout(l)}
                  className={`rounded px-2.5 py-1 text-sm capitalize ${
                    chainLayout === l ? "bg-slate-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </section>
        )}

        {view === "ledger" ? (
          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Ledger
            </h2>
            <ul className="space-y-1.5 font-mono text-sm">
              {chain.map((b) => (
                <li key={b.index}>
                  Block {b.index}: {b.data}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <>
            {/* Block chain */}
            <div
              className={
                chainLayout === "list"
                  ? "space-y-6"
                  : chainLayout === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-2"
              }
            >
              {filteredAndSortedChain.length === 0 ? (
              <p className="rounded-xl border border-slate-700 bg-slate-800/30 py-8 text-center text-slate-500">
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
              <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-600 bg-slate-800/30 py-12">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                <span className="text-slate-400">Mining block...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
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
  onEdit: (index: number, newData: string) => void;
  showFullHashes: boolean;
  layout?: "list" | "grid" | "compact";
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.data);
  const [hoveredHash, setHoveredHash] = useState<"prev" | "hash" | null>(null);
  const linkValid = previousHash === null || block.previousHash === previousHash;
  const hashMismatch = Block.fromBlockData(block).calculateHash() !== block.hash;

  const saveEdit = () => {
    if (editValue.trim() !== "" && editValue !== block.data) {
      onEdit(block.index, editValue.trim());
    }
    setEditing(false);
    setEditValue(block.data);
  };

  const isCompact = layout === "compact";

  return (
    <div
      className={`rounded-xl border-2 bg-slate-800/60 ${
        hashMismatch ? "border-red-500/70" : linkValid ? "border-slate-600" : "border-amber-500/70"
      } ${isCompact ? "p-3" : "p-5"}`}
    >
      <div className={`flex items-center justify-between ${isCompact ? "mb-1.5" : "mb-3"}`}>
        <span className={isCompact ? "text-sm font-semibold text-emerald-400" : "text-lg font-semibold text-emerald-400"}>
          Block {block.index}
        </span>
        {previousHash !== null && (
          <span
            className={`flex items-center gap-1 text-xs ${
              linkValid ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {linkValid ? "✓ Link OK" : "✗ Link broken"}
          </span>
        )}
      </div>
      {isCompact ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-slate-500">Data:</span>
          <span className="text-slate-300">
            {editing ? (
              <span className="flex items-center gap-1">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="w-32 rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-slate-100"
                  autoFocus
                />
                <button onClick={saveEdit} className="text-emerald-400 hover:underline">Save</button>
                <button onClick={() => { setEditing(false); setEditValue(block.data); }} className="text-slate-500 hover:underline">Cancel</button>
              </span>
            ) : (
              <>
                {block.data}
                <button onClick={() => setEditing(true)} className="ml-1 text-slate-500 hover:text-emerald-400">Edit</button>
              </>
            )}
          </span>
          <span className="text-slate-500">Nonce:</span>
          <span className="text-slate-300">{block.nonce}</span>
          <span className="text-slate-500">Hash:</span>
          <span className="text-slate-400" title={block.hash}>{showFullHashes ? block.hash : hashPreview(block.hash)}</span>
        </div>
      ) : (
      <dl className="grid gap-2 font-mono text-sm">
        <div className="flex flex-wrap gap-2">
          <dt className="text-slate-500">Timestamp:</dt>
          <dd className="text-slate-300">
            {new Date(block.timestamp).toISOString().replace("T", " ").replace("Z", " UTC")}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-slate-500">Data:</dt>
          <dd className="flex flex-1 items-center gap-2 text-slate-300">
            {editing ? (
              <>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditValue(block.data);
                  }}
                  className="rounded bg-slate-600 px-2 py-1 text-xs hover:bg-slate-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {block.data}
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-slate-500 underline hover:text-emerald-400"
                >
                  Edit
                </button>
              </>
            )}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-slate-500">Previous hash:</dt>
          <dd
            className="relative inline-block break-all font-mono text-sm text-slate-400"
            title={showFullHashes ? undefined : block.previousHash}
            onMouseEnter={() => setHoveredHash("prev")}
            onMouseLeave={() => setHoveredHash(null)}
          >
            {showFullHashes ? block.previousHash : hashPreview(block.previousHash)}
            {hoveredHash === "prev" && !showFullHashes && (
              <span className="absolute left-0 top-full z-10 mt-1 max-w-sm break-all rounded border border-slate-600 bg-slate-800 px-2 py-1.5 font-mono text-xs text-slate-200 shadow-lg">
                {block.previousHash}
              </span>
            )}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-slate-500">Nonce:</dt>
          <dd className="text-slate-300">{block.nonce}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-slate-500">Hash:</dt>
          <dd
            className="relative inline-block break-all font-mono text-sm text-slate-400"
            title={showFullHashes ? undefined : block.hash}
            onMouseEnter={() => setHoveredHash("hash")}
            onMouseLeave={() => setHoveredHash(null)}
          >
            {showFullHashes ? block.hash : hashPreview(block.hash)}
            {hoveredHash === "hash" && !showFullHashes && (
              <span className="absolute left-0 top-full z-10 mt-1 max-w-sm break-all rounded border border-slate-600 bg-slate-800 px-2 py-1.5 font-mono text-xs text-slate-200 shadow-lg">
                {block.hash}
              </span>
            )}
          </dd>
        </div>
        {hashMismatch && (() => {
          const recalculatedHash = Block.fromBlockData(block).calculateHash();
          const mismatch = recalculatedHash !== block.hash;
          return (
            <div className="mt-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
              <p className="font-medium text-amber-400">Block content was changed</p>
              <p className="mt-1 text-slate-400">
                Hash is computed from index + previousHash + timestamp + data + nonce. You changed the data, so the
                stored hash no longer matches.
              </p>
              <div className="mt-2 grid gap-1 font-mono text-xs">
                <span className="text-slate-500">Stored hash (unchanged):</span>{" "}
                <span className="break-all text-slate-300">{showFullHashes ? block.hash : hashPreview(block.hash)}</span>
                <span className="mt-1 text-slate-500">Hash if recalculated from current content:</span>{" "}
                <span className="break-all text-amber-300">
                  {showFullHashes ? recalculatedHash : hashPreview(recalculatedHash)}
                </span>
                {mismatch && (
                  <span className="mt-1 block text-amber-400">Mismatch → chain invalid</span>
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
