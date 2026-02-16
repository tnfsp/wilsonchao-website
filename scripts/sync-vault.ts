/**
 * sync-vault.ts
 * Reads Obsidian Vault Brand/ folder and produces JSON files
 * matching the exact format of sync-notion.ts output.
 */

import matter from "gray-matter";
import { Marked } from "marked";
import { readFile, readdir, writeFile, mkdir, stat, copyFile } from "fs/promises";
import path from "path";

// ─── paths ───────────────────────────────────────────────────────────
const VAULT_ROOT = path.join(
  process.env.HOME || "/Users/zhaoyixiang",
  "Library/Mobile Documents/iCloud~md~obsidian/Documents/Wilson"
);
const VAULT_BASE = path.join(VAULT_ROOT, "Brand");
const VAULT_BLOG = path.join(VAULT_BASE, "Blog");
const VAULT_DAILY = path.join(VAULT_BASE, "Daily");
const VAULT_WEEKLY = path.join(VAULT_BASE, "週報");
const VAULT_CONFIG = path.join(VAULT_BASE, "Config");

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "content", "blog");
const PROJECTS_PATH = path.join(ROOT, "content", "projects.json");
const SITE_CONFIG_PATH = path.join(ROOT, "content", "site", "config.json");
const BLOG_ASSET_DIR = path.join(ROOT, "public", "content", "blog");
const PROJECT_ASSET_DIR = path.join(ROOT, "public", "content", "projects");

// ─── types (match sync-notion output) ────────────────────────────────
type BlogEntry = {
  id: string;
  slug: string;
  title: string;
  type?: string;
  status?: string;
  publishedAt?: string;
  content: string;
  contentHtml?: string;
  description?: string;
  excerpt?: string;
  readingTime?: string;
  tags?: string[];
};

type ProjectEntry = {
  title: string;
  description?: string;
  href?: string;
  slug?: string;
  type?: string;
  status?: string;
  date?: string;
  image?: string;
  content?: string;
  contentHtml?: string;
  excerpt?: string;
  readingTime?: string;
};

type SiteConfig = Record<string, string>;

// ─── helpers ─────────────────────────────────────────────────────────
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function estimateReadingTime(text: string): string {
  const plain = text.replace(/\s+/g, " ").trim();
  const asciiWords = plain.split(/\s+/).filter(Boolean).length;
  const cjkChars =
    plain.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)
      ?.length || 0;
  const words = asciiWords + cjkChars;
  if (!words) return "";
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min`;
}

function buildExcerpt(text: string): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length > 200 ? `${plain.slice(0, 200)}...` : plain;
}

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function listMdFiles(dir: string): Promise<string[]> {
  if (!(await dirExists(dir))) return [];
  const files = await readdir(dir);
  return files.filter((f) => f.endsWith(".md")).map((f) => path.join(dir, f));
}

/** Strip plain text from markdown (rough) */
function stripMd(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images
    .replace(/!?\[\[([^\]]*)\]\]/g, "") // obsidian embeds
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_~`>]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── image handling ──────────────────────────────────────────────────
/**
 * Convert Obsidian image references to web paths and copy files.
 * Supports:
 *  - ![alt](relative-path)
 *  - ![[_attachments/images/file.jpg]]
 *  - ![alt](cover.png)  (relative to _assets/{slug}/)
 */
async function processImages(
  markdown: string,
  slug: string,
  sourceDir: string,
  assetsSubdir: string, // "blog" or "projects"
  assetRoot: string,
  publicBase: string
): Promise<{ markdown: string; coverImage?: string }> {
  let cover: string | undefined;
  const destDir = path.join(assetRoot, slug);

  // Helper to copy a file and return public path
  async function copyAsset(srcPath: string, filename: string): Promise<string | undefined> {
    try {
      await stat(srcPath);
    } catch {
      return undefined;
    }
    await mkdir(destDir, { recursive: true });
    const dest = path.join(destDir, filename);
    await copyFile(srcPath, dest);
    return `${publicBase}/${slug}/${filename}`;
  }

  // Process ![[...]] Obsidian embeds
  const obsidianEmbedRe = /!\[\[([^\]]+)\]\]/g;
  let result = markdown;
  const obsidianMatches = [...markdown.matchAll(obsidianEmbedRe)];
  for (const m of obsidianMatches) {
    const ref = m[1];
    // Try _attachments path relative to vault base
    const filename = path.basename(ref);
    const candidates = [
      // 1. Relative to source file's directory
      path.join(sourceDir, ref),
      path.join(sourceDir, "_attachments", "images", filename),
      // 2. Relative to Brand/ (VAULT_BASE)
      path.join(VAULT_BASE, ref),
      path.join(VAULT_BASE, "_attachments", "images", filename),
      // 3. Relative to Vault root (VAULT_ROOT) — images live here
      path.join(VAULT_ROOT, ref),
      path.join(VAULT_ROOT, "_attachments", "images", filename),
      path.join(VAULT_ROOT, "_attachments", "images", "journal", filename),
      path.join(VAULT_ROOT, "_attachments", "images", "movies", filename),
    ];
    let publicPath: string | undefined;
    for (const candidate of candidates) {
      publicPath = await copyAsset(candidate, filename);
      if (publicPath) break;
    }
    if (publicPath) {
      console.log(`[sync-vault] Image found: ${filename}`);
      result = result.replace(m[0], `![image](${publicPath})`);
      if (!cover) cover = publicPath;
    } else {
      console.warn(`[sync-vault] Image NOT FOUND (all candidates failed): ${ref}`);
      // Remove broken embed
      result = result.replace(m[0], "");
    }
  }

  // Process ![alt](path) standard markdown images
  const mdImageRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const mdMatches = [...result.matchAll(mdImageRe)];
  for (const m of mdMatches) {
    const alt = m[1];
    const ref = m[2];
    // Skip already-processed absolute web paths
    if (ref.startsWith("/content/") || ref.startsWith("http")) continue;

    const filename = path.basename(ref);
    // Look in _assets/{slug}/ first, then relative to source dir
    const assetsDir = path.join(sourceDir, "_assets", slug);
    const candidates = [
      path.join(assetsDir, filename),
      path.join(sourceDir, ref),
      path.join(sourceDir, "_assets", ref),
    ];
    let publicPath: string | undefined;
    for (const candidate of candidates) {
      publicPath = await copyAsset(candidate, filename);
      if (publicPath) break;
    }
    if (publicPath) {
      result = result.replace(m[0], `![${alt}](${publicPath})`);
      if (!cover) cover = publicPath;
    }
  }

  return { markdown: result, coverImage: cover };
}

// ─── markdown → HTML renderer (Notion-style) ────────────────────────
const marked = new Marked();

function mdToHtml(md: string): string {
  // marked.parse can return string | Promise<string>; we force sync
  const raw = marked.parse(md, { async: false }) as string;
  // Post-process to match Notion-style output:
  // - Wrap standalone images in <figure>
  let html = raw.replace(
    /<p>\s*<img\s+src="([^"]+)"\s+alt="([^"]*)"\s*\/?>\s*<\/p>/g,
    '<figure><img src="$1" alt="$2" /></figure>'
  );
  return html;
}

// ─── Blog sync ───────────────────────────────────────────────────────
async function syncBlog(): Promise<BlogEntry[]> {
  const files = await listMdFiles(VAULT_BLOG);
  const entries: BlogEntry[] = [];

  for (const file of files) {
    const raw = await readFile(file, "utf-8");
    const { data: fm, content: body } = matter(raw);

    if (fm.published === false) continue;

    const slug = fm.slug || path.basename(file, ".md");
    const title = fm.title || path.basename(file, ".md");

    // Strip leading H1 if it matches frontmatter title (avoid duplicate)
    let cleanBody = body;
    const h1Match = cleanBody.match(/^\s*#\s+(.+)\n?/);
    if (h1Match) {
      const h1Text = h1Match[1].trim().replace(/\*{1,2}/g, "");
      if (h1Text === title.trim()) {
        cleanBody = cleanBody.replace(/^\s*#\s+.+\n?/, "");
      }
    }

    const { markdown: processedMd, coverImage } = await processImages(
      cleanBody,
      slug,
      VAULT_BLOG,
      "blog",
      BLOG_ASSET_DIR,
      "/content/blog"
    );

    const contentHtml = mdToHtml(processedMd);
    const plainText = stripMd(processedMd);
    const readingTime = estimateReadingTime(plainText);
    const description = fm.description || "";
    const excerpt = description || buildExcerpt(plainText);

    entries.push({
      id: fm.id || slug,
      slug,
      title,
      type: fm.type || "",
      status: "Published",
      publishedAt: fm.date instanceof Date
        ? fm.date.toISOString().slice(0, 10)
        : fm.date ? String(fm.date).slice(0, 10) : "",
      content: processedMd.trim(),
      contentHtml,
      description: description || undefined,
      excerpt,
      readingTime,
      tags: fm.tags || [],
    });
  }

  // Sort by date descending
  entries.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  return entries;
}

// ─── Daily / 週報 sync ──────────────────────────────────────────────
async function syncProjects(): Promise<ProjectEntry[]> {
  const dailyFiles = await listMdFiles(VAULT_DAILY);
  const weeklyFiles = await listMdFiles(VAULT_WEEKLY);
  const entries: ProjectEntry[] = [];

  for (const file of [...dailyFiles, ...weeklyFiles]) {
    const raw = await readFile(file, "utf-8");
    const { data: fm, content: body } = matter(raw);

    if (fm.published === false) continue;

    const isWeekly = file.startsWith(VAULT_WEEKLY);
    const slug = fm.slug || path.basename(file, ".md");
    const title = fm.title || path.basename(file, ".md");
    const type = fm.type || (isWeekly ? "週報" : "");
    const sourceDir = isWeekly ? VAULT_WEEKLY : VAULT_DAILY;
    // Normalize date — gray-matter may parse bare dates as Date objects
    const rawDate = fm.date;
    const dateStr = rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : rawDate ? String(rawDate).slice(0, 10) : "";

    // Strip leading H1 if it matches frontmatter title (avoid duplicate)
    let cleanBody = body;
    const h1Match = cleanBody.match(/^\s*#\s+(.+)\n?/);
    if (h1Match) {
      const h1Text = h1Match[1].trim().replace(/\*{1,2}/g, "");
      if (h1Text === title.trim()) {
        cleanBody = cleanBody.replace(/^\s*#\s+.+\n?/, "");
      }
    }

    const { markdown: processedMd, coverImage } = await processImages(
      cleanBody,
      slug,
      sourceDir,
      "projects",
      PROJECT_ASSET_DIR,
      "/content/projects"
    );

    // Handle cover from frontmatter or first image
    let image: string | undefined;
    if (fm.cover) {
      // Try to copy cover image
      const coverFilename = fm.cover;
      const assetsDir = path.join(sourceDir, "_assets", slug);
      const candidates = [
        path.join(assetsDir, coverFilename),
        path.join(sourceDir, coverFilename),
      ];
      for (const candidate of candidates) {
        try {
          await stat(candidate);
          const destDir = path.join(PROJECT_ASSET_DIR, slug);
          await mkdir(destDir, { recursive: true });
          const dest = path.join(destDir, `cover${path.extname(coverFilename)}`);
          await copyFile(candidate, dest);
          image = `/content/projects/${slug}/cover${path.extname(coverFilename)}`;
          break;
        } catch {
          // try next
        }
      }
    }
    if (!image && coverImage) {
      image = coverImage;
    }

    const contentHtml = mdToHtml(processedMd);
    const plainText = stripMd(processedMd);
    const readingTime = estimateReadingTime(plainText);
    const description = fm.description || "";
    const excerpt = description || buildExcerpt(plainText);

    entries.push({
      title,
      description: description || excerpt,
      href: fm.href || "",
      slug,
      type,
      status: "Published",
      date: dateStr,
      image,
      content: processedMd.trim(),
      contentHtml,
      excerpt,
      readingTime,
    });
  }

  // Sort by date descending
  entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return entries;
}

// ─── Config sync ─────────────────────────────────────────────────────
const CONFIG_MAP: Record<string, Record<string, string>> = {
  "Home.md": {
    title: "HomepageHeroTitle",
    subtitle: "HomepageHeroSubtitle",
    cta: "HomepageCTA",
    intro: "HomepageIntro",
    murmur_intro: "HomepageMurmurIntro",
    murmur_cta: "HomepageMurmurCTA",
  },
  "About.md": {
    name: "AboutName",
    intro: "AboutPageIntro",
    // body → AboutPageBody (special: markdown body)
  },
  "Links.md": {
    title: "LinksPageTitle",
    intro: "LinksPageIntro",
  },
  "Footer.md": {
    text: "FooterText",
  },
  "Blog.md": {
    title: "BlogPageTitle",
    intro: "BlogPageIntro",
  },
  "Daily.md": {
    title: "ProjectsPageTitle",
    intro: "ProjectsPageIntro",
  },
};

async function syncConfig(): Promise<SiteConfig> {
  // Start with existing config to preserve values not yet in vault
  let existing: SiteConfig = {};
  try {
    const raw = await readFile(SITE_CONFIG_PATH, "utf-8");
    existing = JSON.parse(raw);
  } catch {
    // no existing config
  }

  const config: SiteConfig = { ...existing };

  if (!(await dirExists(VAULT_CONFIG))) {
    console.log("[sync-vault] Config dir not found, keeping existing config.json");
    return config;
  }

  const files = await readdir(VAULT_CONFIG);
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const raw = await readFile(path.join(VAULT_CONFIG, file), "utf-8");
    const { data: fm, content: body } = matter(raw);
    const mapping = CONFIG_MAP[file];
    if (!mapping) {
      console.warn(`[sync-vault] No config mapping for ${file}, skipping`);
      continue;
    }

    // Map frontmatter keys
    for (const [fmKey, configKey] of Object.entries(mapping)) {
      if (fm[fmKey] !== undefined) {
        config[configKey] = String(fm[fmKey]);
      }
    }

    // Special: About.md body → AboutPageBody
    if (file === "About.md" && body.trim()) {
      config["AboutPageBody"] = body.trim();
    }
  }

  return config;
}

// ─── write helpers ───────────────────────────────────────────────────
async function writeBlogEntries(entries: BlogEntry[]) {
  await mkdir(BLOG_DIR, { recursive: true });
  for (const entry of entries) {
    await writeFile(
      path.join(BLOG_DIR, `${entry.slug}.json`),
      JSON.stringify(entry, null, 2),
      "utf-8"
    );
  }
}

async function writeProjects(projects: ProjectEntry[]) {
  await mkdir(path.dirname(PROJECTS_PATH), { recursive: true });
  await writeFile(PROJECTS_PATH, JSON.stringify(projects, null, 2), "utf-8");
}

async function writeSiteConfig(config: SiteConfig) {
  await mkdir(path.dirname(SITE_CONFIG_PATH), { recursive: true });
  await writeFile(SITE_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// ─── main ────────────────────────────────────────────────────────────
async function main() {
  console.log("[sync-vault] Starting sync...");
  console.log(`[sync-vault] Vault: ${VAULT_BASE}`);

  const [blogEntries, projects, siteConfig] = await Promise.all([
    syncBlog(),
    syncProjects(),
    syncConfig(),
  ]);

  // Only write blog if we have entries (don't wipe existing data)
  if (blogEntries.length > 0) {
    await writeBlogEntries(blogEntries);
  } else {
    console.log("[sync-vault] No blog entries from vault (keeping existing).");
  }

  // Merge vault projects with existing (vault entries override by slug)
  {
    let existing: ProjectEntry[] = [];
    try {
      const raw = await readFile(PROJECTS_PATH, "utf-8");
      existing = JSON.parse(raw);
    } catch { /* no existing */ }

    // Build slug set from vault entries
    const vaultSlugs = new Set(projects.map(p => p.slug));
    // Keep existing entries whose slugs are NOT in vault (not yet migrated)
    const kept = existing.filter(e => !vaultSlugs.has(e.slug));
    const merged = [...projects, ...kept];
    // Sort by date descending
    merged.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    await writeProjects(merged);
    console.log(`[sync-vault] Projects: ${projects.length} from vault, ${kept.length} kept from existing, ${merged.length} total.`);
  }

  await writeSiteConfig(siteConfig);

  console.log(
    `[sync-vault] Done. Blog: ${blogEntries.length}, Projects: ${projects.length}, Config: updated.`
  );
}

main().catch((error) => {
  console.error("[sync-vault] Failed:", error);
  process.exit(1);
});
