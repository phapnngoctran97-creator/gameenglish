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

export enum QuestionType {
  READING = 'READING',     // Multiple choice standard
  LISTENING = 'LISTENING', // Listen to text, answer question
  SPEAKING = 'SPEAKING',   // Read aloud a sentence
  WRITING = 'WRITING'      // Fill in the blank / Unscramble
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
  type: QuestionType;
  question: string;
  options?: string[]; // For Reading/Listening
  correctAnswer: string;
  explanation: string;
  vietnameseTranslation?: string;
  listeningText?: string; // Text to be spoken by AI for Listening tasks
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