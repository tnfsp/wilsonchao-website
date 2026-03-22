import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teaching — Wilson Chao",
  description: "心臟外科 Clerk 教學投影片",
};

export default function TeachingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
