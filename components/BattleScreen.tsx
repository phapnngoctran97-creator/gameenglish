import React, { useState, useEffect } from 'react';
import { Question, PlayerStats, Topic } from '../types';
import { Button } from './Button';
import { Heart, Shield, Sparkles, Brain } from 'lucide-react';

interface BattleScreenProps {
  topic: Topic;
  questions: Question[];
  playerStats: PlayerStats;
  onVictory: () => void;
  onDefeat: () => void;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({ 
  topic, 
  questions, 
  playerStats, 
  onVictory, 
  onDefeat,
  onUpdateStats
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [monsterHp, setMonsterHp] = useState(100);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [feedback, setFeedback] = useState<{isCorrect: boolean, text: string} | null>(null);
  const [shake, setShake] = useState(false);

  // Monster stats derived from difficulty
  const damageToPlayer = topic.difficulty === 'Hard' ? 25 : topic.difficulty === 'Medium' ? 15 : 10;
  const damageToMonster = Math.ceil(100 / questions.length);

  const currentQ = questions[currentQuestionIndex];

  const handleOptionClick = (option: string) => {
    if (isAnswering) return;
    setSelectedOption(option);
    setIsAnswering(true);

    const isCorrect = option === currentQ.correctAnswer;

    if (isCorrect) {
      setFeedback({ isCorrect: true, text: "Excellent! Direct Hit!" });
      const newMonsterHp = Math.max(0, monsterHp - damageToMonster);
      setMonsterHp(newMonsterHp);
      
      if (newMonsterHp === 0) {
        setTimeout(onVictory, 1500);
      } else {
        setTimeout(nextTurn, 2000);
      }
    } else {
      setFeedback({ 
        isCorrect: false, 
        text: `Missed! Correct: ${currentQ.correctAnswer}. ${currentQ.explanation}` 
      });
      setShake(true);
      setTimeout(() => setShake(false), 500);

      const newPlayerHp = Math.max(0, playerStats.hp - damageToPlayer);
      onUpdateStats({ hp: newPlayerHp });

      if (newPlayerHp === 0) {
        setTimeout(onDefeat, 2000);
      } else {
        setTimeout(nextTurn, 3000); // Longer delay for wrong answer to read explanation
      }
    }
  };

  const nextTurn = () => {
    setIsAnswering(false);
    setSelectedOption(null);
    setFeedback(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // If we ran out of questions but monster is alive (unlikely due to math, but safe fallback)
      if (monsterHp > 0) {
        // Simple sudden death logic or just win
        onVictory(); 
      }
    }
  };

  return (
    <div className={`flex flex-col h-full w-full max-w-5xl mx-auto p-4 ${shake ? 'animate-shake' : ''}`}>
      
      {/* Top Bar: HUD */}
      <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-xl border-b-4 border-slate-700 shadow-xl">
        {/* Player Stats */}
        <div className="flex flex-col w-1/3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-pixel text-blue-400">HERO</span>
            <span className="text-xs text-slate-400">LVL {playerStats.level}</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4 border border-slate-600">
            <div 
              className="bg-green-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-300 mt-1">
            <Heart size={12} className="fill-current" /> {playerStats.hp}/{playerStats.maxHp}
          </div>
        </div>

        <div className="text-center">
            <span className="font-pixel text-yellow-500 text-lg">VS</span>
        </div>

        {/* Monster Stats */}
        <div className="flex flex-col w-1/3 items-end">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-pixel text-red-400">MONSTER</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4 border border-slate-600">
            <div 
              className="bg-red-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${monsterHp}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-1 text-xs text-red-300 mt-1">
             {monsterHp}% <Shield size={12} className="fill-current" />
          </div>
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="flex-1 flex flex-col justify-center items-center relative mb-6">
        {/* Visual Representations */}
        <div className="flex justify-between w-full px-12 mb-8 items-end h-40">
            <div className="text-6xl filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transform scale-x-[-1]">
                🧙‍♂️
            </div>
            
            {/* Projectile Animation could go here */}

            <div className={`text-8xl transition-transform duration-300 ${isAnswering && feedback?.isCorrect ? 'opacity-50 scale-90 grayscale' : 'animate-bounce-slow'}`}>
                {topic.difficulty === 'Hard' ? '🐉' : topic.difficulty === 'Medium' ? '👹' : '👾'}
            </div>
        </div>

        {/* Question Card */}
        <div className="w-full bg-slate-800 rounded-xl p-6 border-2 border-indigo-500 shadow-2xl relative">
            <div className="absolute -top-3 left-6 bg-indigo-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-white shadow-sm">
                Question {currentQuestionIndex + 1}/{questions.length}
            </div>
            
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-relaxed">
                {currentQ.question}
            </h3>
            {currentQ.vietnameseTranslation && (
                <p className="text-slate-400 text-sm italic mb-6 border-l-2 border-slate-600 pl-3">
                    Hint: {currentQ.vietnameseTranslation}
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ.options.map((option, idx) => {
                    let btnVariant: 'primary' | 'success' | 'danger' | 'secondary' = 'secondary';
                    
                    if (isAnswering) {
                        if (option === currentQ.correctAnswer) btnVariant = 'success';
                        else if (option === selectedOption) btnVariant = 'danger';
                        else btnVariant = 'secondary';
                    }

                    return (
                        <Button
                            key={idx}
                            variant={btnVariant}
                            className="w-full text-left flex items-center justify-between"
                            onClick={() => handleOptionClick(option)}
                            disabled={isAnswering}
                        >
                            <span>{option}</span>
                            {isAnswering && option === currentQ.correctAnswer && <Sparkles size={16} />}
                        </Button>
                    );
                })}
            </div>

            {/* Feedback Overlay */}
            {feedback && (
                <div className={`mt-4 p-3 rounded-lg text-center font-bold border-2 ${feedback.isCorrect ? 'bg-green-900/50 border-green-500 text-green-300' : 'bg-red-900/50 border-red-500 text-red-300'}`}>
                    {feedback.text}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};