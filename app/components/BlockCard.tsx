"use client";

import { useState } from "react";
import { Block } from "@/lib/blockchain";
import type { BlockData } from "@/lib/blockchain";
import { HASH_PREVIEW_LEN } from "@/lib/blockchain/config";

function hashPreview(hash: string): string {
  return hash.length <= HASH_PREVIEW_LEN ? hash : `${hash.slice(0, HASH_PREVIEW_LEN)}...`;
}

export function BlockCard({
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

