import React, { useState, useEffect, useRef } from 'react';
import { Question, PlayerStats, Topic, Difficulty, QuestionType } from '../types';
import { Button } from './Button';
import { Heart, Shield, Sparkles, Volume2, Mic, MicOff, Keyboard, Clock } from 'lucide-react';

interface BattleScreenProps {
  topic: Topic;
  questions: Question[];
  playerStats: PlayerStats;
  onVictory: () => void;
  onDefeat: () => void;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
}

// Extend window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
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
  
  // Game State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [feedback, setFeedback] = useState<{isCorrect: boolean, text: string} | null>(null);
  const [shake, setShake] = useState(false);

  // Timer State
  const getTimerDuration = () => {
    switch(topic.difficulty) {
      case Difficulty.HARD: return 30;
      case Difficulty.MEDIUM: return 40;
      default: return 60;
    }
  };
  const [timeLeft, setTimeLeft] = useState(getTimerDuration());

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const currentQ = questions[currentQuestionIndex];
  const damageToPlayer = topic.difficulty === Difficulty.HARD ? 25 : topic.difficulty === Difficulty.MEDIUM ? 15 : 10;
  const damageToMonster = Math.ceil(100 / questions.length);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (isAnswering || feedback) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      // Time's up!
      handleWrongAnswer("Time's up!");
    }
  }, [timeLeft, isAnswering, feedback]);

  // Reset timer on new question
  useEffect(() => {
    setTimeLeft(getTimerDuration());
    setWrittenAnswer("");
    setIsListening(false);
  }, [currentQuestionIndex]);

  // --- TTS LOGIC ---
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- SPEECH RECOGNITION LOGIC ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      checkAnswer(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- ANSWER HANDLING ---
  
  const checkAnswer = (userAnswer: string) => {
    if (isAnswering) return;
    setIsAnswering(true);
    setSelectedOption(userAnswer); // For visual consistency

    // Normalize comparison (remove punctuation, lowercase)
    const normalize = (str: string) => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim();
    const isCorrect = normalize(userAnswer) === normalize(currentQ.correctAnswer);

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer(`Correct answer: ${currentQ.correctAnswer}`);
    }
  };

  const handleCorrectAnswer = () => {
    setFeedback({ isCorrect: true, text: "Excellent! Direct Hit!" });
    // Play sound effect?
    const newMonsterHp = Math.max(0, monsterHp - damageToMonster);
    setMonsterHp(newMonsterHp);
    
    if (newMonsterHp === 0) {
      setTimeout(onVictory, 1500);
    } else {
      setTimeout(nextTurn, 2000);
    }
  };

  const handleWrongAnswer = (detail: string) => {
    setFeedback({ 
      isCorrect: false, 
      text: `Missed! ${detail}. ${currentQ.explanation}` 
    });
    setShake(true);
    setTimeout(() => setShake(false), 500);

    const newPlayerHp = Math.max(0, playerStats.hp - damageToPlayer);
    onUpdateStats({ hp: newPlayerHp });

    if (newPlayerHp === 0) {
      setTimeout(onDefeat, 2000);
    } else {
      setTimeout(nextTurn, 3500); // Longer delay to read explanation
    }
  };

  const nextTurn = () => {
    setIsAnswering(false);
    setSelectedOption(null);
    setFeedback(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (monsterHp > 0) onVictory(); 
    }
  };

  // --- RENDER COMPONENT ---

  const renderQuestionContent = () => {
    switch (currentQ.type) {
      case QuestionType.SPEAKING:
        return (
          <div className="flex flex-col items-center gap-6 py-4">
            <p className="text-xl text-yellow-300 font-bold">" {currentQ.correctAnswer} "</p>
            <button
              onClick={startListening}
              disabled={isAnswering}
              className={`
                w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-xl transition-all
                ${isListening 
                  ? 'bg-red-500 border-red-700 animate-pulse scale-110' 
                  : 'bg-blue-600 border-blue-800 hover:bg-blue-500'
                }
              `}
            >
              {isListening ? <MicOff size={40} /> : <Mic size={40} />}
            </button>
            <p className="text-sm text-slate-400">
              {isListening ? "Listening..." : "Tap mic and read the phrase aloud"}
            </p>
          </div>
        );

      case QuestionType.WRITING:
        return (
          <div className="flex flex-col gap-4 py-4">
            <input
              type="text"
              value={writtenAnswer}
              onChange={(e) => setWrittenAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkAnswer(writtenAnswer)}
              placeholder="Type your answer here..."
              disabled={isAnswering}
              className="w-full bg-slate-700 border-2 border-slate-500 rounded-lg p-4 text-white text-lg focus:border-blue-500 focus:outline-none"
              autoFocus
            />
             <Button onClick={() => checkAnswer(writtenAnswer)} disabled={!writtenAnswer || isAnswering} className="self-end">
               Submit Answer <Keyboard size={16} className="ml-2 inline" />
             </Button>
          </div>
        );

      case QuestionType.LISTENING:
      case QuestionType.READING:
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {currentQ.options?.map((option, idx) => {
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
                        onClick={() => checkAnswer(option)}
                        disabled={isAnswering}
                    >
                        <span>{option}</span>
                        {isAnswering && option === currentQ.correctAnswer && <Sparkles size={16} />}
                    </Button>
                );
            })}
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full w-full max-w-5xl mx-auto p-4 ${shake ? 'animate-shake' : ''}`}>
      
      {/* Top Bar: HUD */}
      <div className="flex justify-between items-center mb-4 bg-slate-800 p-4 rounded-xl border-b-4 border-slate-700 shadow-xl relative overflow-hidden">
        {/* Timer Bar Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
             <div className="h-full bg-red-600 transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / getTimerDuration()) * 100}%` }}></div>
        </div>

        {/* Player Stats */}
        <div className="flex flex-col w-1/3 z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-pixel text-blue-400">HERO</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4 border border-slate-600">
            <div 
              className="bg-green-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-300 mt-1">
            <Heart size={12} className="fill-current" /> {playerStats.hp} HP
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center z-10 flex flex-col items-center">
             <div className={`font-pixel text-2xl ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {timeLeft}s
             </div>
             <Clock size={16} className="text-slate-400" />
        </div>

        {/* Monster Stats */}
        <div className="flex flex-col w-1/3 items-end z-10">
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
        <div className="flex justify-between w-full px-12 mb-4 items-end h-32 md:h-40">
            <div className="text-6xl filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transform scale-x-[-1]">
                🧙‍♂️
            </div>
            
            <div className={`text-8xl transition-transform duration-300 ${isAnswering && feedback?.isCorrect ? 'opacity-50 scale-90 grayscale' : 'animate-bounce-slow'}`}>
                {topic.difficulty === Difficulty.HARD ? '🐉' : topic.difficulty === Difficulty.MEDIUM ? '👹' : '👾'}
            </div>
        </div>

        {/* Question Card */}
        <div className="w-full bg-slate-800 rounded-xl p-6 border-2 border-indigo-500 shadow-2xl relative">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-white shadow-sm">
                    {currentQ.type} CHALLENGE • {currentQuestionIndex + 1}/{questions.length}
                </div>
                
                {/* TTS Button */}
                <button 
                  onClick={() => speakText(currentQ.listeningText || currentQ.question)}
                  className="bg-slate-700 hover:bg-slate-600 p-2 rounded-full transition-colors border border-slate-500"
                  title="Read Aloud"
                >
                  <Volume2 size={20} className="text-blue-300" />
                </button>
            </div>
            
            {/* Listening specific UI */}
            {currentQ.type === QuestionType.LISTENING && (
               <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800 mb-4 flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-full animate-pulse">
                     <Volume2 size={24} className="text-white" />
                  </div>
                  <span className="text-blue-200 text-sm italic">Listen to the audio, then answer the question.</span>
                  <Button size="sm" onClick={() => speakText(currentQ.listeningText || "")}>Play Audio</Button>
               </div>
            )}

            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-relaxed">
                {currentQ.question}
            </h3>
            
            {currentQ.vietnameseTranslation && (
                <p className="text-slate-400 text-sm italic mb-4 border-l-2 border-slate-600 pl-3">
                    Hint: {currentQ.vietnameseTranslation}
                </p>
            )}

            {/* Render Input Method based on Type */}
            {renderQuestionContent()}

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