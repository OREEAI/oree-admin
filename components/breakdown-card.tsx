"use client";

/**
 * BreakdownCard — one stacked distribution bar (parts of a whole) with a
 * swatch legend showing count + share. Shared by the dashboard and the
 * lead-database page.
 *
 * Known semantic labels (org statuses, validation states) get meaning
 * colors; everything else walks a brand ramp ranked by size, so the
 * biggest segment is coral and the rest recede toward navy tints.
 */

const SEMANTIC_COLORS: Record<string, string> = {
  // org / subscription statuses
  active: "#28C76F",
  trialing: "#F2A93B",
  trial: "#F2A93B",
  inactive: "#9BA6AF",
  cancelled: "#D33A1C",
  canceled: "#D33A1C",
  suspended: "#D33A1C",
  // lead validation states
  valid: "#28C76F",
  pending: "#F2A93B",
  invalid: "#D33A1C",
};

const RANKED_COLORS = ["#F24E2E", "#0B2740", "#52719C", "#F87457", "#A8BAD0"];

function prettify(label: string) {
  return label.replace(/_/g, " ");
}

export function BreakdownCard({
  title,
  rows,
  loading = false,
}: {
  title: string;
  rows: [string, number][];
  loading?: boolean;
}) {
  const total = rows.reduce((sum, [, n]) => sum + n, 0);

  const colorFor = (name: string, i: number) =>
    SEMANTIC_COLORS[name.toLowerCase()] ?? RANKED_COLORS[i % RANKED_COLORS.length];

  return (
    <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
      <div className="flex items-baseline justify-between">
        <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
          {title}
        </p>
        {!loading && total > 0 ? (
          <span className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
            {total.toLocaleString()} total
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      ) : rows.length === 0 || total === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No data yet.</p>
      ) : (
        <>
          {/* Single stacked distribution bar — parts of one whole. */}
          <div className="mt-4 flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-surface-soft">
            {rows.map(([name, count], i) => (
              <div
                key={name}
                title={`${prettify(name)}: ${count.toLocaleString()}`}
                style={{ width: `${(count / total) * 100}%`, backgroundColor: colorFor(name, i) }}
              />
            ))}
          </div>

          {/* Legend rows: swatch, label, count + share. */}
          <div className="mt-4 space-y-2.5">
            {rows.map(([name, count], i) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={name} className="flex items-center gap-2.5 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: colorFor(name, i) }}
                  />
                  <span className="capitalize text-ink">{prettify(name)}</span>
                  <span className="ml-auto font-code text-xs tabular-nums text-ink">
                    {count.toLocaleString()}
                  </span>
                  <span className="w-10 text-right font-code text-xs tabular-nums text-ink-soft">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
