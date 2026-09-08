export default function Loader({ label = "Loading..." }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-10"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"
        aria-hidden="true"
      />
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}
