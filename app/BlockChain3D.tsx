"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Mesh } from "three";
import {
  BufferGeometry,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  Vector3,
} from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, useCursor } from "@react-three/drei";
import type { BlockData } from "@/lib/blockchain";
import { Block } from "@/lib/blockchain";

const BLOCK_SPACING = 2.2;
const BLOCK_HALF_X = 0.7;

function getBlockCenterX(index: number, total: number): number {
  return (index - (total - 1) / 2) * BLOCK_SPACING;
}

const HASH_LABEL_LEN = 8;

/** Line from the tail (right side) of block i to the head (left side) of block i+1. Represents the hash linking the chain. */
function ChainLink({
  fromIndex,
  toIndex,
  total,
  valid,
  prevBlockHash,
  nextBlockPrevHash,
}: {
  fromIndex: number;
  toIndex: number;
  total: number;
  valid: boolean;
  prevBlockHash: string;
  nextBlockPrevHash: string;
}) {
  const startX = getBlockCenterX(fromIndex, total) + BLOCK_HALF_X;
  const endX = getBlockCenterX(toIndex, total) - BLOCK_HALF_X;
  const midX = (startX + endX) / 2;
  const lineRef = useRef<Line>(null);
  const line = useMemo(() => {
    const points = [new Vector3(startX, 0, 0), new Vector3(endX, 0, 0)];
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = valid
      ? new LineBasicMaterial({ color: "#10b981" })
      : new LineDashedMaterial({ color: "#ef4444", dashSize: 0.15, gapSize: 0.12 });
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
          className={`rounded border px-2 py-1 font-mono text-[10px] shadow-lg ${
            valid
              ? "border-emerald-600/60 bg-slate-900/95 text-emerald-400"
              : "border-red-500/60 bg-slate-900/95 text-red-300"
          }`}
        >
          {valid ? (
            <span title={prevBlockHash}>
              Hash link ✓<br />
              <span className="text-slate-500">prevHash = hash</span>
            </span>
          ) : (
            <span>
              <span className="font-semibold">Hash mismatch</span>
              <div className="mt-0.5 grid gap-0.5 text-[9px]">
                <div className="text-slate-400">
                  Block {fromIndex} hash: <span className="text-slate-300">{prevBlockHash.slice(0, HASH_LABEL_LEN)}…</span>
                </div>
                <div className="text-slate-400">
                  Block {toIndex} prevHash: <span className="text-amber-300">{nextBlockPrevHash.slice(0, HASH_LABEL_LEN)}…</span>
                </div>
                <div className="text-red-400">≠ no link</div>
              </div>
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

function BlockMesh({
  block,
  index,
  total,
  selected,
  onSelect,
}: {
  block: BlockData;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const hashMismatch = Block.fromBlockData(block).calculateHash() !== block.hash;
  const color = hashMismatch ? "#ef4444" : hovered ? "#34d399" : "#10b981";

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
        <meshStandardMaterial color={color} emissive={selected ? "#064e3b" : undefined} metalness={0.2} roughness={0.6} />
      </mesh>
      <Html
        position={[0, 0.7, 0]}
        center
        distanceFactor={6}
        style={{ pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap" }}
      >
        <span className="rounded bg-slate-900/95 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-400 shadow-lg">
          Block {block.index}
        </span>
      </Html>
      {selected && (
        <Html
          position={[0, -0.9, 0]}
          center
          distanceFactor={5}
          style={{ pointerEvents: "none", maxWidth: 280 }}
        >
          <div className="rounded-lg border border-slate-600 bg-slate-900/95 p-3 font-mono text-xs text-slate-200 shadow-xl">
            <div className="mb-1 font-semibold text-emerald-400">Block {block.index}</div>
            <div className="space-y-0.5 text-slate-400">
              <div><span className="text-slate-500">Data:</span> {block.data}</div>
              <div><span className="text-slate-500">Nonce:</span> {block.nonce}</div>
              <div className="break-all"><span className="text-slate-500">Hash:</span> {block.hash.slice(0, 16)}...</div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function BlockChain3D({
  chain,
  selectedIndex,
  onSelectBlock,
  fullscreen = false,
}: {
  chain: BlockData[];
  selectedIndex: number | null;
  onSelectBlock: (index: number | null) => void;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={`w-full overflow-hidden bg-slate-950 ${
        fullscreen ? "h-full min-h-0" : "h-[480px] rounded-xl border border-slate-700"
      }`}
    >
      <Canvas
        camera={{ position: [0, 4, 12], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => onSelectBlock(null)}
      >
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-far={50} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        <OrbitControls enablePan enableZoom minDistance={6} maxDistance={30} />
        <group position={[0, 0, 0]}>
          {chain.length > 1 &&
            chain.slice(0, -1).map((_, i) => {
              const next = chain[i + 1];
              const curr = chain[i];
              const linkValid = next.previousHash === curr.hash;
              const currValid = Block.fromBlockData(curr).calculateHash() === curr.hash;
              const nextValid = Block.fromBlockData(next).calculateHash() === next.hash;
              const valid = linkValid && currValid && nextValid;
              return (
                <ChainLink
                  key={`link-${i}-${curr.hash.slice(0, 8)}`}
                  fromIndex={i}
                  toIndex={i + 1}
                  total={chain.length}
                  valid={valid}
                  prevBlockHash={curr.hash}
                  nextBlockPrevHash={next.previousHash}
                />
              );
            })}
          {chain.map((block, i) => (
            <BlockMesh
              key={`${block.index}-${block.hash}`}
              block={block}
              index={i}
              total={chain.length}
              selected={selectedIndex === block.index}
              onSelect={() => onSelectBlock(selectedIndex === block.index ? null : block.index)}
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
}
