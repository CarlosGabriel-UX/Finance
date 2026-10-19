export function Flash({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-down/40 bg-down/10 text-down" : "border-up/40 bg-up/10 text-up"}`}
    >
      {error ?? ok}
    </div>
  );
}
