import { GoogleGenAI, Type } from "@google/genai";
import { Topic, Question, Difficulty, LeaderboardEntry, QuestionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are a helpful and encouraging English Tutor RPG Game Master.
Your student is a Vietnamese speaker.
Create content that is immediately useful for real-life conversations.
The content must scale in difficulty based on the provided LEVEL range.`;

// Themes for every 10 levels to ensure variety
const WORLD_THEMES = [
  "Greetings & Basics",       // 1-10
  "Family & Friends",         // 11-20
  "Food & Dining",            // 21-30
  "Shopping & Money",         // 31-40
  "Travel & Directions",      // 41-50
  "Health & Body",            // 51-60
  "Work & Career",            // 61-70
  "Feelings & Opinions",      // 71-80
  "Media & Technology",       // 81-90
  "Advanced Debates",         // 91-100
  "Mastery of Life"           // 100+
];

// --- CACHING SYSTEM ---
const CACHE_PREFIX = 'lingoquest_cache_v2_'; // Incremented version to clear old simple questions

const getFromCache = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.warn("Cache read error:", e);
    return null;
  }
};

const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn("Cache write error (Quota exceeded?):", e);
  }
};
// ----------------------

export const generateTopics = async (startLevel: number = 1, count: number = 10): Promise<Topic[]> => {
  // Check cache first
  const cacheKey = `topics_${startLevel}_${count}`;
  const cachedData = getFromCache<Topic[]>(cacheKey);
  if (cachedData) {
    console.log(`[Cache Hit] Loaded topics for levels ${startLevel}-${startLevel + count - 1}`);
    return cachedData;
  }

  try {
    // Determine context based on level
    const themeIndex = Math.min(Math.floor((startLevel - 1) / 10), WORLD_THEMES.length - 1);
    const currentTheme = WORLD_THEMES[themeIndex];
    
    // Determine difficulty label
    let difficultyLabel = "Easy";
    if (startLevel > 30) difficultyLabel = "Medium";
    if (startLevel > 70) difficultyLabel = "Hard";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              icon: { type: Type.STRING, description: "A single emoji representing the location/topic" },
            },
            required: ["name", "description", "icon"],
          },
        },
      },
      contents: `Generate ${count} distinct 'Locations' (Levels ${startLevel} to ${startLevel + count - 1}) for an English learning adventure map.
      
      CURRENT THEME: "${currentTheme}" (Focus purely on this theme).
      DIFFICULTY LEVEL: ${difficultyLabel}.
      
      The names should sound like RPG locations but reflect the daily life topic.
      Example: 'Cafe of Aromas', 'Market of Bargains'.
      
      Return strictly a JSON array.`,
    });

    const rawTopics = JSON.parse(response.text || "[]");
    
    const processedTopics = rawTopics.map((t: any, index: number) => ({
      ...t,
      id: `topic-${startLevel + index}`,
      levelNumber: startLevel + index,
      difficulty: startLevel > 70 ? Difficulty.HARD : startLevel > 30 ? Difficulty.MEDIUM : Difficulty.EASY,
      isLocked: true, // Will be handled by App logic
      chapterName: currentTheme
    }));

    // Save to cache
    saveToCache(cacheKey, processedTopics);
    return processedTopics;

  } catch (error) {
    console.error("Failed to generate topics:", error);
    // Fallback batch
    return Array.from({ length: count }).map((_, i) => ({
      id: `topic-fallback-${startLevel + i}`,
      name: `Location ${startLevel + i}`,
      description: "Practice your English skills here.",
      difficulty: Difficulty.EASY,
      icon: "🚩",
      isLocked: true,
      levelNumber: startLevel + i,
      chapterName: "Unknown Lands"
    }));
  }
};

export const generateQuestions = async (topicName: string, difficulty: Difficulty): Promise<Question[]> => {
  // Check cache first
  const cacheKey = `questions_${topicName.replace(/\s+/g, '')}_${difficulty}_mixed`;
  const cachedData = getFromCache<Question[]>(cacheKey);
  if (cachedData) {
    console.log(`[Cache Hit] Loaded questions for ${topicName}`);
    return cachedData;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: [QuestionType.READING, QuestionType.LISTENING, QuestionType.SPEAKING, QuestionType.WRITING] },
              question: { type: Type.STRING, description: "The prompt shown to the user" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Only for READING/LISTENING types. 4 choices."
              },
              listeningText: { type: Type.STRING, description: "For LISTENING type: The text the AI should read aloud." },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              vietnameseTranslation: { type: Type.STRING }
            },
            required: ["type", "question", "correctAnswer", "explanation"],
          },
        },
      },
      contents: `Generate 5 mixed-skill questions for the location '${topicName}' (Difficulty: ${difficulty}).
      
      Distribution:
      - 2 READING questions (Multiple choice conversation/vocabulary).
      - 1 LISTENING question (User listens to 'listeningText' then answers a multiple choice question).
      - 1 SPEAKING question (User must say a phrase. 'question' = "Say this phrase: [Phrase]", 'correctAnswer' = "[Phrase]").
      - 1 WRITING question (User fills in blank or unscrambles sentence. 'question' = "Unscramble: am / I / happy", 'correctAnswer' = "I am happy").

      CRITICAL: Focus on PRACTICAL COMMUNICATION.
      Include a clear Vietnamese translation/hint.`,
    });

    const rawQuestions = JSON.parse(response.text || "[]");
    const processedQuestions = rawQuestions.map((q: any, i: number) => ({
      ...q,
      id: `q-${Date.now()}-${i}`
    }));

    // Save to cache
    saveToCache(cacheKey, processedQuestions);
    return processedQuestions;

  } catch (error) {
    console.error("Failed to generate questions:", error);
    return [
      {
        id: "fallback",
        type: QuestionType.READING,
        question: "A friend asks: 'How is it going?' - What is a natural response?",
        options: ["I am going to school.", "Pretty good, thanks!", "Yes, it is going.", "I am 20 years old."],
        correctAnswer: "Pretty good, thanks!",
        explanation: "'Pretty good' is a common casual way to say you are fine.",
        vietnameseTranslation: "Một người bạn hỏi: 'How is it going?' - Câu trả lời tự nhiên là gì?"
      }
    ];
  }
};

export const generateLeaderboard = async (topicName: string): Promise<LeaderboardEntry[]> => {
  // Check cache first
  const cacheKey = `leaderboard_${topicName.replace(/\s+/g, '')}`;
  const cachedData = getFromCache<LeaderboardEntry[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              avatar: { type: Type.STRING },
              xp: { type: Type.INTEGER },
              country: { type: Type.STRING },
            },
            required: ["name", "avatar", "xp", "country"],
          },
        },
      },
      contents: `Generate a fictional list of 4 'competitors' who have recently completed the English learning stage: '${topicName}'.
      Use diverse international names.
      Assign XP between 500 and 5000.
      Use emojis for avatar and country flags.`,
    });
    
    const data = JSON.parse(response.text || "[]");
    const processedData = data.map((d: any, i: number) => ({ ...d, rank: i + 1 }));
    
    // Save to cache
    saveToCache(cacheKey, processedData);
    return processedData;

  } catch (error) {
    return [
      { rank: 1, name: "Sarah Smith", avatar: "👩‍🦰", xp: 4500, country: "🇺🇸" },
      { rank: 2, name: "Hiro Tanaka", avatar: "👨", xp: 4200, country: "🇯🇵" },
      { rank: 3, name: "Elena Rossi", avatar: "👩", xp: 3800, country: "🇮🇹" },
      { rank: 4, name: "Min-ho Kim", avatar: "👨‍🦱", xp: 3100, country: "🇰🇷" },
    ];
  }
}