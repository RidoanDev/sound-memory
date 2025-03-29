import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import GameBoard from "@/components/GameBoard";
import ScorePanel from "@/components/ScorePanel";
import { playSound, generateToneSound, initAudio } from "@/utils/soundUtils";
import { SkipForward, SkipBack } from "lucide-react";

// Define game buttons with their colors and sounds
const gameButtons = [
  { 
    id: 0, 
    color: "red-500", 
    activeColor: "red-400", 
    sound: generateToneSound(261.63) // C4
  },
  { 
    id: 1, 
    color: "green-500", 
    activeColor: "green-400", 
    sound: generateToneSound(329.63) // E4
  },
  { 
    id: 2, 
    color: "blue-500", 
    activeColor: "blue-400", 
    sound: generateToneSound(392.00) // G4
  },
  { 
    id: 3, 
    color: "yellow-500", 
    activeColor: "yellow-400", 
    sound: generateToneSound(523.25) // C5
  }
];

const NEXT_SEQUENCE_DELAY = 1000;
const BUTTON_HIGHLIGHT_DURATION = 500;
const MAX_LEVEL = 20;

const Index = () => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "gameOver">("idle");
  const [playerTurn, setPlayerTurn] = useState(false);
  const [level, setLevel] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [streak, setStreak] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioInitialized = useRef(false);

  useEffect(() => {
    const savedHighScore = localStorage.getItem("soundMemoryHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    
    const savedSoundSetting = localStorage.getItem("soundMemorySoundEnabled");
    if (savedSoundSetting) {
      setIsSoundEnabled(savedSoundSetting === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("soundMemoryHighScore", highScore.toString());
  }, [highScore]);

  useEffect(() => {
    localStorage.setItem("soundMemorySoundEnabled", isSoundEnabled.toString());
  }, [isSoundEnabled]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const playButton = useCallback((buttonId: number) => {
    setActiveButton(buttonId);
    
    if (isSoundEnabled) {
      playSound(gameButtons[buttonId].sound);
    }
    
    timeoutRef.current = setTimeout(() => {
      setActiveButton(null);
    }, BUTTON_HIGHLIGHT_DURATION / gameSpeed);
  }, [isSoundEnabled, gameSpeed]);

  const playSequence = useCallback(async (sequenceToPlay: number[]) => {
    setPlayerTurn(false);
    
    for (let i = 0; i < sequenceToPlay.length; i++) {
      await new Promise<void>((resolve) => {
        timeoutRef.current = setTimeout(() => {
          playButton(sequenceToPlay[i]);
          resolve();
        }, (BUTTON_HIGHLIGHT_DURATION + 200) / gameSpeed);
      });
    }
    
    timeoutRef.current = setTimeout(() => {
      setPlayerTurn(true);
    }, BUTTON_HIGHLIGHT_DURATION / gameSpeed);
  }, [playButton, gameSpeed]);

  const startGame = useCallback(() => {
    if (!audioInitialized.current) {
      initAudio();
      audioInitialized.current = true;
    }
    
    setScore(0);
    setLevel(1);
    setStreak(0);
    setGameStatus("playing");
    setPlayerTurn(false);
    setGameSpeed(1);
    
    const newSequence = [Math.floor(Math.random() * gameButtons.length)];
    setSequence(newSequence);
    setPlayerSequence([]);
    
    timeoutRef.current = setTimeout(() => {
      playSequence(newSequence);
    }, NEXT_SEQUENCE_DELAY / gameSpeed);

    toast({
      title: "Game Started!",
      description: "Watch and listen carefully...",
    });
  }, [playSequence, gameSpeed]);

  const addToSequence = useCallback(() => {
    const newButton = Math.floor(Math.random() * gameButtons.length);
    const newSequence = [...sequence, newButton];
    setSequence(newSequence);
    setPlayerSequence([]);
    
    const newLevel = Math.min(newSequence.length, MAX_LEVEL);
    setLevel(newLevel);
    
    if (newLevel > 5 && newLevel <= 10) {
      setGameSpeed(1.2);
    } else if (newLevel > 10 && newLevel <= 15) {
      setGameSpeed(1.5);
    } else if (newLevel > 15) {
      setGameSpeed(1.8);
    }
    
    timeoutRef.current = setTimeout(() => {
      playSequence(newSequence);
    }, NEXT_SEQUENCE_DELAY / gameSpeed);
  }, [sequence, playSequence, gameSpeed]);

  const handleButtonClick = useCallback((buttonId: number) => {
    if (!playerTurn || gameStatus !== "playing") return;
    
    playButton(buttonId);
    
    const newPlayerSequence = [...playerSequence, buttonId];
    setPlayerSequence(newPlayerSequence);
    
    const currentIndex = playerSequence.length;
    if (buttonId !== sequence[currentIndex]) {
      setGameStatus("gameOver");
      setPlayerTurn(false);
      
      if (score > highScore) {
        setHighScore(score);
        
        toast({
          title: "New High Score!",
          description: `You achieved a new high score of ${score}!`,
          variant: "default",
        });
      } else {
        toast({
          title: "Game Over!",
          description: `Your score: ${score}. High score: ${Math.max(score, highScore)}`,
          variant: "destructive",
        });
      }
      return;
    }
    
    if (newPlayerSequence.length === sequence.length) {
      const newScore = score + level;
      setScore(newScore);
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      if (newStreak % 3 === 0) {
        const bonusPoints = Math.floor(newStreak / 3) * 5;
        const totalScore = newScore + bonusPoints;
        setScore(totalScore);
        
        toast({
          title: "Streak Bonus!",
          description: `+${bonusPoints} points for ${newStreak} sequences in a row!`,
        });
      } else {
        toast({
          title: "Level Complete!",
          description: `Score: ${newScore} | Level: ${level}`,
        });
      }
      
      timeoutRef.current = setTimeout(addToSequence, NEXT_SEQUENCE_DELAY / gameSpeed);
    }
  }, [playerTurn, gameStatus, playerSequence, sequence, score, highScore, level, streak, playButton, addToSequence, gameSpeed]);

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
    
    toast({
      title: isSoundEnabled ? "Sound Off" : "Sound On",
      description: isSoundEnabled ? "Game sounds have been disabled." : "Game sounds have been enabled.",
    });
  };

  const changeGameSpeed = (multiplier: number) => {
    if (gameStatus !== "playing") return;
    setGameSpeed(multiplier);
    
    toast({
      title: "Speed Changed",
      description: `Game speed set to ${multiplier}x`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="container max-w-2xl flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Sound Memory Game</h1>
          <p className="text-gray-300 mb-2">Remember and repeat the sequence of lights and sounds</p>
          {gameStatus === "playing" && (
            <div className="flex items-center justify-center space-x-4 mt-2">
              <div className="bg-gray-800 px-3 py-1 rounded-full shadow-inner text-sm flex items-center">
                <span className="mr-1 text-gray-400">Level:</span>
                <span className="font-bold text-cyan-400">{level}</span>
              </div>
              <div className="bg-gray-800 px-3 py-1 rounded-full shadow-inner text-sm flex items-center">
                <span className="mr-1 text-gray-400">Speed:</span>
                <span className="font-bold text-purple-400">{gameSpeed}x</span>
              </div>
              <div className="bg-gray-800 px-3 py-1 rounded-full shadow-inner text-sm flex items-center">
                <span className="mr-1 text-gray-400">Streak:</span>
                <span className="font-bold text-yellow-400">{streak}</span>
              </div>
            </div>
          )}
        </div>
        
        <GameBoard 
          gameButtons={gameButtons}
          activeButton={activeButton}
          onButtonClick={handleButtonClick}
          playerTurn={playerTurn}
        />
        
        <ScorePanel 
          score={score}
          highScore={highScore}
          onStartGame={startGame}
          onToggleSound={toggleSound}
          isSoundEnabled={isSoundEnabled}
          gameStatus={gameStatus}
        />
        
        {gameStatus === "playing" && (
          <div className="flex space-x-4 mt-2">
            <button 
              onClick={() => changeGameSpeed(Math.max(0.5, gameSpeed - 0.25))}
              className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors"
              disabled={gameSpeed <= 0.5}
            >
              <SkipBack size={18} />
            </button>
            <button 
              onClick={() => changeGameSpeed(Math.min(2, gameSpeed + 0.25))}
              className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors"
              disabled={gameSpeed >= 2}
            >
              <SkipForward size={18} />
            </button>
          </div>
        )}
        
        <div className="text-gray-400 text-sm text-center max-w-md">
          {gameStatus === "idle" ? (
            "Press Start Game to begin. Watch the sequence of lights and sounds, then repeat it."
          ) : gameStatus === "playing" ? (
            playerTurn ? "Your turn: Repeat the sequence" : "Watch carefully..."
          ) : (
            "Game over! Press Play Again to try a new game."
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
