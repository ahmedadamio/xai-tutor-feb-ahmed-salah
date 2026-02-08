import { useMemo } from "react";

import { AVATAR_COLORS } from "../constants";

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = useMemo(() => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [name]);

  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-[#374151]"
      style={{ width: size, height: size, backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
