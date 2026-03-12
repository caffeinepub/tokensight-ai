import { cn } from "@/lib/utils";
import type { KeyboardEvent, ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  neon?: "blue" | "purple" | "green" | "none";
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  neon = "none",
  onClick,
}: GlassCardProps) {
  const neonClass = {
    blue: "border-neon-blue box-neon-blue",
    purple: "border-neon-purple box-neon-purple",
    green: "box-neon-green border border-neon-green/40",
    none: "",
  }[neon];

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "glass transition-all duration-300",
        neonClass,
        onClick && "cursor-pointer hover:scale-[1.01]",
        className,
      )}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
