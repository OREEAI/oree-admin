export function TierBadge({ tier }: { tier?: string }) {
  if (!tier) return <span className="text-ink-soft">—</span>;
  return (
    <span className="inline-flex items-center rounded-full bg-ink/5 px-2.5 py-0.5 font-code text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-muted">
      {tier}
    </span>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-ink-soft">—</span>;
  const s = status.toLowerCase();
  const tone =
    s === "active"
      ? "bg-success/10 text-success"
      : s === "suspended" || s === "cancelled" || s === "canceled"
        ? "bg-coral/10 text-coral"
        : "bg-warning/15 text-warning";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-code text-[0.58rem] font-bold uppercase tracking-[0.16em] ${tone}`}
    >
      {status}
    </span>
  );
}
