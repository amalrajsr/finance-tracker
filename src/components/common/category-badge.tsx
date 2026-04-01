import React from "react";

export interface CategoryBadgeProps {
  slug?: string;
  name?: string;
  icon?: string;
  colour?: string;
  isManual?: boolean;
}

export interface CategoryOption extends CategoryBadgeProps {
  id: string;
}

export function CategoryBadge({
  name,
  icon,
  colour,
  isManual = false,
}: CategoryBadgeProps) {
  const bgColor = colour ? `${colour}1A` : "#9CA3AF1A"; // 10% opacity
  const textColor = colour || "#6B7280";

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {icon ? <span>{icon}</span> : <span className="text-[10px]">❓</span>}
      <span className="truncate max-w-[120px]">
        {name || "Uncategorized"}
      </span>
      {isManual && (
        <span
          title="Manually categorized by you"
          className="ml-0.5 opacity-60 text-[10px]"
        >
          •
        </span>
      )}
    </div>
  );
}
