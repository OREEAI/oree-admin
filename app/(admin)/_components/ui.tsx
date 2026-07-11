"use client";

import Link from "next/link";

/**
 * Shared console UI kit — the design language introduced with the navy
 * shell (Jul 2026): identity avatar chips, icon stat cards with tabular
 * numerals, eyebrow panels with divider detail rows, pill header
 * actions, semantic usage bars and role badges. Every admin page builds
 * from these so the console reads as one product.
 */

export function AvatarChip({
  label,
  className = "h-8 w-8 rounded-lg text-xs",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-navy-800 font-code font-bold text-white ${className}`}
    >
      {(label || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft transition-colors hover:text-coral"
    >
      ← {label}
    </Link>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value?: number | string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "success" | "danger";
}) {
  const num = typeof value === "number" ? value.toLocaleString() : (value ?? "—");
  return (
    <div className="relative rounded-xl border border-surface-softer bg-white px-4 py-3 shadow-soft-lift">
      {Icon ? (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md bg-coral-50 text-coral">
          <Icon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <p className="font-code text-[0.55rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
        {label}
      </p>
      <p
        className={`mt-1 font-code text-xl font-bold tabular-nums ${
          tone === "success" ? "text-success" : tone === "danger" ? "text-coral" : "text-ink"
        }`}
      >
        {num}
      </p>
      {hint ? <p className="mt-0.5 text-[0.7rem] text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
          {title}
        </p>
        {right}
      </div>
      {children}
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

export function DetailList({ children }: { children: React.ReactNode }) {
  return <dl className="mt-3 divide-y divide-surface-softer/70">{children}</dl>;
}

export function HeaderAction({
  icon: Icon,
  label,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-coral/40 bg-white text-coral hover:bg-coral hover:text-white"
          : "border-surface-softer bg-white text-ink-muted hover:border-coral hover:text-coral"
      }`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
}

export function UsageBar({ used, cap }: { used: number; cap: number }) {
  const pct = cap > 0 ? Math.min((used / cap) * 100, 100) : 0;
  const color = pct >= 90 ? "#D33A1C" : pct >= 70 ? "#F2A93B" : "#F24E2E";
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-soft">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function RoleBadge({ role }: { role?: string }) {
  if (!role) return <span className="text-ink-soft">—</span>;
  const r = role.toLowerCase();
  const tone =
    r === "super_admin"
      ? "bg-navy-800 text-white"
      : r === "org_admin"
        ? "bg-navy-100 text-navy-700"
        : r === "content_admin"
          ? "bg-coral/10 text-coral"
          : "bg-ink/5 text-ink-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-code text-[0.58rem] font-bold uppercase tracking-[0.16em] ${tone}`}
    >
      {role.replace(/_/g, " ")}
    </span>
  );
}

/** Generic neutral/semantic pill for arbitrary state strings (warmup
 * status, sequence stage, DNS state …). */
export function StatePill({ value }: { value?: string }) {
  if (!value) return <span className="text-ink-soft">—</span>;
  const v = value.toLowerCase();
  const good = [
    "active",
    "active_sequence",
    "completed",
    "verified",
    "sent",
    "delivered",
    "replied",
    "yes",
    "can send",
  ];
  const warn = ["warming", "pending", "running", "queued", "scheduled", "paused", "new"];
  const bad = ["failed", "bounced", "error", "invalid", "revoked", "suspended", "cancelled", "canceled", "no"];
  const tone = good.includes(v)
    ? "bg-success/10 text-success"
    : warn.includes(v)
      ? "bg-warning/15 text-warning"
      : bad.includes(v)
        ? "bg-coral/10 text-coral"
        : "bg-ink/5 text-ink-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-code text-[0.58rem] font-bold uppercase tracking-[0.16em] ${tone}`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
