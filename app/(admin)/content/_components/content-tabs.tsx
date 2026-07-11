"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Posts", href: "/content/posts" },
  { label: "Authors", href: "/content/authors" },
  { label: "Resources", href: "/content/resources" },
];

/** Section tabs for the Content area (posts / authors / resources). */
export function ContentTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex gap-1 border-b border-surface-softer">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-4 py-2.5 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] transition-colors ${
              active
                ? "border-coral text-coral"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
