"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiActivity,
  FiDatabase,
  FiGlobe,
  FiGrid,
  FiHome,
  FiMail,
  FiSend,
  FiTrash2,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: FiHome },
  { label: "Orgs", href: "/orgs", icon: FiGrid },
  { label: "Users", href: "/users", icon: FiUsers },
  { label: "Database", href: "/database", icon: FiDatabase },
  { label: "Mailboxes", href: "/mailboxes", icon: FiMail },
  { label: "Domains", href: "/domains", icon: FiGlobe },
  { label: "Campaigns", href: "/campaigns", icon: FiSend },
  { label: "Content", href: "/content", icon: FiActivity },
  { label: "Cleanup", href: "/cleanup", icon: FiTrash2 },
  { label: "Webhooks", href: "/webhooks", icon: FiZap },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-softer bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-surface-softer px-6">
        <span className="font-code text-sm font-bold uppercase tracking-[0.22em] text-coral">
          Oree
        </span>
        <span className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-coral-50 text-coral-700"
                  : "text-ink-muted hover:bg-surface-soft hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-softer p-4">
        <p className="font-code text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft">
          Internal tooling
        </p>
      </div>
    </aside>
  );
}
