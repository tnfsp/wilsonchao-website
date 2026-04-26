import { promises as fs } from "fs";
import path from "path";
import {
  aboutPreview,
  defaultSiteCopy,
  linkItems as baseLinkItems,
  placeholderBlogs,
} from "./placeholders";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SITE_CONFIG_PATH = path.join(process.cwd(), "content", "site", "config.json");

export type SiteCopy = typeof defaultSiteCopy;

export type BlogEntry = {
  id?: string;
  slug: string;
  title: string;
  type?: string;
  status?: string;
  publishedAt?: string;
  content?: string;
  contentHtml?: string;
  description?: string;
  excerpt?: string;
  readingTime?: string;
  tags?: string[];
  image?: string;
  related?: string[];
};



export type MurmurEntry = {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  tags?: string[];
  contentHtml?: string;
};

async function safeReadJSON<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (error) {
    console.warn(`[content] Unable to read ${filePath}:`, (error as Error).message);
    return null;
  }
}

export async function loadSiteCopy(): Promise<SiteCopy> {
  const file = await safeReadJSON<Record<string, string>>(SITE_CONFIG_PATH);
  return {
    heroTitle: file?.HomepageHeroTitle || defaultSiteCopy.heroTitle,
    heroSubtitle: file?.HomepageHeroSubtitle || defaultSiteCopy.heroSubtitle,
    heroIntro: file?.HomepageIntro || defaultSiteCopy.heroIntro,
    heroCTA: file?.HomepageCTA || defaultSiteCopy.heroCTA,
    footerText: file?.FooterText || defaultSiteCopy.footerText,
    murmurIntro: file?.HomepageStreamIntro || file?.HomepageMurmurIntro || defaultSiteCopy.murmurIntro,
    murmurCTA: file?.HomepageStreamCTA || file?.HomepageMurmurCTA || defaultSiteCopy.murmurCTA,
    aboutName: file?.AboutName || defaultSiteCopy.aboutName,
    aboutIntro: file?.AboutPageIntro || defaultSiteCopy.aboutIntro,
    aboutBody: file?.AboutPageBody || defaultSiteCopy.aboutBody,
    aboutImage: file?.AboutImage || defaultSiteCopy.aboutImage,
    blogTitle: file?.BlogPageTitle || defaultSiteCopy.blogTitle,
    blogIntro: file?.BlogPageIntro || defaultSiteCopy.blogIntro,
    projectsTitle: file?.ProjectsPageTitle || defaultSiteCopy.projectsTitle,
    projectsIntro: file?.ProjectsPageIntro || defaultSiteCopy.projectsIntro,
    linksTitle: file?.LinksPageTitle || defaultSiteCopy.linksTitle,
    linksIntro: file?.LinksPageIntro || defaultSiteCopy.linksIntro,
  };
}

function stripMarkup(value?: string) {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/[#>*`]/g, " ").replace(/\s+/g, " ").trim();
}

function countWordsWithCJK(plain: string) {
  const asciiWords = plain.split(/\s+/).filter(Boolean).length;
  const cjkChars =
    plain.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)
      ?.length || 0;
  return asciiWords + cjkChars;
}

function inferExcerpt(contentHtml?: string, content?: string, existing?: string) {
  if (existing) return existing;
  const plain = stripMarkup(contentHtml || content);
  if (!plain) return "";
  return plain.slice(0, 180) + (plain.length > 180 ? "..." : "");
}

function firstImageFromEntry(entry: BlogEntry) {
  const source = entry.contentHtml || entry.content;
  if (!source) return undefined;
  const match = source.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (match?.[1]) return match[1];
  const md = source.match(/!\[[^\]]*]\(([\S)]+)(?:\s+"[^"]*")?\)/);
  return md?.[1];
}

function inferReadingTime(entry: BlogEntry): string | undefined {
  const plain = stripMarkup(entry.contentHtml || entry.content);
  if (plain) {
    const words = countWordsWithCJK(plain);
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} min`;
  }
  return entry.readingTime;
}

function sortByDateDesc(entries: BlogEntry[]) {
  return [...entries].sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate;
  });
}

export async function loadBlogEntries(): Promise<BlogEntry[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    const entries: BlogEntry[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const parsed = await safeReadJSON<BlogEntry>(path.join(BLOG_DIR, file));
      if (!parsed?.slug) continue;
      const status = parsed.status || "Published";
      if (status !== "Published") continue;

      // Scheduled publishing: skip entries with publishedAt in the future
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      if (parsed.publishedAt && parsed.publishedAt > today) continue;

      entries.push({
        ...parsed,
        excerpt: inferExcerpt(parsed.contentHtml, parsed.content, parsed.description || parsed.excerpt),
        readingTime: inferReadingTime(parsed),
        image: parsed.image || firstImageFromEntry(parsed),
      });
    }

    if (entries.length === 0) {
      console.warn("[content] No blog entries found in content/blog. Using placeholders.");
      return placeholderBlogs;
    }

    return sortByDateDesc(entries);
  } catch (error) {
    console.warn("[content] Failed to load blog entries, using placeholders:", (error as Error).message);
    return placeholderBlogs;
  }
}

export async function getBlogEntry(slug: string): Promise<BlogEntry | null> {
  const entries = await loadBlogEntries();
  return entries.find((entry) => entry.slug === slug) ?? null;
}



export async function loadStreamEntries(limit = 50): Promise<MurmurEntry[]> {
  const stripHtml = (value?: string) => {
    if (!value) return "";
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  };
  try {
    const streamPath = path.join(process.cwd(), "content", "stream.json");
    const raw = await fs.readFile(streamPath, "utf-8");
    const items = JSON.parse(raw) as {
      id: string;
      title: string;
      text?: string;
      contentHtml?: string;
      pubDate?: string;
      tags?: string[];
      link?: string;
      linkPreview?: string;
      images?: string[];
    }[];

    return items.slice(0, limit).map((item) => ({
      title: item.title,
      link: item.link || "",
      description: item.text || stripHtml(item.contentHtml),
      pubDate: item.pubDate,
      tags: item.tags,
      contentHtml: item.contentHtml,
    }));
  } catch (error) {
    console.warn("[content] Failed to load stream.json:", (error as Error).message);
    return [];
  }
}

const buttondownLink = process.env.NEXT_PUBLIC_BUTTONDOWN_URL;

const linkItems = [
  ...baseLinkItems,
  ...(buttondownLink
    ? [{ label: "📧 Buttondown｜Email 訂閱", href: buttondownLink, external: true }]
    : []),
] as typeof baseLinkItems;

export { aboutPreview, linkItems };
