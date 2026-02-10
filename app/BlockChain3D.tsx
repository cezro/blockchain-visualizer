"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { BlockData } from "@/lib/blockchain";
import { Block } from "@/lib/blockchain";
import { ChainLink } from "@/app/components/three/ChainLink";
import { BlockMesh } from "@/app/components/three/BlockMesh";

export function BlockChain3D({
  chain,
  selectedIndex,
  onSelectBlock,
  fullscreen = false,
  showFullHashes = false,
  onRequestEdit,
}: {
  chain: BlockData[];
  selectedIndex: number | null;
  onSelectBlock: (index: number | null) => void;
  fullscreen?: boolean;
  showFullHashes?: boolean;
  onRequestEdit?: (index: number) => void;
}) {
  return (
    <div
      className={`w-full overflow-hidden bg-[#0f1318] ${
        fullscreen ? "h-full min-h-0" : "h-[480px] border border-[#3d4552]"
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
                  showFullHashes={showFullHashes}
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
              showFullHashes={showFullHashes}
              onRequestEdit={onRequestEdit}
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
}
