import { loadSiteCopy } from "@/lib/content";

export default async function AboutPage() {
  const copy = await loadSiteCopy();

  return (
    <main className="page-shell space-y-6">
      <header className="space-y-3">
        <span className="section-title">About</span>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-4">
            {copy.aboutImage ? (
              // Use plain img to avoid remote domain config; suggest storing in /public.
              <img
                src={copy.aboutImage}
                alt="Portrait"
                className="h-20 w-20 rounded-full border border-[var(--border)] object-cover"
                loading="lazy"
              />
            ) : null}
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-[var(--foreground)]">{copy.aboutName}</h1>
              <p className="max-w-2xl text-base text-[var(--muted)]">{copy.aboutIntro}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4 text-[var(--muted)]">
        <p className="whitespace-pre-wrap leading-relaxed">{copy.aboutBody}</p>
      </div>
    </main>
  );
}
