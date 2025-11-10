'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Zap, Volume2, VolumeX } from 'lucide-react';

const GRID_SIZE = 3;
const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500',
  'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
  'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'
];

const FREQUENCIES = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33];

type GameState = 'idle' | 'playing' | 'watching' | 'gameover';

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

const SimonSays = () => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      loadLeaderboard();
    }
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const loadLeaderboard = () => {
    try {
      const leaderboardData = localStorage.getItem('simonSaysLeaderboard');
      const scores: LeaderboardEntry[] = leaderboardData ? JSON.parse(leaderboardData) : [];
      const validScores = scores.sort((a, b) => b.score - a.score).slice(0, 10);
      setLeaderboard(validScores);
      if (validScores.length > 0) {
        setHighScore(validScores[0].score);
      }
    } catch (error) {
      console.log('Leaderboard not available');
    }
  };

  const playSound = (index: number) => {
    if (!soundEnabled || !audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.value = FREQUENCIES[index];
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.3);
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + 0.3);
  };

  const playErrorSound = () => {
    if (!soundEnabled || !audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.value = 100;
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.5);
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + 0.5);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setSequence([]);
    setPlayerSequence([]);
    nextRound([]);
  };

  const nextRound = (currentSequence: number[]) => {
    const newCell = Math.floor(Math.random() * 9);
    const newSequence = [...currentSequence, newCell];
    setSequence(newSequence);
    setPlayerSequence([]);
    playSequence(newSequence);
  };

  const playSequence = async (seq: number[]) => {
    setIsPlaying(true);
    setGameState('watching');
    
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setActiveCell(seq[i]);
      playSound(seq[i]);
      await new Promise(resolve => setTimeout(resolve, 400));
      setActiveCell(null);
    }
    
    setIsPlaying(false);
    setGameState('playing');
  };

  const handleCellClick = (index: number) => {
    if (isPlaying || gameState !== 'playing') return;

    playSound(index);
    setActiveCell(index);
    setTimeout(() => setActiveCell(null), 200);

    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);

    if (sequence[newPlayerSequence.length - 1] !== index) {
      playErrorSound();
      setGameState('gameover');
      if (score > 0) {
        setShowNameInput(true);
      }
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(() => nextRound(sequence), 1000);
    }
  };

  const saveScore = () => {
    if (!playerName.trim()) return;
    
    try {
      const scoreData: LeaderboardEntry = {
        name: playerName.trim(),
        score: score,
        date: new Date().toISOString()
      };
      
      // Get existing scores or initialize empty array
      const existingData = localStorage.getItem('simonSaysLeaderboard');
      const scores: LeaderboardEntry[] = existingData ? JSON.parse(existingData) : [];
      
      // Add new score
      scores.push(scoreData);
      
      // Sort scores and keep top 10
      const updatedScores = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      // Save back to localStorage
      localStorage.setItem('simonSaysLeaderboard', JSON.stringify(updatedScores));
      
      loadLeaderboard();
      setShowNameInput(false);
      setPlayerName('');
    } catch (error) {
      console.log('Could not save score');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Zap className="text-yellow-400" size={48} />
            Simon Says
            <Zap className="text-yellow-400" size={48} />
          </h1>
          <p className="text-purple-200 text-lg">Watch the pattern and repeat it!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="text-white">
                <div className="text-sm text-purple-200">Current Score</div>
                <div className="text-4xl font-bold flex items-center gap-2">
                  <Star className="text-yellow-400" size={32} />
                  {score}
                </div>
              </div>
              <div className="text-white text-right">
                <div className="text-sm text-purple-200">High Score</div>
                <div className="text-3xl font-bold text-yellow-400">{highScore}</div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition"
              >
                {soundEnabled ? <Volume2 className="text-white" /> : <VolumeX className="text-white" />}
              </button>
            </div>

            {gameState === 'watching' && (
              <div className="text-center mb-4 text-yellow-300 font-semibold text-lg animate-pulse">
                👀 Watch carefully...
              </div>
            )}

            {gameState === 'playing' && !isPlaying && (
              <div className="text-center mb-4 text-green-300 font-semibold text-lg animate-pulse">
                🎯 Your turn!
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-6">
              {Array.from({ length: 9 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  disabled={isPlaying || gameState !== 'playing'}
                  className={`
                    aspect-square rounded-2xl ${COLORS[index]} 
                    transition-all duration-200 transform
                    ${activeCell === index ? 'scale-95 brightness-150 shadow-2xl' : 'brightness-75'}
                    ${!isPlaying && gameState === 'playing' ? 'hover:brightness-100 hover:scale-105 cursor-pointer' : 'cursor-not-allowed'}
                    disabled:opacity-50 shadow-lg
                  `}
                />
              ))}
            </div>

            {gameState === 'idle' && (
              <button
                onClick={startGame}
                className="w-full py-4 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-xl hover:from-green-600 hover:to-emerald-700 transition shadow-lg transform hover:scale-105"
              >
                🚀 Start Game
              </button>
            )}

            {gameState === 'gameover' && (
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-4">Game Over!</div>
                <div className="text-xl text-white mb-4">Final Score: {score}</div>
                {showNameInput && (
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveScore()}
                      className="w-full px-4 py-2 rounded-lg mb-2 text-black"
                      maxLength={20}
                    />
                    <button
                      onClick={saveScore}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                    >
                      Save to Leaderboard
                    </button>
                  </div>
                )}
                <button
                  onClick={startGame}
                  className="w-full py-4 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-xl hover:from-blue-600 hover:to-purple-700 transition shadow-lg transform hover:scale-105"
                >
                  🔄 Play Again
                </button>
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-400" size={32} />
              Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <div className="text-center text-purple-200 py-8">
                  No scores yet. Be the first to play!
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className={`
                      flex items-center justify-between p-4 rounded-xl
                      ${index === 0 ? 'bg-yellow-500/20 border-2 border-yellow-400' : 
                        index === 1 ? 'bg-gray-400/20 border-2 border-gray-400' :
                        index === 2 ? 'bg-orange-600/20 border-2 border-orange-600' :
                        'bg-white/5'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-400 text-gray-900' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-white/20 text-white'}
                      `}>
                        {index + 1}
                      </div>
                      <div className="text-white font-semibold">{entry.name}</div>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {entry.score}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimonSays;