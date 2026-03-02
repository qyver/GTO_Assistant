import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { api } from '@/lib/api';

interface UserStats {
  today: {
    aiCalls: number;
    remaining: number;
  };
  allTime: {
    totalAiCalls: number;
    totalCostUsd: number;
    cacheHits: number;
    moduleUsage: Record<string, number>;
    avgResponseMs: number | null;
  };
}

const MODULE_LABELS: Record<string, { label: string; icon: string }> = {
  gto_spot:          { label: 'GTO Spot Lookups',    icon: '🎯' },
  gto_explain:       { label: 'GTO Explanations',    icon: '💡' },
  hand_analyze:      { label: 'Hand Analyses',        icon: '🔍' },
  training_generate: { label: 'Training Sessions',   icon: '💪' },
  board_info:        { label: 'Board Info Lookups',  icon: '🧠' },
};

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-start space-x-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-dark-muted mb-0.5">{label}</p>
        <p className="text-xl font-bold text-dark-text truncate">{value}</p>
        {sub && <p className="text-xs text-dark-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function Stats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getUserStats().then((result) => {
      if (result.success && result.data) {
        setStats(result.data as UserStats);
      } else {
        setError(result.error || 'Failed to load stats');
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading message="Loading stats..." />;

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-dark-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { today, allTime } = stats;
  const usedPercent = Math.round(((50 - today.remaining) / 50) * 100);
  const moduleEntries = Object.entries(allTime.moduleUsage).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold">📊 My Stats</h1>
        <p className="text-dark-muted text-sm mt-1">Your usage and activity overview</p>
      </div>

      {/* Today's AI quota */}
      <div>
        <h2 className="text-sm font-semibold text-dark-muted uppercase tracking-wide mb-3">Today's AI Quota</h2>
        <Card>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark-muted">AI calls used today</span>
              <span className="font-bold text-lg">{today.aiCalls} / 50</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-dark-border rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  usedPercent >= 90
                    ? 'bg-red-500'
                    : usedPercent >= 70
                    ? 'bg-yellow-500'
                    : 'bg-primary-500'
                }`}
                style={{ width: `${Math.min(100, usedPercent)}%` }}
              />
            </div>
            <p className="text-xs text-dark-muted">
              {today.remaining > 0
                ? `${today.remaining} calls remaining today`
                : 'Daily limit reached — resets tomorrow'}
            </p>
          </div>
        </Card>
      </div>

      {/* All-time summary */}
      <div>
        <h2 className="text-sm font-semibold text-dark-muted uppercase tracking-wide mb-3">All-Time Summary</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="🤖"
            label="Total AI Calls"
            value={allTime.totalAiCalls}
            sub={allTime.cacheHits > 0 ? `${allTime.cacheHits} from cache` : undefined}
          />
          <StatCard
            icon="💰"
            label="ChatGPT Cost"
            value={allTime.totalCostUsd < 0.0001 ? '$0.00' : `$${allTime.totalCostUsd.toFixed(4)}`}
            sub="estimated"
          />
          <StatCard
            icon="⚡"
            label="Avg Response"
            value={allTime.avgResponseMs ? `${allTime.avgResponseMs}ms` : '—'}
            sub="per request"
          />
          <StatCard
            icon="💾"
            label="Cache Hits"
            value={allTime.cacheHits}
            sub="saved API calls"
          />
        </div>
      </div>

      {/* Module usage breakdown */}
      {moduleEntries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-dark-muted uppercase tracking-wide mb-3">Activity by Module</h2>
          <Card>
            <div className="space-y-3">
              {moduleEntries.map(([event, count]) => {
                const meta = MODULE_LABELS[event] ?? { label: event, icon: '📌' };
                const maxCount = moduleEntries[0][1];
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={event}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm flex items-center gap-2">
                        <span>{meta.icon}</span>
                        <span className="text-dark-text">{meta.label}</span>
                      </span>
                      <span className="text-sm font-semibold text-dark-muted">{count}</span>
                    </div>
                    <div className="w-full bg-dark-border rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-primary-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {moduleEntries.length === 0 && allTime.totalAiCalls === 0 && (
        <Card className="text-center py-8">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold mb-1">No activity yet</p>
          <p className="text-sm text-dark-muted">Start using GTO Spot, Analyze Hand, or Training to see your stats here.</p>
        </Card>
      )}

      {/* Info note */}
      <Card className="bg-dark-card/50 border-dark-border/50">
        <p className="text-xs text-dark-muted text-center">
          Cost estimates based on ChatGPT API pricing for {' '}
          <span className="font-mono">gpt-4.1-mini</span>.
          Cache hits are free — identical queries reuse saved results for 24h.
        </p>
      </Card>
    </div>
  );
}
