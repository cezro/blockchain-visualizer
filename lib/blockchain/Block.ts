import SHA256 from "crypto-js/sha256";
import type { BlockData } from "./types";

/**
 * A single block in the blockchain.
 * Contains index, timestamp, data, previousHash, nonce, and computed hash.
 */
export class Block {
  index: number;
  timestamp: number;
  data: string;
  previousHash: string;
  nonce: number;
  hash: string;

  constructor(
    index: number,
    timestamp: number,
    data: string,
    previousHash = ""
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  /** Compute SHA-256 hash of block contents */
  calculateHash(): string {
    return SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        this.data +
        this.nonce
    ).toString();
  }

  /**
   * Proof-of-work: find a nonce such that hash starts with `difficulty` zeros.
   * Runs synchronously; for UI-friendly mining with spinner, use incremental mining in the app.
   */
  mineBlock(difficulty: number): void {
    const target = Array(difficulty + 1).join("0");

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  /** Try one more nonce and update hash. Returns true if hash now meets difficulty. */
  tryNextNonce(difficulty: number): boolean {
    const target = Array(difficulty + 1).join("0");
    this.nonce++;
    this.hash = this.calculateHash();
    return this.hash.substring(0, difficulty) === target;
  }

  /** Export block for display/serialization */
  toBlockData(): BlockData {
    return {
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash,
    };
  }

  /** Create a Block from serialized data (e.g. after edit in UI) */
  static fromBlockData(b: BlockData): Block {
    const block = new Block(b.index, b.timestamp, b.data, b.previousHash);
    block.nonce = b.nonce;
    block.hash = b.hash;
    return block;
  }
}
