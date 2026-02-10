/**
 * Blockchain visualizer – shared types
 */

/** Serializable shape of a block (for display and persistence) */
export interface BlockData {
  index: number;
  timestamp: number;
  data: string;
  previousHash: string;
  nonce: number;
  hash: string;
}

/** Difficulty: number of leading zeros required in block hash (1 or higher) */
export type DifficultyLevel = number;
