"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  Vector3,
} from "three";
import { Html } from "@react-three/drei";
import { BLOCK_HALF_X, getBlockCenterX, hashPreview } from "@/app/components/three/threeUtils";

/** Line from the tail (right side) of block i to the head (left side) of block i+1. Represents the hash linking the chain. */
export function ChainLink({
  fromIndex,
  toIndex,
  total,
  valid,
  prevBlockHash,
  nextBlockPrevHash,
  showFullHashes,
}: {
  fromIndex: number;
  toIndex: number;
  total: number;
  valid: boolean;
  prevBlockHash: string;
  nextBlockPrevHash: string;
  showFullHashes: boolean;
}) {
  const startX = getBlockCenterX(fromIndex, total) + BLOCK_HALF_X;
  const endX = getBlockCenterX(toIndex, total) - BLOCK_HALF_X;
  const midX = (startX + endX) / 2;
  const lineRef = useRef<Line>(null);
  const line = useMemo(() => {
    const points = [new Vector3(startX, 0, 0), new Vector3(endX, 0, 0)];
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = valid
      ? new LineBasicMaterial({ color: "#9ba387" })
      : new LineDashedMaterial({ color: "#c75c5c", dashSize: 0.15, gapSize: 0.12 });
    return new Line(geometry, material);
  }, [startX, endX, valid]);

  useLayoutEffect(() => {
    if (!valid) line.computeLineDistances();
  }, [line, valid]);

  return (
    <group>
      <primitive ref={lineRef} object={line} />
      <Html
        position={[midX, 0.35, 0]}
        center
        distanceFactor={5}
        style={{ pointerEvents: "none", userSelect: "none", minWidth: 140 }}
      >
        <div
          className={`border px-2 py-1 font-mono text-[10px] shadow-lg ${
            valid
              ? "border-[#7a9b6e] bg-[#252a33] text-[#9ba387]"
              : "border-[#c75c5c] bg-[#252a33] text-[#c75c5c]"
          }`}
        >
          {valid ? (
            <span title={showFullHashes ? undefined : prevBlockHash}>
              Hash link ✓<br />
              <span className="text-[#8b949e]">prevHash = hash</span>
            </span>
          ) : (
            <span>
              <span className="font-semibold uppercase">Hash mismatch</span>
              <div className="mt-0.5 grid gap-0.5 text-[9px]">
                <div className={`text-[#8b949e] ${showFullHashes ? "break-all" : ""}`}>
                  Block {fromIndex} hash: <span className="text-[#e6edf3]">{hashPreview(prevBlockHash, showFullHashes)}</span>
                </div>
                <div className={`text-[#8b949e] ${showFullHashes ? "break-all" : ""}`}>
                  Block {toIndex} prevHash: <span className="text-[#c9a227]">{hashPreview(nextBlockPrevHash, showFullHashes)}</span>
                </div>
                <div className="text-[#c75c5c]">≠ no link</div>
              </div>
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

