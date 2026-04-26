import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

type ArticleStats = {
  slug: string;
  views: number;
  likes?: number;
  comments?: number;
};

type SubscriberMeta = {
  subscribedAt: string;
  source: string;
};

type DailyViews = {
  date: string;
  views: number;
};

export async function GET() {
  try {
    // === 1. Views Data ===
    const viewKeys = await kv.keys("views:*:total");
    const articleStats: Map<string, ArticleStats> = new Map();

    for (const key of viewKeys) {
      const views = await kv.get<number>(key);
      const slug = key.replace("views:", "").replace(":total", "");
      if (views && slug !== "home") {
        articleStats.set(slug, { slug, views, likes: 0, comments: 0 });
      }
    }

    // === 2. Likes Data (按讚排行) ===
    const likeKeys = await kv.keys("likes:*:total");
    const likesData: { slug: string; likes: number }[] = [];

    for (const key of likeKeys) {
      const likes = await kv.get<number>(key);
      const slug = key.replace("likes:", "").replace(":total", "");
      if (likes) {
        likesData.push({ slug, likes });
        // Update article stats if exists
        const existing = articleStats.get(slug);
        if (existing) {
          existing.likes = likes;
        }
      }
    }
    likesData.sort((a, b) => b.likes - a.likes);

    // === 3. Comments per Article (留言活躍度) ===
    const commentKeys = await kv.keys("comments:*:list");
    const commentsData: { slug: string; comments: number }[] = [];
    let totalComments = 0;

    for (const key of commentKeys) {
      const comments = await kv.get<unknown[]>(key);
      const slug = key.replace("comments:", "").replace(":list", "");
      if (comments && comments.length > 0) {
        commentsData.push({ slug, comments: comments.length });
        totalComments += comments.length;
        // Update article stats if exists
        const existing = articleStats.get(slug);
        if (existing) {
          existing.comments = comments.length;
        }
      }
    }
    commentsData.sort((a, b) => b.comments - a.comments);

    // === 4. Daily Views Trend (流量趨勢) ===
    const dailyKeys = await kv.keys("views:*:today:*");
    const dailyMap: Map<string, number> = new Map();

    for (const key of dailyKeys) {
      const views = await kv.get<number>(key);
      // Extract date from key like "views:home:today:2026-01-15"
      const dateMatch = key.match(/today:(\d{4}-\d{2}-\d{2})$/);
      if (views && dateMatch) {
        const date = dateMatch[1];
        dailyMap.set(date, (dailyMap.get(date) || 0) + views);
      }
    }

    const dailyTrend: DailyViews[] = Array.from(dailyMap.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // === 5. Subscriber Sources (訂閱來源) ===
    const subscribers = await kv.smembers("subscribers:emails");
    const sourceMap: Map<string, number> = new Map();

    for (const email of subscribers) {
      const meta = await kv.get<SubscriberMeta>(`subscribers:${email}:meta`);
      if (meta?.source) {
        const source = meta.source;
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      }
    }

    const subscriberSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // === 6. Home & Total Views ===
    const homeViews = await kv.get<number>("views:home:total") || 0;
    const allArticles = Array.from(articleStats.values())
      .sort((a, b) => b.views - a.views);
    const totalViews = allArticles.reduce((sum, item) => sum + item.views, 0) + homeViews;

    // === 7. Total Likes ===
    const totalLikes = likesData.reduce((sum, item) => sum + item.likes, 0);

    return NextResponse.json({
      // 總覽
      summary: {
        totalViews,
        homeViews,
        totalLikes,
        subscriberCount: subscribers.length,
        totalComments,
        articleCount: allArticles.length,
      },
      // 熱門文章（含瀏覽、按讚、留言）
      topArticles: allArticles.slice(0, 10),
      // 按讚排行
      topLiked: likesData.slice(0, 10),
      // 留言活躍度
      mostDiscussed: commentsData.slice(0, 10),
      // 流量趨勢（近期每日）
      dailyTrend,
      // 訂閱來源分析
      subscriberSources,
      // 完整數據
      allArticles,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
