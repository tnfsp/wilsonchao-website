import type { Metadata } from "next";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export const metadata: Metadata = {
  title: "部落卷 /blogroll",
  description: "我推薦的獨立部落格。每個連結都是手工挑選，沒有演算法。",
  alternates: { canonical: `${BASE_URL}/blogroll` },
  openGraph: {
    title: "部落卷 /blogroll — Wilson Chao",
    description: "我推薦的獨立部落格。每個連結都是手工挑選，沒有演算法。",
    url: `${BASE_URL}/blogroll`,
    type: "website",
  },
};

type Blog = { name: string; url: string; description: string };
type Section = { id: string; label: string; blogs: Blog[] };

async function loadBlogroll(): Promise<Section[]> {
  const filePath = path.join(process.cwd(), "content", "blogroll.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);
  return data.sections;
}

export default async function BlogrollPage() {
  const sections = await loadBlogroll();

  return (
    <main className="page-shell space-y-10">
      <header className="space-y-2">
        <span className="section-title">Blogroll</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          部落卷
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          我推薦的獨立部落格。每個連結都是手工挑選，沒有演算法。
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.id} className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {section.label}
          </h2>
          <ul className="space-y-3">
            {section.blogs.map((blog) => (
              <li key={blog.url}>
                <Link
                  href={blog.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[0_8px_24px_rgba(0,18,25,0.04)] transition-colors hover:border-[var(--accent)]"
                >
                  <span className="font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                    {blog.name}
                  </span>
                  <span className="ml-2 text-sm text-[var(--muted)]">
                    {blog.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="pt-4 border-t border-[var(--border)] text-sm text-[var(--muted)]">
        <p>
          受{" "}
          <Link
            href="https://blogblog.club"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)] underline underline-offset-2 decoration-[var(--border)] hover:decoration-[var(--accent)]"
          >
            BlogBlog Club
          </Link>{" "}
          啟發，加入獨立部落格的串聯。
        </p>
      </footer>
    </main>
  );
}
