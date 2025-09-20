import type { fileToDataUrl } from './utils/fileUtils';
export type AnchorType = 'upload' | 'place' | 'default';

export type AnchorValue = File | string | null;

export interface Scene {
  locus: string;
  description: string;
}

export interface QuickRecapItem {
  item: string;
  locusHint: string;
}

export interface MemoryPalace {
  title: string;
  imageGenerations: string[][];
  scenes: Scene[];
  quickRecap: QuickRecapItem[];
  imagePrompt: string;
}

export interface SavedMemoryPalace extends MemoryPalace {
  id: number;
  savedAt: string;
  anchorType: AnchorType;
  originalAnchor: string; // Place name or a data URL for uploaded images
}
