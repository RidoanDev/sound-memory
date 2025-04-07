import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, RefreshCw, Trophy, Music, Sparkles, Timer, Heart, Star, Crown } from 'lucide-react';

// Define sound frequencies for different tiles
const SOUNDS = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  493.88, // B4
  523.25, // C5
];

// Define tile colors for visual variety
const TILE_COLORS = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-teal-500 to-green-500',
  'from-yellow-500 to-orange-500',
  'from-red-500 to-pink-500',
  'from-indigo-500 to-purple-500',
  'from-cyan-500 to-blue-500',
];

type GameTile = {
  id: number;
  frequency: number;
  isPlaying: boolean;
  isMatched: boolean;
};

type GameMode = 'normal' | 'time-attack' | 'survival';

function App() {
  const [tiles, setTiles] = useState<GameTile[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lives, setLives] = useState(3);
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // Initialize audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Timer effect for time-attack mode
  useEffect(() => {
    let timer: number;
    if (gameMode === 'time-attack' && sequence.length > 0 && timeRemaining > 0) {
      timer = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            startGame();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameMode, sequence.length, timeRemaining]);

  const playSound = useCallback((frequency: number) => {
    if (isMuted) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  }, [isMuted]);

  // Initialize game
  useEffect(() => {
    const initialTiles = SOUNDS.map((freq, index) => ({
      id: index,
      frequency: freq,
      isPlaying: false,
      isMatched: false,
    }));
    setTiles(initialTiles);
  }, []);

  // Generate new sequence
  const generateSequence = useCallback(() => {
    const newSequence = Array.from({ length: level + 2 }, () => 
      Math.floor(Math.random() * SOUNDS.length)
    );
    setSequence(newSequence);
    return newSequence;
  }, [level]);

  // Play sequence
  const playSequence = useCallback(async (seq: number[]) => {
    setIsPlaying(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTiles(prev => prev.map(tile => ({
        ...tile,
        isPlaying: tile.id === seq[i],
      })));
      playSound(SOUNDS[seq[i]]);
      await new Promise(resolve => setTimeout(resolve, 400));
      setTiles(prev => prev.map(tile => ({
        ...tile,
        isPlaying: false,
      })));
    }
    setIsPlaying(false);
  }, [playSound]);

  // Start new game
  const startGame = useCallback(() => {
    setPlayerSequence([]);
    setScore(0);
    setLevel(1);
    setLives(3);
    setCombo(0);
    setTimeRemaining(30);
    const newSequence = generateSequence();
    playSequence(newSequence);
  }, [generateSequence, playSequence]);

  // Handle tile click
  const handleTileClick = useCallback((tileId: number) => {
    if (isPlaying) return;

    const newPlayerSequence = [...playerSequence, tileId];
    setPlayerSequence(newPlayerSequence);
    playSound(SOUNDS[tileId]);
    setTiles(prev => prev.map(tile => ({
      ...tile,
      isPlaying: tile.id === tileId,
    })));

    setTimeout(() => {
      setTiles(prev => prev.map(tile => ({
        ...tile,
        isPlaying: false,
      })));
    }, 300);

    // Check if sequence matches
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      if (gameMode === 'survival') {
        setLives(prev => {
          if (prev <= 1) {
            setHighScore(prev => Math.max(prev, score));
            startGame();
            return 3;
          }
          return prev - 1;
        });
      } else {
        setHighScore(prev => Math.max(prev, score));
        startGame();
      }
      setCombo(0);
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      const comboBonus = Math.floor(combo * 0.5);
      const timeBonus = gameMode === 'time-attack' ? Math.floor(timeRemaining * 0.3) : 0;
      const newScore = score + sequence.length * 10 + comboBonus + timeBonus;
      
      setScore(newScore);
      setHighScore(prev => Math.max(prev, newScore));
      setLevel(prev => prev + 1);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 1500);
      
      // Update combo
      setCombo(prev => {
        const newCombo = prev + 1;
        setBestCombo(current => Math.max(current, newCombo));
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 1000);
        return newCombo;
      });
      
      setPlayerSequence([]);
      if (gameMode === 'time-attack') {
        setTimeRemaining(prev => Math.min(prev + 5, 30));
      }
      
      setTimeout(() => {
        const newSequence = generateSequence();
        playSequence(newSequence);
      }, 1000);
    }
  }, [isPlaying, playerSequence, sequence, score, playSound, generateSequence, playSequence, startGame, combo, gameMode, timeRemaining]);

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1464802686167-b939a6910659?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2333&q=80')] bg-cover bg-center flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-black/40 backdrop-blur-xl rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/10">
        <div className="flex justify-between items-center mb-8">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <Music className="w-8 h-8" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Sound Memory
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <p className="text-white/80 text-lg">Level {level}</p>
              </div>
              {gameMode === 'survival' && (
                <div className="flex items-center gap-1">
                  {[...Array(lives)].map((_, i) => (
                    <Heart key={i} className="w-4 h-4 text-red-500 fill-red-500" />
                  ))}
                </div>
              )}
              {gameMode === 'time-attack' && (
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-400" />
                  <span className="text-white/80 text-lg">{timeRemaining}s</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 rounded-full hover:bg-white/10 transition-colors border border-white/20"
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
            </button>
            <button
              onClick={startGame}
              className="p-3 rounded-full hover:bg-white/10 transition-colors border border-white/20"
            >
              <RefreshCw className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-6 flex-1 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Current Score</div>
            <div className="text-white text-3xl font-bold">{score}</div>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white/60">Combo: {combo}x</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 flex-1 border border-white/10">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <div className="text-white/60 text-sm">High Score</div>
            </div>
            <div className="text-white text-3xl font-bold">{highScore}</div>
            <div className="flex items-center gap-2 mt-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-white/60">Best Combo: {bestCombo}x</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          {['normal', 'time-attack', 'survival'].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setGameMode(mode as GameMode);
                startGame();
              }}
              className={`
                flex-1 py-2 px-4 rounded-xl transition-all
                ${gameMode === mode
                  ? 'bg-white/20 border-white/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'}
                border text-white font-medium
              `}
            >
              {mode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        <div className="relative">
          {showLevelUp && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-2xl font-bold animate-bounce">
                Level Up! 🎉
              </div>
            </div>
          )}
          {showCombo && combo > 1 && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full text-xl font-bold animate-scale-up">
                {combo}x Combo! 🔥
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {tiles.map((tile, index) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                disabled={isPlaying}
                className={`
                  aspect-square rounded-2xl transition-all transform relative
                  bg-gradient-to-br ${TILE_COLORS[index]}
                  ${tile.isPlaying 
                    ? 'scale-95 brightness-150 shadow-[0_0_30px_rgba(255,255,255,0.5)]' 
                    : 'hover:scale-105 brightness-75 hover:brightness-100'}
                  ${isPlaying ? 'cursor-not-allowed' : 'cursor-pointer'}
                  border border-white/20 shadow-lg
                `}
              >
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {sequence.length === 0 && (
          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105"
          >
            <Play className="w-5 h-5" />
            Start Game
          </button>
        )}

        <div className="text-white/60 text-center mt-6 text-lg font-medium">
          {isPlaying ? (
            <div className="animate-pulse">Watch the sequence...</div>
          ) : (
            'Your turn! Repeat the sequence'
          )}
        </div>
      </div>
    </div>
  );
}

export default App;