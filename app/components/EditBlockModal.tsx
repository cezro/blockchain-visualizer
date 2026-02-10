"use client";

import type { BlockData } from "@/lib/blockchain";

export function EditBlockModal({
  openIndex,
  block,
  modalData,
  setModalData,
  modalTimestamp,
  setModalTimestamp,
  modalPreviousHash,
  setModalPreviousHash,
  modalNonce,
  setModalNonce,
  modalHash,
  setModalHash,
  onEditBlock,
  onClose,
}: {
  openIndex: number | null;
  block: BlockData | null;
  modalData: string;
  setModalData: (v: string) => void;
  modalTimestamp: number;
  setModalTimestamp: (v: number) => void;
  modalPreviousHash: string;
  setModalPreviousHash: (v: string) => void;
  modalNonce: number;
  setModalNonce: (v: number) => void;
  modalHash: string;
  setModalHash: (v: string) => void;
  onEditBlock: (index: number, updates: Partial<Omit<BlockData, "index">>) => void;
  onClose: () => void;
}) {
  if (openIndex == null || block == null) return null;

  const handleModalSave = () => {
    const ts = Number(modalTimestamp);
    const nonceNum = Math.floor(Number(modalNonce));
    if (!Number.isFinite(ts) || !Number.isFinite(nonceNum) || nonceNum < 0) return;
    onEditBlock(openIndex, {
      data: modalData.trim(),
      timestamp: ts,
      previousHash: modalPreviousHash,
      nonce: nonceNum,
      hash: modalHash,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-block-modal-title"
    >
      <div
        className="hud-section w-full max-w-lg rounded border-[var(--hud-line)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-block-modal-title" className="hud-readout mb-4 text-lg tracking-widest text-[var(--hud-accent-bright)]">
          Edit Block {block.index}
        </h2>
        <dl className="grid gap-3 font-mono text-sm">
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Data</dt>
            <dd>
              <input
                type="text"
                value={modalData}
                onChange={(e) => setModalData(e.target.value)}
                className="hud-input w-full px-3 py-2"
              />
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Timestamp</dt>
            <dd>
              <input
                type="number"
                value={modalTimestamp}
                onChange={(e) => {
                  const v = e.target.valueAsNumber;
                  setModalTimestamp(Number.isFinite(v) ? v : block.timestamp);
                }}
                className="hud-input w-full px-3 py-2"
              />
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Previous hash</dt>
            <dd>
              <input
                type="text"
                value={modalPreviousHash}
                onChange={(e) => setModalPreviousHash(e.target.value)}
                className="hud-input w-full px-3 py-2 font-mono text-xs"
              />
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Nonce</dt>
            <dd>
              <input
                type="number"
                min={0}
                value={modalNonce}
                onChange={(e) => {
                  const v = e.target.valueAsNumber;
                  setModalNonce(Number.isFinite(v) && v >= 0 ? Math.floor(v) : block.nonce);
                }}
                className="hud-input w-full px-3 py-2"
              />
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wider text-[var(--hud-text-muted)]">Hash</dt>
            <dd>
              <input
                type="text"
                value={modalHash}
                onChange={(e) => setModalHash(e.target.value)}
                className="hud-input w-full px-3 py-2 font-mono text-xs"
              />
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleModalSave}
            className="hud-btn border-[var(--hud-accent)] bg-[var(--hud-panel-hover)] px-4 py-2 text-sm text-[var(--hud-accent-bright)]"
          >
            Save
          </button>
          <button type="button" onClick={onClose} className="hud-btn px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

