export enum GameState {
  HOME = 'HOME',
  EXPLORING = 'EXPLORING',
  EXAMINING = 'EXAMINING',
  NOTEBOOK = 'NOTEBOOK'
}

export interface WordDetail {
  english: string;
  vietnamese: string;
  pronunciation: string; // IPA
  type: string; // noun, verb, etc.
  exampleSentence: string;
  usagePatterns: string[]; // List of common phrases/sentences using the word
  description: string;
}

export interface InteractableItem {
  id: string;
  name: string; // The display name
  emoji: string;
  wordDetail: WordDetail;
  isCollected: boolean;
}

export interface LocationExit {
  direction: string; // e.g., "To Kitchen", "Go Outside"
  targetLocationName: string; // The ID/Name of the next room
  emoji: string;
}

export interface Location {
  id: string;
  name: string; // e.g., "Bedroom", "Supermarket"
  description: string; // "A cozy room with morning sunlight..."
  items: InteractableItem[];
  exits: LocationExit[];
  backgroundTheme: string; // CSS class for bg color
}

export interface PlayerProgress {
  discoveredWords: string[]; // List of IDs
  locationHistory: string[];
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export interface PlayerStats {
  xp: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  country: string;
}