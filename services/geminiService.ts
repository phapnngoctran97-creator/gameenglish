import { GoogleGenAI, Type } from "@google/genai";
import { Topic, Question, Difficulty, LeaderboardEntry } from "../types";

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

export const generateTopics = async (startLevel: number = 1, count: number = 10): Promise<Topic[]> => {
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
    
    return rawTopics.map((t: any, index: number) => ({
      ...t,
      id: `topic-${startLevel + index}`,
      levelNumber: startLevel + index,
      difficulty: startLevel > 70 ? Difficulty.HARD : startLevel > 30 ? Difficulty.MEDIUM : Difficulty.EASY,
      isLocked: true, // Will be handled by App logic
      chapterName: currentTheme
    }));
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
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                minItems: 4,
                maxItems: 4
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING, description: "Explain why this is the correct choice in a conversation." },
              vietnameseTranslation: { type: Type.STRING, description: "Translation of the question to help understanding." }
            },
            required: ["question", "options", "correctAnswer", "explanation"],
          },
        },
      },
      contents: `Generate 5 multiple-choice questions for the location '${topicName}' (Difficulty: ${difficulty}).
      
      CRITICAL: The questions must focus on PRACTICAL COMMUNICATION and REAL-LIFE VOCABULARY.
      
      Types of questions to include:
      1. Situational Response (e.g., "Someone says 'How do you do?', you reply: ...")
      2. Missing Word in Dialogue (e.g., "I would like to ___ a table for two.")
      3. Practical Vocabulary (e.g., Which word describes a person who talks a lot?)
      
      Ensure the 'options' are distinct.
      Include a clear Vietnamese translation/hint for the learner.`,
    });

    const rawQuestions = JSON.parse(response.text || "[]");
    return rawQuestions.map((q: any, i: number) => ({
      ...q,
      id: `q-${Date.now()}-${i}`
    }));
  } catch (error) {
    console.error("Failed to generate questions:", error);
    return [
      {
        id: "fallback",
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
    return data.map((d: any, i: number) => ({ ...d, rank: i + 1 }));
  } catch (error) {
    return [
      { rank: 1, name: "Sarah Smith", avatar: "👩‍🦰", xp: 4500, country: "🇺🇸" },
      { rank: 2, name: "Hiro Tanaka", avatar: "👨", xp: 4200, country: "🇯🇵" },
      { rank: 3, name: "Elena Rossi", avatar: "👩", xp: 3800, country: "🇮🇹" },
      { rank: 4, name: "Min-ho Kim", avatar: "👨‍🦱", xp: 3100, country: "🇰🇷" },
    ];
  }
}