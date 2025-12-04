import React, { useState, useEffect } from 'react';
import { GameState, Topic, PlayerStats, Question, Difficulty, UserProfile } from './types';
import { generateTopics, generateQuestions } from './services/geminiService';
import { MapScreen } from './components/MapScreen';
import { BattleScreen } from './components/BattleScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { Leaderboard } from './components/Leaderboard';
import { Button } from './components/Button';
import { Sword, Skull, Trophy, Loader2, Coins, Star, RefreshCw, Globe, User as UserIcon } from 'lucide-react';

const INITIAL_STATS: PlayerStats = {
  hp: 100,
  maxHp: 100,
  xp: 0,
  level: 1,
  gold: 0
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(INITIAL_STATS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [battleQuestions, setBattleQuestions] = useState<Question[]>([]);
  const [loadingText, setLoadingText] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoadingMoreTopics, setIsLoadingMoreTopics] = useState(false);

  // Initialize Game
  useEffect(() => {
    // Only fetch if we don't have topics
    if (topics.length === 0) {
      loadInitialWorld();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialWorld = async () => {
    setLoadingText("Generating World Map...");
    // Generate first 10 levels
    const worldTopics = await generateTopics(1, 10);
    if (worldTopics.length > 0) {
       worldTopics[0].isLocked = false; // Unlock first level
    }
    setTopics(worldTopics);
  };

  const loadMoreTopics = async () => {
    if (isLoadingMoreTopics) return;
    setIsLoadingMoreTopics(true);
    
    // Calculate where to start next batch
    const nextStartLevel = topics.length + 1;
    const newTopics = await generateTopics(nextStartLevel, 10);
    
    setTopics(prev => [...prev, ...newTopics]);
    setIsLoadingMoreTopics(false);
  };

  const handleStartClick = () => {
    if (!userProfile) {
      setGameState(GameState.PROFILE);
    } else {
      setGameState(GameState.MAP);
    }
  };

  const handleCreateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    setGameState(GameState.MAP);
  };

  const handleSelectTopic = async (topic: Topic) => {
    setCurrentTopic(topic);
    setBattleQuestions([]); // Clear previous questions immediately
    setGameState(GameState.LOADING_BATTLE);
    setLoadingText(`Preparing Challenge: ${topic.name}...`);
    
    // STRICT DIFFICULTY & QUESTION COUNT LOGIC
    let questionCount = 5; 
    if (topic.difficulty === Difficulty.MEDIUM) questionCount = 7;
    if (topic.difficulty === Difficulty.HARD) questionCount = 10;

    // Generate questions for this battle
    const questions = await generateQuestions(topic.name, topic.difficulty, questionCount);
    setBattleQuestions(questions);
    setGameState(GameState.BATTLE);
  };

  const handleVictory = () => {
    if (!currentTopic) return;

    // Calculate Rewards
    const xpGain = currentTopic.difficulty === Difficulty.HARD ? 150 : currentTopic.difficulty === Difficulty.MEDIUM ? 100 : 50;
    const goldGain = currentTopic.difficulty === Difficulty.HARD ? 100 : currentTopic.difficulty === Difficulty.MEDIUM ? 50 : 25;
    const levelUp = (playerStats.xp + xpGain) >= (playerStats.level * 150); // Harder to level up

    const newStats = {
      ...playerStats,
      xp: playerStats.xp + xpGain,
      gold: playerStats.gold + goldGain,
      level: levelUp ? playerStats.level + 1 : playerStats.level,
      maxHp: levelUp ? playerStats.maxHp + 20 : playerStats.maxHp,
      hp: levelUp ? playerStats.maxHp + 20 : playerStats.hp // Heal on level up
    };

    setPlayerStats(newStats);
    
    // Unlock next topic logic
    const currentIndex = topics.findIndex(t => t.id === currentTopic.id);
    
    if (currentIndex < topics.length - 1) {
      const newTopics = [...topics];
      newTopics[currentIndex + 1].isLocked = false;
      setTopics(newTopics);
      
      // Infinite Generation Trigger
      if (currentIndex >= topics.length - 3) {
        loadMoreTopics();
      }
    } else {
      loadMoreTopics().then(() => {
        setTopics(current => {
           const updated = [...current];
           if (updated[currentIndex + 1]) {
             updated[currentIndex + 1].isLocked = false;
           }
           return updated;
        });
      });
    }

    setGameState(GameState.VICTORY);
  };

  const handleDefeat = () => {
    setGameState(GameState.DEFEAT);
  };

  const handleReturnToMap = () => {
    // Heal player slightly for free upon returning
    setPlayerStats(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + 20)
    }));
    setGameState(GameState.MAP);
    setCurrentTopic(null);
  };

  const handleRestart = () => {
    if (window.confirm("Are you sure you want to reset all progress?")) {
      setPlayerStats(INITIAL_STATS);
      setGameState(GameState.HOME);
      setTopics([]); // Clear topics to force regenerate
      localStorage.clear(); // Clear all cache
      window.location.reload();
    }
  };

  // --- RENDER HELPERS ---

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-6 bg-gradient-to-b from-slate-900 to-indigo-950">
      <div className="mb-4 animate-bounce">
        <Sword size={64} className="text-yellow-400 mx-auto" />
      </div>
      <h1 className="text-5xl md:text-7xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg">
        LINGO QUEST
      </h1>
      <p className="text-xl text-slate-300 max-w-lg font-light leading-relaxed">
        Master English from A1 to C2. <br/>
        Reading • Listening • Speaking • Writing
      </p>
      {topics.length === 0 ? (
         <div className="flex flex-col items-center gap-4">
           <Loader2 className="animate-spin text-blue-400 w-8 h-8" />
           <p className="text-sm text-slate-500 animate-pulse">{loadingText || "Waking up the AI Game Master..."}</p>
         </div>
      ) : (
        <Button size="lg" onClick={handleStartClick} className="animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.6)]">
          {userProfile ? `Continue as ${userProfile.name}` : "Start Adventure"}
        </Button>
      )}
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
        <Loader2 className="w-16 h-16 text-blue-400 animate-spin relative z-10" />
      </div>
      <h2 className="mt-8 text-2xl font-pixel text-white text-center px-4">{loadingText}</h2>
      <p className="mt-2 text-slate-500">Generating unique challenges...</p>
    </div>
  );

  const renderVictory = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-green-900 to-slate-900 text-center p-8">
      <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
      <h2 className="text-5xl font-pixel text-white mb-4">VICTORY!</h2>
      <p className="text-xl text-green-300 mb-8">You conquered {currentTopic?.name}!</p>
      
      <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-sm">
        <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-center gap-2 border border-slate-700">
          <Star className="text-yellow-400" /> 
          <span className="font-bold">+{currentTopic?.difficulty === Difficulty.HARD ? 150 : 50} XP</span>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-center gap-2 border border-slate-700">
          <Coins className="text-yellow-600" />
          <span className="font-bold">+{currentTopic?.difficulty === Difficulty.HARD ? 100 : 20} Gold</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setShowLeaderboard(true)} variant="secondary" size="md">
           View Rank
        </Button>
        <Button onClick={handleReturnToMap} variant="success" size="lg">
           Continue Journey
        </Button>
      </div>
    </div>
  );

  const renderDefeat = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-red-900 to-slate-900 text-center p-8">
      <Skull className="w-24 h-24 text-gray-300 mb-6 animate-pulse" />
      <h2 className="text-5xl font-pixel text-red-500 mb-4">DEFEAT...</h2>
      <p className="text-xl text-gray-400 mb-8">The monster of {currentTopic?.name} was too strong.</p>
      <p className="text-sm text-gray-500 mb-8 max-w-md">Don't give up! Rest and try again to improve your score.</p>
      
      <Button onClick={handleReturnToMap} variant="primary" size="lg">Retreat to Map</Button>
    </div>
  );

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>

      {/* Header (visible on Map and Battle) */}
      {(gameState === GameState.MAP || gameState === GameState.BATTLE) && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-40 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-lg flex gap-4 pointer-events-auto">
             <div className="flex flex-col">
                <div className="flex items-center gap-1 text-xs text-slate-400 uppercase font-bold">
                   {userProfile?.avatar} {userProfile?.name}
                </div>
                <span className="font-pixel text-yellow-400">LVL {playerStats.level}</span>
             </div>
             <div className="h-full w-px bg-slate-700"></div>
             <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold">XP</span>
                <span className="font-mono text-blue-300">{playerStats.xp}</span>
             </div>
             <div className="h-full w-px bg-slate-700"></div>
             <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold">Gold</span>
                <div className="flex items-center gap-1">
                   <Coins size={14} className="text-yellow-600" />
                   <span className="font-mono text-yellow-200">{playerStats.gold}</span>
                </div>
             </div>
          </div>
          
          <div className="pointer-events-auto flex gap-2">
            {/* Leaderboard Toggle on Map */}
             {gameState === GameState.MAP && (
                <button 
                  onClick={() => setShowLeaderboard(true)}
                  className="bg-indigo-600 p-2 rounded-full hover:bg-indigo-500 transition-colors border border-indigo-400 shadow-lg"
                  title="Global Rankings"
                >
                  <Globe size={20} className="text-white" />
                </button>
             )}

             <button 
                onClick={handleRestart}
                className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-colors border border-slate-600"
                title="Restart Game"
              >
                <RefreshCw size={20} className="text-slate-400" />
             </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="h-full w-full pt-20 pb-4 px-4 relative">
        {gameState === GameState.HOME && renderHome()}
        {gameState === GameState.PROFILE && <ProfileScreen onProfileCreate={handleCreateProfile} />}
        {gameState === GameState.LOADING_BATTLE && renderLoading()}
        {gameState === GameState.MAP && (
          <MapScreen 
            topics={topics} 
            onSelectTopic={handleSelectTopic} 
            playerLevel={playerStats.level}
            isLoadingMore={isLoadingMoreTopics}
          />
        )}
        {gameState === GameState.BATTLE && currentTopic && (
          <BattleScreen 
            key={currentTopic.id + Date.now()} // Force remount on new battle
            topic={currentTopic}
            questions={battleQuestions}
            playerStats={playerStats}
            onVictory={handleVictory}
            onDefeat={handleDefeat}
            onUpdateStats={(newStats) => setPlayerStats(prev => ({ ...prev, ...newStats }))}
          />
        )}
        {gameState === GameState.VICTORY && renderVictory()}
        {gameState === GameState.DEFEAT && renderDefeat()}
      </main>
      
      {/* Global Leaderboard Overlay */}
      {showLeaderboard && userProfile && (
        <Leaderboard 
          topicName={currentTopic ? currentTopic.name : "Global Ranking"} 
          userProfile={userProfile}
          playerStats={playerStats}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}