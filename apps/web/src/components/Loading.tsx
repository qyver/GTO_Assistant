/** AI thinking indicator — minimal dots */
export function Loading({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="thinking">
      <div className="thinking-dots">
        <span />
        <span />
        <span />
      </div>
      <p className="thinking-label">{message}</p>
    </div>
  );
}

/** Skeleton placeholder for list/card areas */
export function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="skeleton" style={{ height: 16, width: '45%' }} />
      <div className="skeleton" style={{ height: 14, width: '100%' }} />
      <div className="skeleton" style={{ height: 14, width: '80%' }} />
      <div className="skeleton" style={{ height: 72, width: '100%', marginTop: 4 }} />
    </div>
  );
}
