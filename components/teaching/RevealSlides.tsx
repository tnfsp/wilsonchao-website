"use client";

import { useEffect, useRef } from "react";

interface RevealSlidesProps {
  slidesHtml: string;
}

export default function RevealSlides({ slidesHtml }: RevealSlidesProps) {
  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<any>(null);

  useEffect(() => {
    async function initReveal() {
      const Reveal = (await import("reveal.js")).default;

      if (deckRef.current && !revealRef.current) {
        const deck = new Reveal(deckRef.current, {
          hash: true,
          slideNumber: true,
          controls: true,
          progress: true,
          center: true,
          transition: "slide",
          backgroundTransition: "fade",
          width: 1280,
          height: 720,
          margin: 0.08,
        });
        await deck.initialize();
        revealRef.current = deck;
      }
    }

    initReveal();

    return () => {
      if (revealRef.current) {
        revealRef.current.destroy();
        revealRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css"
      />
      <style>{`
        html, body { margin: 0; padding: 0; overflow: hidden; height: 100%; }
        .reveal { height: 100vh; }
        .reveal .slides { text-align: left; }
        .reveal h1 { font-size: 2.2em; color: #0a9396; }
        .reveal h2 { font-size: 1.6em; color: #94d2bd; margin-bottom: 0.5em; }
        .reveal h3 { font-size: 1.2em; color: #e9d8a6; }
        .reveal p, .reveal li { font-size: 0.85em; line-height: 1.6; }
        .reveal ul { list-style: none; padding-left: 0; }
        .reveal ul li::before { content: "▸ "; color: #0a9396; font-weight: bold; }
        .reveal .hook { font-size: 1.1em; color: #e9d8a6; font-style: italic; text-align: center; }
        .reveal .big-number { font-size: 3em; color: #0a9396; font-weight: bold; text-align: center; }
        .reveal .highlight { color: #ee9b00; font-weight: bold; }
        .reveal .danger { color: #ae2012; font-weight: bold; }
        .reveal .success { color: #0a9396; font-weight: bold; }
        .reveal table { font-size: 0.75em; width: 100%; border-collapse: collapse; margin: 0.5em 0; }
        .reveal th { background: #0a9396; color: #001219; padding: 8px 12px; text-align: left; }
        .reveal td { padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .reveal tr:hover td { background: rgba(255,255,255,0.05); }
        .reveal .emoji-big { font-size: 3em; text-align: center; margin: 0.3em 0; }
        .reveal .subtitle { color: #94d2bd; font-size: 0.9em; }
        .reveal .author { color: #666; font-size: 0.7em; margin-top: 1em; }
        .reveal .fragment.custom-fade { opacity: 0; transition: opacity 0.3s; }
        .reveal .fragment.custom-fade.visible { opacity: 1; }
        .reveal section[data-background-color="#001219"] { }
        .back-link { position: fixed; top: 16px; left: 16px; z-index: 100; color: #94d2bd; text-decoration: none; font-size: 14px; opacity: 0.6; transition: opacity 0.2s; }
        .back-link:hover { opacity: 1; }
      `}</style>
      <a href="/teaching" className="back-link">← 目錄</a>
      <div className="reveal" ref={deckRef}>
        <div
          className="slides"
          dangerouslySetInnerHTML={{ __html: slidesHtml }}
        />
      </div>
    </>
  );
}
