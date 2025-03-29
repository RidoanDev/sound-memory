
import React from "react";
import { cn } from "@/lib/utils";

interface GameButtonProps {
  color: string;
  activeColor: string;
  onClick: () => void;
  isActive: boolean;
  disabled: boolean;
}

const GameButton: React.FC<GameButtonProps> = ({
  color,
  activeColor,
  onClick,
  isActive,
  disabled,
}) => {
  return (
    <button
      className={cn(
        "w-full h-full rounded-full transition-all transform hover:scale-[0.98] active:scale-95 shadow-xl border-4 border-white/30",
        `bg-${color}`,
        isActive && `bg-${activeColor} animate-pulse scale-95 shadow-inner border-white/60`,
        disabled && "opacity-70 cursor-not-allowed hover:scale-100"
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${color} button`}
    />
  );
};

export default GameButton;
