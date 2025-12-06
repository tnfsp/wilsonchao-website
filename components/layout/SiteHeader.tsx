"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/murmur", label: "Murmur" },
  { href: "/daily", label: "Daily" },
  { href: "/about", label: "About" },
  { href: "/links", label: "Links" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="page-shell flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3" aria-label="Go to homepage">
          <Image
            src="/avatar.png"
            alt="Yi-Hsiang Chao portrait"
            width={56}
            height={56}
            className="h-14 w-14 rounded-full border border-[var(--border)] object-cover shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-[var(--muted)] md:flex">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[var(--accent)]">
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--foreground)] md:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          Menu
          <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
        </button>
      </header>

      {open ? (
        <div className="page-shell md:hidden">
          <div className="mb-3 rounded-lg border border-[var(--border)] bg-white/95 px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-2 text-sm text-[var(--foreground)]">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-2 py-1 hover:bg-[rgba(0,0,0,0.03)] hover:text-[var(--accent)]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
