import { promises as fs } from "fs";
import path from "path";

export interface NowDynamicItem {
  streamId: string;
  title: string;
  description?: string;
  date: string;
  tag: string;
  url?: string | null;
  youtubeId?: string | null;
  image?: string | null;
  sourceLink: string;
}

export interface NowSection {
  id: string;
  emoji: string;
  title: string;
  body: string;
}

export interface NowData {
  lastUpdated: string;
  sections: NowSection[];
  dynamic: {
    music: NowDynamicItem[];
    video: NowDynamicItem[];
    reading: NowDynamicItem[];
    fragments: NowDynamicItem[];
  };
}

const NOW_PATH = path.join(process.cwd(), "content", "now.json");

const FALLBACK_SECTIONS: NowSection[] = [
  { id: "clinical", emoji: "🏥", title: "臨床", body: "在高醫心臟血管外科當總醫師，八月升主治。冠狀動脈繞道、瓣膜、主動脈手術。同時準備專科考試。" },
  { id: "research", emoji: "📚", title: "研究", body: "剛開了一個 Network Meta-Analysis 專案：比較透析通路 steal syndrome 的不同術式（DRIL vs RUDI vs PAI），目標投 JVS。" },
  { id: "writing", emoji: "✍️", title: "寫作", body: "試著寫更短、更頻繁的東西。Stream 是每天的碎片，Blog 放長文。" },
  { id: "building", emoji: "🤖", title: "在蓋的東西", body: "一個 AI-assisted 的個人系統 — 用 Claude 串起日記、知識庫、研究流程、記帳、甚至這個網站的維護。" },
  { id: "other", emoji: "🎵", title: "其他", body: "在學 DJ。偶爾健身。試著每天走久一點。" },
];

export async function loadNowData(): Promise<NowData | null> {
  try {
    const raw = await fs.readFile(NOW_PATH, "utf-8");
    const data = JSON.parse(raw) as NowData & { _archive?: unknown };

    // Runtime filter: 30 days for most, 14 for fragments
    const now = Date.now();
    const filterByDays = (items: NowDynamicItem[], days: number) =>
      items.filter((item) => {
        const age = now - new Date(item.date).getTime();
        return age < days * 24 * 60 * 60 * 1000;
      });

    return {
      lastUpdated: data.lastUpdated,
      sections: data.sections?.length ? data.sections : FALLBACK_SECTIONS,
      dynamic: {
        music: filterByDays(data.dynamic?.music || [], 30),
        video: filterByDays(data.dynamic?.video || [], 30),
        reading: filterByDays(data.dynamic?.reading || [], 30),
        fragments: filterByDays(data.dynamic?.fragments || [], 14),
      },
    };
  } catch (error) {
    console.warn("[now] Failed to load now.json:", error);
    return null;
  }
}

export function isStale(lastUpdated: string, days = 14): boolean {
  const age = Date.now() - new Date(lastUpdated).getTime();
  return age > days * 24 * 60 * 60 * 1000;
}
