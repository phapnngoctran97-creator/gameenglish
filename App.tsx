import React, { useState, useEffect } from 'react';
import { GameState, Location, InteractableItem } from './types';
import { generateLocation } from './services/geminiService';
import { SceneView } from './components/SceneView';
import { ObjectDetail } from './components/ObjectDetail';
import { Notebook } from './components/BattleScreen'; // Reused as Notebook
import { Loader2, Home, Book, Globe } from 'lucide-react';
import { Button } from './components/Button';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [currentLocationId, setCurrentLocationId] = useState("My Bedroom");
  const [currentLocationData, setCurrentLocationData] = useState<Location | null>(null);
  const [selectedItem, setSelectedItem] = useState<InteractableItem | null>(null);
  
  const [collectedVocabulary, setCollectedVocabulary] = useState<InteractableItem[]>([]);
  const [visitedLocations, setVisitedLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load Initial Location
  useEffect(() => {
    if (gameState === GameState.EXPLORING) {
      loadLocation(currentLocationId);
    }
  }, [gameState, currentLocationId]);

  const loadLocation = async (id: string) => {
    setIsLoading(true);
    
    // Check if we visited this place before (optional optimization: use cached version from visitedLocations)
    // For now, we regenerate/fetch to ensure freshness or use the service cache
    const data = await generateLocation(id);
    setCurrentLocationData(data);
    
    // Add to history if not already there
    setVisitedLocations(prev => {
      if (prev.find(loc => loc.id === data.id)) return prev;
      return [data, ...prev]; // Newest first
    });

    setIsLoading(false);
  };

  const handleStart = () => {
    setGameState(GameState.EXPLORING);
  };

  const handleGoHome = () => {
    setGameState(GameState.HOME);
    setCurrentLocationId("My Bedroom"); // Optional: Reset or keep last location
  };

  const handleNavigate = (targetId: string) => {
    setCurrentLocationId(targetId);
  };

  const handleItemClick = (item: InteractableItem) => {
    setSelectedItem(item);
    setGameState(GameState.EXAMINING);
    
    // Add to notebook if new
    setCollectedVocabulary(prev => {
      if (prev.find(i => i.wordDetail.english === item.wordDetail.english)) return prev;
      return [...prev, item];
    });
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setGameState(GameState.EXPLORING);
  };

  // --- RENDER ---

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      <div className="bg-white/20 p-6 rounded-full mb-6 backdrop-blur animate-pulse">
         <Globe size={64} className="text-white" />
      </div>
      <h1 className="text-4xl md:text-6xl font-pixel mb-4 drop-shadow-md">LingoLife</h1>
      <p className="text-lg md:text-xl opacity-90 mb-8 max-w-md">
        Explore a living world, touch everything, and learn English naturally.
      </p>
      <Button onClick={handleStart} size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl border-0 text-lg px-12 py-4">
        Wake Up
      </Button>
      
      {/* Disclaimer regarding API Key */}
      <p className="mt-8 text-xs text-indigo-200 max-w-xs">
        Powered by Gemini 2.5 Flash.
      </p>
    </div>
  );

  return (
    <div className="w-full h-screen bg-slate-50 font-sans overflow-hidden relative flex flex-col">
      
      {gameState === GameState.HOME && renderHome()}

      {(gameState === GameState.EXPLORING || gameState === GameState.EXAMINING) && (
        <>
          {/* Main View Area */}
          <div className="flex-1 overflow-hidden relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-50">
                <Loader2 className="animate-spin text-indigo-600 w-12 h-12 mb-4" />
                <p className="text-slate-500 font-pixel animate-pulse">Traveling to {currentLocationId}...</p>
              </div>
            ) : currentLocationData ? (
              <SceneView 
                location={currentLocationData} 
                onItemClick={handleItemClick}
                onNavigate={handleNavigate}
                onGoHome={handleGoHome}
              />
            ) : null}
          </div>

          {/* Bottom Navigation Bar */}
          <div className="bg-white border-t border-slate-200 p-2 flex justify-around items-center z-40 pb-safe">
             <button 
               className="flex flex-col items-center p-2 text-indigo-600"
               onClick={() => setGameState(GameState.EXPLORING)}
             >
                <Home size={24} />
                <span className="text-[10px] font-bold uppercase mt-1">Explore</span>
             </button>
             
             <div className="w-px h-8 bg-slate-200"></div>

             <button 
               className="flex flex-col items-center p-2 text-slate-500 hover:text-indigo-600 transition-colors"
               onClick={() => setGameState(GameState.NOTEBOOK)}
             >
                <Book size={24} />
                <span className="text-[10px] font-bold uppercase mt-1">Journal</span>
             </button>
          </div>
        </>
      )}

      {gameState === GameState.EXAMINING && selectedItem && (
        <ObjectDetail item={selectedItem} onClose={closeDetail} />
      )}

      {gameState === GameState.NOTEBOOK && (
        <div className="absolute inset-0 z-50">
          <Notebook 
            collectedItems={collectedVocabulary} 
            visitedLocations={visitedLocations}
            onClose={() => setGameState(GameState.EXPLORING)} 
          />
        </div>
      )}

    </div>
  );
}