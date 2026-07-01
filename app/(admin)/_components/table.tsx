// Shared table primitives for the admin management pages (mailboxes, domains,
// campaigns). Kept in one place so every list reads the same.

export function AdminTh({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`py-2.5 text-left font-code text-[0.6rem] font-bold uppercase tracking-[0.15em] text-ink-soft ${className}`}
    >
      {children}
    </th>
  );
}

export function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  if (!label) return <span className="text-ink-soft">—</span>;
  const toneClass =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : tone === "danger"
          ? "bg-coral/10 text-coral"
          : "bg-ink/5 text-ink-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-code text-[0.58rem] font-bold uppercase tracking-[0.16em] ${toneClass}`}
    >
      {label}
    </span>
  );
}
