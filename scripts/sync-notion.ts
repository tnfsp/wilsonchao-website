import { config as loadEnv } from "dotenv";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
  PartialBlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

loadEnv({ path: ".env.local" });

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
};

type ProjectEntry = {
  title: string;
  description?: string;
  href?: string;
  slug?: string;
  type?: string;
  status?: string;
  date?: string;
};

type SiteConfig = Record<string, string>;

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SITE_CONFIG_PATH = path.join(process.cwd(), "content", "site", "config.json");
const PROJECTS_PATH = path.join(process.cwd(), "content", "projects.json");

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return undefined;
  }
  return value.trim();
}

const NOTION_TOKEN = getEnv("NOTION_TOKEN");
const BLOG_DATABASE_ID = getEnv("NOTION_BLOG_DATABASE_ID");
const SITE_CONFIG_DATABASE_ID = getEnv("NOTION_SITE_CONFIG_DATABASE_ID");
const PROJECTS_DATABASE_ID = getEnv("NOTION_PROJECTS_DATABASE_ID");

if (!NOTION_TOKEN || !BLOG_DATABASE_ID || !SITE_CONFIG_DATABASE_ID) {
  console.warn(
    [
      "[sync-notion] Missing environment variables.",
      "Required: NOTION_TOKEN, NOTION_BLOG_DATABASE_ID, NOTION_SITE_CONFIG_DATABASE_ID.",
      "Skipping sync. Set env vars and re-run `npm run sync:notion`.",
    ].join(" ")
  );
  process.exit(0);
}

const notion = new Client({ auth: NOTION_TOKEN });

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function isFullBlock(
  block: ListBlockChildrenResponse["results"][number]
): block is BlockObjectResponse {
  return "type" in block && block.object === "block";
}

function textFromRichText(richText: RichTextItemResponse[]): string {
  return richText.map((item) => item.plain_text ?? "").join("");
}

function titleFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type !== "title") return "";
  return textFromRichText(property.title);
}

function richTextFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type !== "rich_text") return "";
  return textFromRichText(property.rich_text);
}

function selectFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type !== "select" || !property.select) return "";
  return property.select.name ?? "";
}

function dateFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type !== "date" || !property.date) return "";
  return property.date.start ?? "";
}

function convertBlockToMarkdown(block: BlockObjectResponse): string {
  switch (block.type) {
    case "heading_1":
      return `# ${textFromRichText(block.heading_1.rich_text)}`;
    case "heading_2":
      return `## ${textFromRichText(block.heading_2.rich_text)}`;
    case "heading_3":
      return `### ${textFromRichText(block.heading_3.rich_text)}`;
    case "paragraph":
      return textFromRichText(block.paragraph.rich_text);
    case "bulleted_list_item":
      return `- ${textFromRichText(block.bulleted_list_item.rich_text)}`;
    case "numbered_list_item":
      return `1. ${textFromRichText(block.numbered_list_item.rich_text)}`;
    case "quote":
      return `> ${textFromRichText(block.quote.rich_text)}`;
    case "callout":
      return `> ${textFromRichText(block.callout.rich_text)}`;
    case "divider":
      return "---";
    default:
      return "";
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function convertBlockToHtml(block: BlockObjectResponse): string {
  const toHtml = (rich: RichTextItemResponse[]) => escapeHtml(textFromRichText(rich));

  switch (block.type) {
    case "heading_1":
      return `<h1>${toHtml(block.heading_1.rich_text)}</h1>`;
    case "heading_2":
      return `<h2>${toHtml(block.heading_2.rich_text)}</h2>`;
    case "heading_3":
      return `<h3>${toHtml(block.heading_3.rich_text)}</h3>`;
    case "paragraph":
      return `<p>${toHtml(block.paragraph.rich_text)}</p>`;
    case "bulleted_list_item":
      return `<ul><li>${toHtml(block.bulleted_list_item.rich_text)}</li></ul>`;
    case "numbered_list_item":
      return `<ol><li>${toHtml(block.numbered_list_item.rich_text)}</li></ol>`;
    case "quote":
      return `<blockquote>${toHtml(block.quote.rich_text)}</blockquote>`;
    case "callout":
      return `<blockquote>${toHtml(block.callout.rich_text)}</blockquote>`;
    case "divider":
      return "<hr />";
    default:
      return "";
  }
}

function plainTextFromBlock(block: BlockObjectResponse): string {
  switch (block.type) {
    case "heading_1":
      return textFromRichText(block.heading_1.rich_text);
    case "heading_2":
      return textFromRichText(block.heading_2.rich_text);
    case "heading_3":
      return textFromRichText(block.heading_3.rich_text);
    case "paragraph":
      return textFromRichText(block.paragraph.rich_text);
    case "bulleted_list_item":
      return textFromRichText(block.bulleted_list_item.rich_text);
    case "numbered_list_item":
      return textFromRichText(block.numbered_list_item.rich_text);
    case "quote":
      return textFromRichText(block.quote.rich_text);
    case "callout":
      return textFromRichText(block.callout.rich_text);
    default:
      return "";
  }
}

function estimateReadingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return "";
  const minutes = Math.max(1, Math.round(words / 180));
  return `${minutes} min`;
}

function buildExcerpt(text: string) {
  const plain = text.replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length > 200 ? `${plain.slice(0, 200)}...` : plain;
}

async function fetchAllBlocks(blockId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    response.results.forEach((block: BlockObjectResponse | PartialBlockObjectResponse) => {
      if (isFullBlock(block)) {
        blocks.push(block);
      }
    });
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return blocks;
}

async function fetchBlogEntries(): Promise<BlogEntry[]> {
  const response = await notion.databases.query({
    database_id: BLOG_DATABASE_ID!,
    filter: {
      property: "Status",
      select: { equals: "Published" },
    },
    sorts: [
      {
        property: "PublishedAt",
        direction: "descending",
      },
    ],
  });

  const entries: BlogEntry[] = [];

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const typedPage = page as PageObjectResponse;
    const props = typedPage.properties;
    const title = titleFromProperty(props.Title);
    const rawSlug = richTextFromProperty(props.Slug);
    const slug = normalizeSlug(rawSlug || title || typedPage.id);
    const type = selectFromProperty(props.Type);
    const status = selectFromProperty(props.Status);
    const publishedAt = dateFromProperty(props.PublishedAt);
    const description =
      richTextFromProperty(props.Description ?? props.Summary ?? props.Excerpt) || "";

    if (!slug) {
      console.warn(`[sync-notion] Skipping page without slug: ${typedPage.id}`);
      continue;
    }

    const blocks = await fetchAllBlocks(typedPage.id);
    const content = blocks.map(convertBlockToMarkdown).filter(Boolean).join("\n\n");
    const contentHtml = blocks.map(convertBlockToHtml).filter(Boolean).join("\n");
    const plainText = blocks.map(plainTextFromBlock).filter(Boolean).join(" ");
    const readingTime = estimateReadingTime(plainText);
    const excerpt = buildExcerpt(plainText);

    entries.push({
      id: typedPage.id,
      slug,
      title,
      type,
      status,
      publishedAt,
      content,
      contentHtml,
      description: description || undefined,
      excerpt: description || excerpt,
      readingTime,
    });
  }

  return entries;
}

async function writeBlogEntries(entries: BlogEntry[]) {
  await mkdir(BLOG_DIR, { recursive: true });
  await Promise.all(
    entries.map((entry) =>
      writeFile(
        path.join(BLOG_DIR, `${entry.slug}.json`),
        JSON.stringify(entry, null, 2),
        "utf-8"
      )
    )
  );
}

async function fetchSiteConfig(): Promise<SiteConfig> {
  const response = await notion.databases.query({
    database_id: SITE_CONFIG_DATABASE_ID!,
  });

  const config: SiteConfig = {};

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const typedPage = page as PageObjectResponse;
    const props = typedPage.properties;
    const key = titleFromProperty(props.Key);
    const value = richTextFromProperty(props.Value);
    if (!key) continue;
    config[key] = value;
  }

  return config;
}

async function writeSiteConfig(config: SiteConfig) {
  await mkdir(path.dirname(SITE_CONFIG_PATH), { recursive: true });
  await writeFile(SITE_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

function urlFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type === "url") return property.url || "";
  return "";
}

async function fetchProjects(): Promise<ProjectEntry[]> {
  if (!PROJECTS_DATABASE_ID) {
    console.warn("[sync-notion] Missing NOTION_PROJECTS_DATABASE_ID. Skipping projects sync.");
    return [];
  }

  const response = await notion.databases.query({
    database_id: PROJECTS_DATABASE_ID,
  });

  const projects: ProjectEntry[] = [];

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const typedPage = page as PageObjectResponse;
    const props = typedPage.properties;
    const title = titleFromProperty(props.Title);
    const description = richTextFromProperty(props.Description ?? props.Summary ?? props.Body);
    const href =
      richTextFromProperty(props.Link ?? props.URL ?? props.Href) || urlFromProperty(props.Link);
    const slug = normalizeSlug(richTextFromProperty(props.Slug) || title || typedPage.id);
    const type = selectFromProperty(props.Type);
    const status = selectFromProperty(props.Status);
    const date = dateFromProperty(props.Date);

    if (!title) continue;

    projects.push({
      title,
      description,
      href,
      slug,
      type,
      status,
      date,
    });
  }

  return projects;
}

async function writeProjects(projects: ProjectEntry[]) {
  await mkdir(path.dirname(PROJECTS_PATH), { recursive: true });
  await writeFile(PROJECTS_PATH, JSON.stringify(projects, null, 2), "utf-8");
}

async function main() {
  console.log("[sync-notion] Starting sync...");
  const [blogEntries, siteConfig, projects] = await Promise.all([
    fetchBlogEntries(),
    fetchSiteConfig(),
    fetchProjects(),
  ]);

  await writeBlogEntries(blogEntries);
  await writeSiteConfig(siteConfig);
  if (projects.length > 0) {
    await writeProjects(projects);
  } else {
    console.log("[sync-notion] No projects synced (missing DB or no rows).");
  }

  console.log(
    `[sync-notion] Done. Wrote ${blogEntries.length} blog entries, ${
      projects.length
    } projects, and site config to content/.`
  );
}

main().catch((error) => {
  console.error("[sync-notion] Failed:", error);
  process.exit(1);
});
