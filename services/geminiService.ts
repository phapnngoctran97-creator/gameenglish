import { GoogleGenAI, Type } from "@google/genai";
import { Topic, Question, Difficulty, LeaderboardEntry, QuestionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are a strict and professional English Tutor RPG Game Master.
Your goal is to challenge the user based on specific CEFR levels.
- EASY MODE: CEFR A1-A2 (Basic vocabulary, simple sentences, slow speech).
- MEDIUM MODE: CEFR B1-B2 (Conversational, idioms, normal speed).
- HARD MODE: CEFR C1-C2 (Advanced vocabulary, nuanced grammar, abstract topics).

Always format the output as valid JSON.`;

// Themes for every 10 levels to ensure variety
const WORLD_THEMES = [
  "Village of Beginnings (Daily Basics)",       // 1-10
  "Forest of Family & Roots",                   // 11-20
  "Market City (Shopping & Food)",              // 21-30
  "Port of Travelers (Directions)",             // 31-40
  "Valley of Vitality (Health)",                // 41-50
  "Tower of Commerce (Work)",                   // 51-60
  "Ocean of Emotions (Feelings)",               // 61-70
  "Cyber Citadel (Technology)",                 // 71-80
  "Senate of Debate (Advanced)",                // 91-100
  "Summit of Mastery (Literature)"              // 100+
];

// --- CACHING SYSTEM ---
const CACHE_PREFIX = 'lingoquest_v6_'; // Bumped version

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
  const cacheKey = `topics_${startLevel}_${count}`;
  const cachedData = getFromCache<Topic[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const themeIndex = Math.min(Math.floor((startLevel - 1) / 10), WORLD_THEMES.length - 1);
    const currentTheme = WORLD_THEMES[themeIndex];
    
    let difficultyLabel = Difficulty.EASY;
    if (startLevel > 20) difficultyLabel = Difficulty.MEDIUM;
    if (startLevel > 50) difficultyLabel = Difficulty.HARD;

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
              icon: { type: Type.STRING, description: "A single emoji representing the location" },
            },
            required: ["name", "description", "icon"],
          },
        },
      },
      contents: `Generate ${count} RPG locations for levels ${startLevel}-${startLevel + count - 1}.
      THEME: "${currentTheme}".
      DIFFICULTY: ${difficultyLabel}.
      
      Names should be creative (e.g., 'Cave of Verbs', 'Market of Bargains').
      Return strictly JSON.`,
    });

    const rawTopics = JSON.parse(response.text || "[]");
    
    const processedTopics = rawTopics.map((t: any, index: number) => ({
      ...t,
      id: `topic-${startLevel + index}`,
      levelNumber: startLevel + index,
      difficulty: startLevel > 50 ? Difficulty.HARD : startLevel > 20 ? Difficulty.MEDIUM : Difficulty.EASY,
      isLocked: true, 
      chapterName: currentTheme
    }));

    saveToCache(cacheKey, processedTopics);
    return processedTopics;

  } catch (error) {
    console.error("Failed to generate topics:", error);
    return Array.from({ length: count }).map((_, i) => ({
      id: `fallback-${startLevel + i}`,
      name: `Zone ${startLevel + i}`,
      description: "A mysterious place.",
      difficulty: Difficulty.EASY,
      icon: "📍",
      isLocked: true,
      levelNumber: startLevel + i,
      chapterName: "Unknown"
    }));
  }
};

export const generateQuestions = async (topicName: string, difficulty: Difficulty, count: number): Promise<Question[]> => {
  // NOTE: REMOVED CACHING FOR QUESTIONS to ensure variety every time.
  
  try {
    // Exact distribution logic
    const readingCount = Math.max(1, Math.floor(count * 0.3)); // 30%
    const listeningCount = Math.max(1, Math.floor(count * 0.3)); // 30%
    const speakingCount = Math.max(1, Math.floor(count * 0.2)); // 20%
    const writingCount = count - readingCount - listeningCount - speakingCount; // Remainder (approx 20%)

    const cefrLevel = difficulty === Difficulty.HARD ? "C1 (Advanced)" : difficulty === Difficulty.MEDIUM ? "B1 (Intermediate)" : "A1 (Beginner)";
    const randomSeed = Date.now(); // Ensure unique prompt every time

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
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              listeningText: { type: Type.STRING },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              vietnameseTranslation: { type: Type.STRING }
            },
            required: ["type", "question", "correctAnswer", "explanation"],
          },
        },
      },
      contents: `Generate EXACTLY ${count} English questions for '${topicName}'.
      Target CEFR Level: ${cefrLevel}.
      Random Seed: ${randomSeed}.
      
      STRICT DISTRIBUTION:
      - ${readingCount} questions of type READING (Multiple choice).
      - ${listeningCount} questions of type LISTENING (Text to be read by AI, then user answers).
      - ${speakingCount} questions of type SPEAKING (User must read a sentence aloud).
      - ${writingCount} questions of type WRITING (User must translate or fill blank).

      SORT ORDER:
      Start with Reading/Listening (Easier) -> End with Speaking/Writing (Harder).
      
      IMPORTANT:
      - For LISTENING: 'listeningText' MUST be provided.
      - For SPEAKING: 'correctAnswer' is the sentence to read.
      - Provide 4 options for READING/LISTENING.
      `,
    });

    const rawQuestions = JSON.parse(response.text || "[]");
    
    // Fallback if AI generates fewer questions than requested
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      throw new Error("Invalid questions generated");
    }

    const processedQuestions = rawQuestions.map((q: any, i: number) => ({
      ...q,
      id: `q-${randomSeed}-${i}`
    }));

    return processedQuestions;

  } catch (error) {
    console.error("Failed to generate questions:", error);
    // Robust fallback that ensures we return 'count' items
    return Array.from({ length: count }).map((_, i) => ({
      id: `fallback-${Date.now()}-${i}`,
      type: QuestionType.READING,
      question: `Fallback Question ${i + 1}: Choose the correct greeting.`,
      options: ["Hello", "Goodbye", "Apple", "Blue"],
      correctAnswer: "Hello",
      explanation: "This is a fallback question because the AI service was interrupted.",
      vietnameseTranslation: "Chọn lời chào đúng."
    }));
  }
};

export const generateLeaderboard = async (topicName: string): Promise<LeaderboardEntry[]> => {
  const cacheKey = `leaderboard_${topicName.replace(/\s+/g, '')}`;
  const cachedData = getFromCache<LeaderboardEntry[]>(cacheKey);
  if (cachedData) return cachedData;

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
      contents: `Generate 5 fictional competitors for leaderboard. High scores.`,
    });
    
    const data = JSON.parse(response.text || "[]");
    const processedData = data.map((d: any, i: number) => ({ ...d, rank: i + 1 }));
    saveToCache(cacheKey, processedData);
    return processedData;
  } catch (error) {
    return [];
  }
}