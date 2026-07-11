/** Minimal, dependency-free loading fallback for lazy route boundaries. */
export default function AppLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        minHeight: '60vh',
        alignItems: 'center',
        justifyContent: 'center',
        font: '500 15px/1.4 system-ui, sans-serif',
        color: '#64748b',
      }}
    >
      Se încarcă…
    </div>
  );
}
