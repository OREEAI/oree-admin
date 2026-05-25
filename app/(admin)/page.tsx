export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Admin console
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        More coming soon.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["Orgs", "Content", "Cleanup"].map((label) => (
          <div
            key={label}
            className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift"
          >
            <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-coral">
              {label}
            </p>
            <p className="mt-2 text-sm text-ink-muted">Placeholder.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
