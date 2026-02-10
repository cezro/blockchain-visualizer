"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Block, isChainValid } from "@/lib/blockchain";
import type { BlockData, DifficultyLevel } from "@/lib/blockchain";
import { MAX_DIFFICULTY, MINING_BATCH_SIZE } from "@/lib/blockchain/config";
import { BlockCard } from "@/app/components/BlockCard";
import { ChainSortFilterLayoutBar } from "@/app/components/ChainSortFilterLayoutBar";
import { DifficultyControls } from "@/app/components/DifficultyControls";
import { EditBlockModal } from "@/app/components/EditBlockModal";
import { LedgerView } from "@/app/components/LedgerView";
import { MiningControls } from "@/app/components/MiningControls";
import { ThreeDView } from "@/app/components/ThreeDView";
import { ValidationIndicator } from "@/app/components/ValidationIndicator";
import { ViewToggle } from "@/app/components/ViewToggle";

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
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
  const [autoMineMessages, setAutoMineMessages] = useState<string[]>([]);
  const [editing3DBlockIndex, setEditing3DBlockIndex] = useState<number | null>(null);
  const [modalData, setModalData] = useState("");
  const [modalTimestamp, setModalTimestamp] = useState(0);
  const [modalPreviousHash, setModalPreviousHash] = useState("");
  const [modalNonce, setModalNonce] = useState(0);
  const [modalHash, setModalHash] = useState("");
  const rafIdRef = useRef<number | null>(null);

  const valid = isChainValid(chain);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editing3DBlockIndex == null) return;
    const block = chain.find((b) => b.index === editing3DBlockIndex);
    if (block) {
      setModalData(block.data);
      setModalTimestamp(block.timestamp);
      setModalPreviousHash(block.previousHash);
      setModalNonce(block.nonce);
      setModalHash(block.hash);
    }
  }, [editing3DBlockIndex, chain]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    setAutoMineMessages([]);
    const count = 5;
    let step = 0;

    const addNext = () => {
      if (step >= count) {
        setAutoMineProgress(null);
        setAutoMineMessages((prev) =>
          prev.length > 0 ? [...prev, `Done — ${count} blocks mined.`] : prev
        );
        return;
      }

      const t0 = performance.now();

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
        const elapsed = Math.round(performance.now() - t0);

        setAutoMineMessages((msgs) => [
          ...msgs.slice(-4),
          `Block ${block.index} mined in ${formatTime(elapsed)}`,
        ]);

        return [...prev, block.toBlockData()];
      });

      step += 1;
      setAutoMineProgress(step);
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

  useEffect(() => {
    if (editing3DBlockIndex == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditing3DBlockIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing3DBlockIndex]);

  useEffect(() => {
    const last = autoMineMessages[autoMineMessages.length - 1];
    if (last?.startsWith("Done")) {
      const t = setTimeout(() => setAutoMineMessages([]), 4000);
      return () => clearTimeout(t);
    }
  }, [autoMineMessages]);

  const editingBlock =
    editing3DBlockIndex == null ? null : (chain.find((b) => b.index === editing3DBlockIndex) ?? null);

  return (
    <>
      {/* 3D fullscreen overlay */}
      <ThreeDView
        showInline={false}
        chain={chain}
        selected3DBlock={selected3DBlock}
        setSelected3DBlock={setSelected3DBlock}
        is3DFullscreen={is3DFullscreen}
        setIs3DFullscreen={setIs3DFullscreen}
        showFullHashes={showFullHashes}
        setEditing3DBlockIndex={setEditing3DBlockIndex}
      />

      {/* Edit block modal (from 3D view) */}
      <EditBlockModal
        openIndex={editing3DBlockIndex}
        block={editingBlock}
        modalData={modalData}
        setModalData={setModalData}
        modalTimestamp={modalTimestamp}
        setModalTimestamp={setModalTimestamp}
        modalPreviousHash={modalPreviousHash}
        setModalPreviousHash={setModalPreviousHash}
        modalNonce={modalNonce}
        setModalNonce={setModalNonce}
        modalHash={modalHash}
        setModalHash={setModalHash}
        onEditBlock={handleEditBlock}
        onClose={() => setEditing3DBlockIndex(null)}
      />

      <div className="min-h-screen hud-grid-bg hud-corner-stripes text-[var(--hud-text)] font-(--font-geist-sans)">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="hud-frame-border bg-[var(--hud-bg)]/95 backdrop-blur-sm px-6 py-8">
        <header className="hud-header-angular mb-6 px-6 py-4 -mx-1">
          <h1 className="hud-readout text-xl tracking-widest text-[var(--hud-line)]">
            Blockchain Visualizer
          </h1>
          <p className="mt-1 text-xs text-[var(--hud-text-muted)] uppercase tracking-widest">
            Mine blocks · Validate chain · Tamper demo
          </p>
        </header>

        {/* Validation indicator - section has fixed className to avoid hydration mismatch */}
        <ValidationIndicator valid={valid} />

        {/* Difficulty: 1–4 buttons + optional 5–10 input */}
        <DifficultyControls
          difficulty={difficulty}
          onDifficultyButton={handleDifficultyButton}
          onDifficultyInput={handleDifficultyInput}
        />

        {/* Mining controls */}
        <MiningControls
          blockDataInput={blockDataInput}
          setBlockDataInput={setBlockDataInput}
          isMining={isMining}
          startMining={startMining}
          miningTimeMs={miningTimeMs}
          formatTime={formatTime}
          autoMine={autoMine}
          autoMineProgress={autoMineProgress}
          autoMineMessages={autoMineMessages}
          resetChain={resetChain}
        />

        {/* View toggle: Chain vs Ledger + hash display */}
        <ViewToggle
          view={view}
          setView={setView}
          showFullHashes={showFullHashes}
          setShowFullHashes={setShowFullHashes}
        />

        {/* Sort, filter, and layout (chain view only) */}
        {view === "chain" && (
          <ChainSortFilterLayoutBar
            sortBy={sortBy}
            setSortBy={setSortBy}
            filterBy={filterBy}
            setFilterBy={setFilterBy}
            filterQuery={filterQuery}
            setFilterQuery={setFilterQuery}
            chainLayout={chainLayout}
            setChainLayout={setChainLayout}
          />
        )}

        {view === "ledger" ? (
          <LedgerView chain={chain} />
        ) : view === "3d" ? (
          <ThreeDView
            chain={chain}
            selected3DBlock={selected3DBlock}
            setSelected3DBlock={setSelected3DBlock}
            is3DFullscreen={is3DFullscreen}
            setIs3DFullscreen={setIs3DFullscreen}
            showFullHashes={showFullHashes}
            setEditing3DBlockIndex={setEditing3DBlockIndex}
          />
        ) : view === "chain" ? (
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
        ) : null}
        </div>
      </div>
    </div>
    </>
  );
}
