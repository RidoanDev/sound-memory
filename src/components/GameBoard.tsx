
import React from "react";
import GameButton from "./GameButton";

interface GameBoardProps {
  gameButtons: Array<{
    id: number;
    color: string;
    activeColor: string;
    sound: string;
  }>;
  activeButton: number | null;
  onButtonClick: (buttonId: number) => void;
  playerTurn: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameButtons,
  activeButton,
  onButtonClick,
  playerTurn,
}) => {
  return (
    <div className="relative w-full max-w-md aspect-square p-4 rounded-full bg-gradient-to-br from-gray-800 to-gray-950 shadow-2xl border border-gray-700">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800/50 to-transparent pointer-events-none" />
      <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
        {gameButtons.map((button) => (
          <GameButton
            key={button.id}
            color={button.color}
            activeColor={button.activeColor}
            onClick={() => onButtonClick(button.id)}
            isActive={activeButton === button.id}
            disabled={!playerTurn}
          />
        ))}
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gray-900 border-4 border-gray-700 shadow-inner flex items-center justify-center">
        <div className={`w-4 h-4 rounded-full ${playerTurn ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
      </div>
    </div>
  );
};

export default GameBoard;
