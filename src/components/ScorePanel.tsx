
import React from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Award, RotateCcw, Play } from "lucide-react";

interface ScorePanelProps {
  score: number;
  highScore: number;
  onStartGame: () => void;
  onToggleSound: () => void;
  isSoundEnabled: boolean;
  gameStatus: "idle" | "playing" | "gameOver";
}

const ScorePanel: React.FC<ScorePanelProps> = ({
  score,
  highScore,
  onStartGame,
  onToggleSound,
  isSoundEnabled,
  gameStatus,
}) => {
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      <div className="w-full bg-gray-800/50 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col items-start">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{score}</span>
              <span className="ml-2 text-sm text-gray-300">CURRENT</span>
            </div>
            <div className="flex items-center">
              <Award className="text-yellow-400 mr-1" size={16} />
              <span className="text-sm text-gray-300">{highScore}</span>
              <span className="ml-1 text-xs text-gray-400">HIGH SCORE</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full hover:bg-gray-700/50 transition-all duration-300"
            onClick={onToggleSound}
          >
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </Button>
        </div>
      </div>
      
      <Button 
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl" 
        onClick={onStartGame}
        variant="default"
        size="lg"
      >
        {gameStatus === "idle" 
          ? <><Play className="mr-2" size={18} /> Start Game</> 
          : gameStatus === "playing" 
            ? <><RotateCcw className="mr-2" size={18} /> Restart</> 
            : <><Play className="mr-2" size={18} /> Play Again</>}
      </Button>
    </div>
  );
};

export default ScorePanel;
