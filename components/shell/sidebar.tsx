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
import { OreeWordmark } from "@/components/brand/oree-logo";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: FiHome }],
  },
  {
    label: "Customers",
    items: [
      { label: "Orgs", href: "/orgs", icon: FiGrid },
      { label: "Users", href: "/users", icon: FiUsers },
      { label: "Database", href: "/database", icon: FiDatabase },
    ],
  },
  {
    label: "Sending",
    items: [
      { label: "Mailboxes", href: "/mailboxes", icon: FiMail },
      { label: "Domains", href: "/domains", icon: FiGlobe },
      { label: "Campaigns", href: "/campaigns", icon: FiSend },
    ],
  },
  {
    label: "Marketing",
    items: [{ label: "Content", href: "/content", icon: FiActivity }],
  },
  {
    label: "System",
    items: [
      { label: "Cleanup", href: "/cleanup", icon: FiTrash2 },
      { label: "Webhooks", href: "/webhooks", icon: FiZap },
    ],
  },
];

// Content admins (blog authors) see the dashboard + Content section only.
const CONTENT_ADMIN_GROUPS: NavGroup[] = NAV_GROUPS.map((group) => ({
  ...group,
  items: group.items.filter((item) => item.href === "/" || item.href === "/content"),
})).filter((group) => group.items.length > 0);

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const groups = role === "content_admin" ? CONTENT_ADMIN_GROUPS : NAV_GROUPS;

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-navy-900 text-white">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <OreeWordmark className="h-7 w-auto text-white" />
        <span className="rounded bg-coral px-1.5 py-0.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.22em] text-white/35">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/55 hover:bg-white/5 hover:text-white/90",
                    )}
                  >
                    {isActive ? (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-coral" />
                    ) : null}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-coral" : "text-white/40 group-hover:text-white/70",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="font-code text-[0.55rem] uppercase tracking-[0.2em] text-white/30">
          Internal tooling
        </p>
      </div>
    </aside>
  );
}
