"use client";

import { HASH_PREVIEW_LEN } from "@/lib/blockchain/config";

export const BLOCK_SPACING = 2.2;
export const BLOCK_HALF_X = 0.7;

export function getBlockCenterX(index: number, total: number): number {
  return (index - (total - 1) / 2) * BLOCK_SPACING;
}

export function hashPreview(hash: string, showFull: boolean): string {
  if (showFull) return hash;
  return hash.length <= HASH_PREVIEW_LEN ? hash : `${hash.slice(0, HASH_PREVIEW_LEN)}…`;
}

