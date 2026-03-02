interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '55%' : '100%', height: 14 }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="panel-padded" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton style={{ height: 16, width: '40%' }} />
      <SkeletonText lines={3} />
    </div>
  );
}
