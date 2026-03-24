"use client";

import Link from "next/link";

interface Props {
  scenarioId: string;
  title: string;
  subtitle: string;
}

const identities = [
  {
    key: "lite" as const,
    icon: "\uD83D\uDC65",
    label: "\u6211\u662F\u4E00\u822C\u6C11\u773E",
    sublabel: "Lite \u2014 \u4E92\u52D5\u6545\u4E8B",
    description: "5 \u5206\u9418\u4E92\u52D5\u9AD4\u9A57\uFF0C\u9078\u64C7\u5F71\u97FF\u7D50\u5C40\u3002\u4E0D\u9700\u91AB\u5B78\u77E5\u8B58\u3002",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
    bgColor: "bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08]",
    labelColor: "text-emerald-400",
    badge: "LITE",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    comingSoon: true,
  },
  {
    key: "standard" as const,
    icon: "\uD83E\uDE7A",
    label: "\u6211\u662F\u91AB\u5B78\u751F",
    sublabel: "Standard \u2014 \u6559\u5B78\u6A21\u5F0F",
    description: "\u7C21\u5316\u64CD\u4F5C + \u8B77\u7406\u5E2B\u5F15\u5C0E\u3002\u6709\u6559\u5B78\u63D0\u793A\uFF0C\u6709\u642F\u6551\u7A97\u53E3\u3002",
    borderColor: "border-amber-500/20 hover:border-amber-500/40",
    bgColor: "bg-amber-500/[0.03] hover:bg-amber-500/[0.08]",
    labelColor: "text-amber-400",
    badge: "STANDARD",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    comingSoon: true,
  },
  {
    key: "pro" as const,
    icon: "\u2694\uFE0F",
    label: "\u6211\u662F\u4F4F\u9662\u91AB\u5E2B / Fellow",
    sublabel: "Pro \u2014 \u5BE6\u6230\u6A21\u5F0F",
    description: "\u5B8C\u6574\u81EA\u7531\u5EA6\u3002\u81EA\u5DF1\u5224\u65B7\u3001\u81EA\u5DF1\u958B order\u3001\u81EA\u5DF1\u627F\u64D4\u5F8C\u679C\u3002",
    borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
    bgColor: "bg-cyan-500/[0.03] hover:bg-cyan-500/[0.08]",
    labelColor: "text-cyan-400",
    badge: "PRO",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    comingSoon: false,
  },
] as const;

export default function DifficultySelect({ scenarioId, title, subtitle }: Props) {
  return (
    <div className="min-h-screen bg-[#001219] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">\uD83C\uDFAE</div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-400 mt-1">{subtitle}</p>
          <p className="text-gray-500 text-sm mt-4">\u4F60\u662F\u8AB0\uFF1F</p>
        </div>

        <div className="space-y-4">
          {identities.map((id) => {
            const href = `/teaching/simulator/${scenarioId}/${id.key}`;

            return (
              <Link
                key={id.key}
                href={href}
                className={`block w-full text-left ${id.bgColor} border ${id.borderColor} rounded-xl p-5 transition-all group relative`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl mt-0.5">{id.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${id.badgeClass}`}>
                        {id.badge}
                      </span>
                      <span className={`font-bold group-hover:${id.labelColor} transition text-white`}>
                        {id.label}
                      </span>
                    </div>
                    <div className={`text-sm ${id.labelColor} mb-1`}>{id.sublabel}</div>
                    <div className="text-gray-400 text-sm">{id.description}</div>
                  </div>
                  <span className="text-gray-600 group-hover:text-white text-xl transition mt-1">
                    &rarr;
                  </span>
                </div>
                {id.comingSoon && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/10">
                      Coming Soon
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/teaching/simulator"
            className="text-gray-500 hover:text-white transition text-sm"
          >
            &larr; \u8FD4\u56DE\u60C5\u5883\u5217\u8868
          </Link>
        </div>
      </div>
    </div>
  );
}
