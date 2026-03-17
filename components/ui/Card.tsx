import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hover, selected, onClick }: CardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`
        rounded-2xl border-2 bg-white p-6 shadow-sm transition-all
        ${selected ? "border-[#4C9BC8] ring-2 ring-[#4C9BC8]/30" : "border-[#F0F0F0]"}
        ${hover || onClick ? "cursor-pointer hover:border-[#4C9BC8] hover:shadow-md" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
