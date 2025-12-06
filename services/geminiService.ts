import { GoogleGenAI, Type } from "@google/genai";
import { Location, InteractableItem, WordDetail, LeaderboardEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an English Learning Life Simulator engine. 
Your goal is to generate immersive daily life scenarios (home, street, school, work, shops, parks).
For every object in a scene, provide accurate English-Vietnamese translations, IPA pronunciation, and MULTIPLE practical usage patterns (sentences or phrases).
Format output strictly as JSON.`;

// Updated cache prefix to v2 to force regeneration with new data structure
const CACHE_PREFIX = 'lingolife_v2_';

const getFromCache = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    return item ? JSON.parse(item) : null;
  } catch (e) { return null; }
};

const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {}
};

const cleanJson = (text: string) => {
  return text.replace(/^```json\s*/, "").replace(/^```/, "").replace(/```$/, "").trim();
};

export const generateLocation = async (locationName: string): Promise<Location> => {
  const cacheKey = `loc_${locationName.toLowerCase().replace(/\s/g, '_')}`;
  const cached = getFromCache<Location>(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  emoji: { type: Type.STRING },
                  english: { type: Type.STRING },
                  vietnamese: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  type: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                  usagePatterns: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "3 distinct sentences or phrases using this word in daily life"
                  },
                  description: { type: Type.STRING }
                },
                required: ["name", "emoji", "english", "vietnamese", "pronunciation", "exampleSentence", "usagePatterns"]
              }
            },
            exits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  direction: { type: Type.STRING },
                  targetLocationName: { type: Type.STRING },
                  emoji: { type: Type.STRING }
                },
                required: ["direction", "targetLocationName"]
              }
            },
            theme: { type: Type.STRING, enum: ["bg-orange-50", "bg-blue-50", "bg-green-50", "bg-slate-50", "bg-yellow-50", "bg-pink-50", "bg-indigo-50"] }
          },
          required: ["description", "items", "exits", "theme"]
        }
      },
      contents: `Generate a location named "${locationName}".
      1. Description: Vivid, 1 sentence.
      2. Items: List 15-20 distinct objects/people/details visible here. High density for learning.
         - 'english': The word.
         - 'vietnamese': Accurate Vietnamese meaning.
         - 'pronunciation': IPA format.
         - 'usagePatterns': Provide 3 different common sentences using this word.
      3. Exits: List 3-5 logical places. Encourage diversity (e.g., if in Kitchen -> Garden, Dining Room, Backyard; if in Street -> Cafe, Bus Station, Park).
      `,
    });

    const data = JSON.parse(cleanJson(response.text || "{}"));

    const location: Location = {
      id: locationName,
      name: locationName,
      description: data.description,
      backgroundTheme: data.theme || "bg-slate-50",
      items: (data.items || []).map((item: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        name: item.name,
        emoji: item.emoji || "📦",
        isCollected: false,
        wordDetail: {
          english: item.english,
          vietnamese: item.vietnamese,
          pronunciation: item.pronunciation,
          type: item.type || "noun",
          exampleSentence: item.exampleSentence, // Keep for fallback
          usagePatterns: item.usagePatterns && item.usagePatterns.length > 0 
            ? item.usagePatterns 
            : [item.exampleSentence],
          description: item.description || `A common ${item.english}.`
        }
      })),
      exits: data.exits || []
    };

    saveToCache(cacheKey, location);
    return location;

  } catch (error) {
    console.error(error);
    // Fallback location
    return {
      id: locationName,
      name: locationName,
      description: "You are in a quiet place, but the details are blurry.",
      items: [],
      exits: [{ direction: "Go Back", targetLocationName: "Bedroom", emoji: "🔙" }],
      backgroundTheme: "bg-gray-100"
    };
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
              country: { type: Type.STRING },
              xp: { type: Type.INTEGER },
              avatar: { type: Type.STRING }
            },
            required: ["name", "country", "xp", "avatar"]
          }
        }
      },
      contents: `Generate a fake leaderboard of 5 players for the topic "${topicName}".
      Return a JSON array where each item has:
      - name: A user nickname.
      - country: A country flag emoji.
      - xp: A random integer between 1000 and 5000.
      - avatar: A face emoji.
      `
    });

    const data = JSON.parse(cleanJson(response.text || "[]"));
    return data.map((item: any, index: number) => ({
      rank: index + 1,
      name: item.name,
      avatar: item.avatar || "👤",
      xp: item.xp,
      country: item.country || "🏳️"
    }));
  } catch (error) {
    console.error("Failed to generate leaderboard:", error);
    // Fallback data
    return [
      { rank: 1, name: "LanguageMaster", avatar: "🧠", xp: 4500, country: "🇺🇸" },
      { rank: 2, name: "PolyglotPro", avatar: "🦁", xp: 4100, country: "🇬🇧" },
      { rank: 3, name: "WordWizard", avatar: "🧙‍♂️", xp: 3800, country: "🇨🇦" },
      { rank: 4, name: "VocabViking", avatar: "⚔️", xp: 3200, country: "🇳🇴" },
      { rank: 5, name: "GrammarGuru", avatar: "📚", xp: 2900, country: "🇦🇺" }
    ];
  }
};