import { Block } from "./Block";
import type { DifficultyLevel } from "./types";

/**
 * In-memory blockchain: genesis block + chain of blocks with configurable difficulty.
 */
export class Blockchain {
  chain: Block[];
  difficulty: DifficultyLevel;

  constructor(difficulty: DifficultyLevel = 2) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
  }

  private createGenesisBlock(): Block {
    return new Block(0, Date.now(), "Genesis Block", "0");
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /** Add a new block with given data (caller is responsible for mining). */
  addBlock(block: Block): void {
    this.chain.push(block);
  }

  /** Create and mine a new block, then add it (sync mining). */
  addBlockWithData(data: string): Block {
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      data,
      this.getLatestBlock().hash
    );
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Validate the chain: each block's hash matches its contents,
   * and each block's previousHash matches the previous block's hash.
   */
  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  /** Replace the chain (e.g. after editing a block in the UI). */
  setChain(blocks: Block[]): void {
    this.chain = blocks;
  }

  /** Set difficulty (leading zeros). Does not re-mine existing blocks. */
  setDifficulty(d: DifficultyLevel): void {
    this.difficulty = d;
  }
}
