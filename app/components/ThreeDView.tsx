"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import type { BlockData } from "@/lib/blockchain";
import { DynamicBlockChain3D } from "@/app/components/DynamicBlockChain3D";

export function ThreeDView({
  showInline = true,
  chain,
  selected3DBlock,
  setSelected3DBlock,
  is3DFullscreen,
  setIs3DFullscreen,
  showFullHashes,
  setEditing3DBlockIndex,
}: {
  showInline?: boolean;
  chain: BlockData[];
  selected3DBlock: number | null;
  setSelected3DBlock: (v: number | null) => void;
  is3DFullscreen: boolean;
  setIs3DFullscreen: (v: boolean) => void;
  showFullHashes: boolean;
  setEditing3DBlockIndex: (v: number | null) => void;
}) {
  return (
    <>
      {is3DFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col hud-grid-bg">
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
            <DynamicBlockChain3D
              chain={chain}
              selectedIndex={selected3DBlock}
              onSelectBlock={setSelected3DBlock}
              fullscreen
              showFullHashes={showFullHashes}
              onRequestEdit={setEditing3DBlockIndex}
            />
          </div>
        </div>
      )}

      {showInline && (
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
              <DynamicBlockChain3D
                chain={chain}
                selectedIndex={selected3DBlock}
                onSelectBlock={setSelected3DBlock}
                showFullHashes={showFullHashes}
                onRequestEdit={setEditing3DBlockIndex}
              />
            </div>
          )}
        </section>
      )}
    </>
  );
}

