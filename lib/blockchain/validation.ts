import { Block } from "./Block";
import type { BlockData } from "./types";

/**
 * Check if a chain of block data is valid: hashes and links.
 */
export function isChainValid(chain: BlockData[]): boolean {
  if (chain.length === 0) return false;
  for (let i = 1; i < chain.length; i++) {
    const current = Block.fromBlockData(chain[i]);
    const previous = Block.fromBlockData(chain[i - 1]);
    if (current.hash !== current.calculateHash()) return false;
    if (current.previousHash !== previous.hash) return false;
  }
  return true;
}
