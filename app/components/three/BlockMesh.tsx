"use client";

import { useRef, useState } from "react";
import type { Mesh } from "three";
import { Html, useCursor } from "@react-three/drei";
import type { BlockData } from "@/lib/blockchain";
import { Block } from "@/lib/blockchain";
import { HASH_PREVIEW_LEN } from "@/lib/blockchain/config";
import { getBlockCenterX } from "@/app/components/three/threeUtils";

export function BlockMesh({
  block,
  index,
  total,
  selected,
  onSelect,
  showFullHashes,
  onRequestEdit,
}: {
  block: BlockData;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  showFullHashes: boolean;
  onRequestEdit?: (index: number) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const hashMismatch = Block.fromBlockData(block).calculateHash() !== block.hash;
  const color = hashMismatch ? "#c75c5c" : hovered ? "#b5c49a" : "#9ba387";

  const x = getBlockCenterX(index, total);
  return (
    <group position={[x, 0, 0]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.4, 1, 0.8]} />
        <meshStandardMaterial color={color} emissive={selected ? "#3d4552" : "#000000"} metalness={0.2} roughness={0.6} />
      </mesh>
      <Html
        position={[0, 0.7, 0]}
        center
        distanceFactor={6}
        style={{ pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap" }}
      >
        <span className="rounded border border-[#3d4552] bg-[#252a33] px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#9ba387] shadow-lg">
          Block {block.index}
        </span>
      </Html>
      {selected && (
        <Html
          position={[0, -0.9, 0]}
          center
          distanceFactor={5}
          style={{ maxWidth: 280 }}
        >
          <div className="rounded border border-[#3d4552] bg-[#252a33] p-3 font-mono text-xs text-[#e6edf3] shadow-xl">
            <div className="mb-1 font-semibold uppercase tracking-wider text-[#9ba387]">Block {block.index}</div>
            <div className="space-y-0.5 text-[#8b949e]">
              <div><span className="text-[#8b949e]">Data:</span> {block.data}</div>
              <div><span className="text-[#8b949e]">Nonce:</span> {block.nonce}</div>
              <div className="break-all"><span className="text-[#8b949e]">Hash:</span> {showFullHashes ? block.hash : `${block.hash.slice(0, HASH_PREVIEW_LEN)}…`}</div>
            </div>
            {onRequestEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestEdit(block.index);
                }}
                className="mt-2 w-full rounded border border-[#3d4552] bg-[#1a1e24] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ba387] transition-colors hover:border-[#9ba387] hover:bg-[#252a33]"
              >
                Edit
              </button>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

