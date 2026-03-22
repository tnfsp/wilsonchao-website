"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Number of weeks to display (default 52) */
  weeks?: number;
};

const CELL = 10;
const GAP = 2;
const SIZE = CELL + GAP;

// Green shades matching GitHub style but using site accent
const COLORS = {
  empty: "var(--border)",
  low: "#9be9a8",
  med: "#40c463",
  high: "#30a14e",
  max: "#216e39",
};

function getColor(count: number): string {
  if (count === 0) return COLORS.empty;
  if (count === 1) return COLORS.low;
  if (count <= 2) return COLORS.med;
  if (count <= 3) return COLORS.high;
  return COLORS.max;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function WritingHeatmap({ weeks = 52 }: Props) {
  const [dateSet, setDateSet] = useState<Set<string> | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/writing-calendar")
      .then((r) => r.json())
      .then((data) => setDateSet(new Set(data.dates)))
      .catch(() => setDateSet(new Set()));
  }, []);

  if (!dateSet) return null; // Loading — render nothing, no layout shift

  // Build grid: weeks × 7 days, ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the start: go back `weeks` weeks from end of this week
  const endDay = new Date(today);
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - (weeks * 7 - 1) - startDay.getDay());

  // Build week columns
  const grid: { date: string; count: number; col: number; row: number }[] = [];
  const cursor = new Date(startDay);
  let col = 0;

  while (cursor <= endDay) {
    const row = cursor.getDay(); // 0=Sun
    if (row === 0 && grid.length > 0) col++;
    const ds = formatDate(cursor);
    grid.push({
      date: ds,
      count: dateSet.has(ds) ? 1 : 0,
      col,
      row,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const totalCols = col + 1;
  const svgWidth = totalCols * SIZE;
  const svgHeight = 7 * SIZE;

  // Count streak
  let streak = 0;
  const checkDate = new Date(today);
  while (dateSet.has(formatDate(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const totalDays = dateSet.size;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-[var(--muted)]">
          {totalDays.toLocaleString()} 天寫作紀錄
        </span>
        {streak > 0 && (
          <span className="text-[11px] text-[var(--muted)]">
            🔥 連續 {streak} 天
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block"
          role="img"
          aria-label="寫作日曆熱力圖"
        >
          {grid.map((cell) => (
            <rect
              key={cell.date}
              x={cell.col * SIZE}
              y={cell.row * SIZE}
              width={CELL}
              height={CELL}
              rx={2}
              fill={getColor(cell.count)}
              className="transition-opacity"
              opacity={hoveredDate && hoveredDate !== cell.date ? 0.4 : 1}
              onMouseEnter={() => setHoveredDate(cell.date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <title>
                {cell.date}
                {cell.count > 0 ? " ✓ 有寫" : ""}
              </title>
            </rect>
          ))}
        </svg>
      </div>
      {hoveredDate && (
        <p className="text-[10px] text-[var(--muted)] mt-1 h-3">
          {hoveredDate} {dateSet.has(hoveredDate) ? "✓" : "—"}
        </p>
      )}
    </div>
  );
}
