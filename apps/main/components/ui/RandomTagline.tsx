"use client";

import { useEffect, useState } from "react";

const taglines = [
  "凌晨三點下刀，走出來走廊空到只剩腳步聲。",
  "韓劇都是騙人的。",
  "幸好那時候愛在臉書上發廢文。",
  "有時候會想，這種時刻到底是孤獨還是自由。",
  "撰此文於中秋前，願大學生們胖死。",
  "偶爾覺得自己不是在學醫，是在學怎麼活。",
  "手術室裡放著 Lo-Fi，沒人覺得奇怪。",
  "如果段考沒考好一定是 facebook 的錯。",
];

export function RandomTagline() {
  const [line, setLine] = useState("");

  useEffect(() => {
    setLine(taglines[Math.floor(Math.random() * taglines.length)]);
  }, []);

  if (!line) return null;

  return (
    <p className="tagline-random text-sm italic text-[var(--muted)] opacity-80">
      「{line}」
    </p>
  );
}
