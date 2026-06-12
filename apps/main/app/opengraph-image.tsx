import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "趙玴祥 Wilson Chao — 心臟外科醫師・對世界好奇的人";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default Open Graph image for wilsonchao.com.
 *
 * Uses subset TTFs of Noto Sans TC (in /assets) because the ImageResponse
 * default font has no CJK glyphs. The subsets only contain the exact
 * characters rendered below (~9KB each) — if you change any text here,
 * regenerate the subsets via the Google Fonts `text=` API.
 */
export default async function Image() {
  const [fontBold, fontMedium] = await Promise.all([
    readFile(join(process.cwd(), "assets", "noto-sans-tc-700-subset.ttf")),
    readFile(join(process.cwd(), "assets", "noto-sans-tc-500-subset.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          backgroundColor: "#f8f4ea",
          fontFamily: "Noto Sans TC",
          position: "relative",
        }}
      >
        {/* Decorative corner accents */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 10,
            display: "flex",
            backgroundColor: "#0a9396",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -120,
            bottom: -120,
            width: 360,
            height: 360,
            display: "flex",
            borderRadius: 360,
            border: "3px solid #ca6702",
            opacity: 0.25,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 40,
            bottom: 40,
            width: 240,
            height: 240,
            display: "flex",
            borderRadius: 240,
            border: "3px solid #0a9396",
            opacity: 0.18,
          }}
        />

        {/* Accent bar above title */}
        <div
          style={{
            width: 88,
            height: 8,
            display: "flex",
            borderRadius: 4,
            backgroundColor: "#ca6702",
            marginBottom: 36,
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            color: "#001219",
            lineHeight: 1.2,
          }}
        >
          趙玴祥 Wilson Chao
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 38,
            fontWeight: 500,
            color: "#0a9396",
            marginTop: 24,
          }}
        >
          心臟外科醫師・對世界好奇的人
        </div>

        <div
          style={{
            position: "absolute",
            left: 96,
            bottom: 56,
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 500,
            color: "#ca6702",
          }}
        >
          wilsonchao.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans TC",
          data: fontBold,
          weight: 700,
          style: "normal",
        },
        {
          name: "Noto Sans TC",
          data: fontMedium,
          weight: 500,
          style: "normal",
        },
      ],
    }
  );
}
