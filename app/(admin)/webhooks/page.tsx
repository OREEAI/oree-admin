export default function WebhooksPage() {
  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Webhooks
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Inspect and replay integration webhook events (provider, status,
        payload).
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-surface-softer bg-white p-8 text-center">
        <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-coral">
          Coming soon
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
          The webhook event log + replay view lands once the backend persists
          webhook events (a paginated event store + replay endpoint). Until
          then there&apos;s nothing to show here.
        </p>
      </div>
    </div>
  );
}
