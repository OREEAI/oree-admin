export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-white">
        Admin console
      </h1>
      <p className="mt-3 text-sm text-navy-200">
        More coming soon.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["Orgs", "Content", "Cleanup"].map((label) => (
          <div
            key={label}
            className="rounded-2xl border border-navy-700 bg-navy-800 p-6"
          >
            <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-coral">
              {label}
            </p>
            <p className="mt-2 text-sm text-navy-200">Placeholder.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
