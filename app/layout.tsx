import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { IndieWebWebring } from "@/components/layout/IndieWebWebring";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wilsonchao.com"),
  title: "趙玴祥 Wilson Chao — 心臟外科醫師・對世界好奇的人",
  description: "高醫心臟外科醫師的個人網站。寫手術室裡外的觀察、醫師生活反思、AI 工具如何改變日常。",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: "wilsonchao.com — All" },
        { url: "/blog/feed.xml", title: "wilsonchao.com — Blog" },
        { url: "/journal/feed.xml", title: "wilsonchao.com — Journal" },
        { url: "/stream/feed.xml", title: "wilsonchao.com — Stream" },
      ],
    },
  },
  openGraph: {
    title: "趙玴祥 Wilson Chao",
    description: "心臟外科醫師・對世界好奇的人",
    url: "https://wilsonchao.com",
    siteName: "wilsonchao.com",
    type: "website",
  },
  icons: {
    icon: "/avatar.png",
    apple: "/avatar.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <head>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SiteHeader />
        {children}
        <IndieWebWebring />
        <Analytics />
      </body>
    </html>
  );
}
