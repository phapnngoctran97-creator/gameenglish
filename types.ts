export enum GameState {
  HOME = 'HOME',
  PROFILE = 'PROFILE',
  MAP = 'MAP',
  LOADING_BATTLE = 'LOADING_BATTLE',
  BATTLE = 'BATTLE',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  icon: string; // Emoji
  isLocked: boolean;
  levelNumber: number; // 1 to 100+
  chapterName: string; // e.g., "The Village", "The City"
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  vietnameseTranslation?: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  gold: number;
}

export interface UserProfile {
  name: string;
  avatar: string; // Emoji
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  country: string; // Flag emoji
}